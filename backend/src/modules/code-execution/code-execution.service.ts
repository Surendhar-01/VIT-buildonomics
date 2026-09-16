import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { RunCodeDto, TestCaseDto } from './dto/run-code.dto';

export interface SingleExecutionResult {
  stdout: string;
  stderr: string;
  executionTimeMs: number;
  status: 'passed' | 'failed' | 'timeout' | 'runtime_error' | 'compile_error';
  exitCode: number | null;
}

export interface TestCaseEvaluationResult {
  testCaseIndex: number;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  isHidden: boolean;
  status: 'passed' | 'failed' | 'timeout' | 'runtime_error';
  executionTimeMs: number;
  error?: string;
}

export interface BatchExecutionResult {
  overallStatus: 'passed' | 'failed' | 'timeout' | 'runtime_error' | 'compile_error';
  passedCount: number;
  totalCount: number;
  percentage: number;
  totalTimeMs: number;
  results: TestCaseEvaluationResult[];
}

@Injectable()
export class CodeExecutionService {
  private readonly logger = new Logger(CodeExecutionService.name);
  private readonly baseSandboxDir = path.join(process.cwd(), 'scratch', 'sandbox-runs');
  private readonly defaultTimeoutMs = 5000;
  private readonly maxBufferBytes = 64 * 1024; // 64 KB

  constructor() {
    if (!fs.existsSync(this.baseSandboxDir)) {
      fs.mkdirSync(this.baseSandboxDir, { recursive: true });
    }
  }

  async runSingle(language: string, sourceCode: string, input: string = ''): Promise<SingleExecutionResult> {
    const runId = uuidv4();
    const sandboxDir = path.join(this.baseSandboxDir, runId);
    fs.mkdirSync(sandboxDir, { recursive: true });

    try {
      return await this.executeInSandbox(language, sourceCode, input, sandboxDir);
    } finally {
      // Ephemeral cleanup
      try {
        fs.rmSync(sandboxDir, { recursive: true, force: true });
      } catch (err) {
        this.logger.warn(`Could not clean up sandbox ${sandboxDir}: ${err.message}`);
      }
    }
  }

  async evaluateSubmission(dto: RunCodeDto): Promise<BatchExecutionResult> {
    const { language, sourceCode, testCases = [] } = dto;
    const runId = uuidv4();
    const sandboxDir = path.join(this.baseSandboxDir, runId);
    fs.mkdirSync(sandboxDir, { recursive: true });

    const results: TestCaseEvaluationResult[] = [];
    let passedCount = 0;
    let totalTimeMs = 0;
    let worstStatus: 'passed' | 'failed' | 'timeout' | 'runtime_error' | 'compile_error' = 'passed';

    try {
      for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        const exec = await this.executeInSandbox(language, sourceCode, tc.input, sandboxDir);
        totalTimeMs += exec.executionTimeMs;

        const actual = exec.stdout.replace(/\r\n/g, '\n').trim();
        const expected = tc.expectedOutput.replace(/\r\n/g, '\n').trim();
        
        let passed = false;
        let status: 'passed' | 'failed' | 'timeout' | 'runtime_error' = 'failed';

        if (exec.status === 'timeout') {
          status = 'timeout';
          worstStatus = 'timeout';
        } else if (exec.status === 'runtime_error') {
          status = 'runtime_error';
          if (worstStatus !== 'timeout') worstStatus = 'runtime_error';
        } else {
          // Normalize JSON or string matching
          passed = this.compareOutputs(actual, expected);
          status = passed ? 'passed' : 'failed';
          if (!passed && worstStatus === 'passed') {
            worstStatus = 'failed';
          }
        }

        if (passed) {
          passedCount++;
        }

        results.push({
          testCaseIndex: i + 1,
          input: tc.isHidden ? '[HIDDEN TEST CASE]' : tc.input,
          expectedOutput: tc.isHidden ? '[HIDDEN TEST CASE]' : tc.expectedOutput,
          actualOutput: tc.isHidden && !passed ? '[OUTPUT CONCEALED ON HIDDEN FAILURE]' : actual,
          passed,
          isHidden: !!tc.isHidden,
          status,
          executionTimeMs: exec.executionTimeMs,
          error: exec.stderr ? exec.stderr.slice(0, 500) : undefined,
        });
      }
    } finally {
      try {
        fs.rmSync(sandboxDir, { recursive: true, force: true });
      } catch (err) {
        this.logger.warn(`Could not clean up sandbox ${sandboxDir}: ${err.message}`);
      }
    }

    const totalCount = testCases.length;
    const percentage = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 100;

    return {
      overallStatus: passedCount === totalCount && totalCount > 0 ? 'passed' : worstStatus,
      passedCount,
      totalCount,
      percentage,
      totalTimeMs,
      results,
    };
  }

  private compareOutputs(actual: string, expected: string): boolean {
    if (actual === expected) return true;
    // Attempt relaxed whitespace/json compare
    try {
      const parsedActual = JSON.parse(actual);
      const parsedExpected = JSON.parse(expected);
      return JSON.stringify(parsedActual) === JSON.stringify(parsedExpected);
    } catch {
      return actual.replace(/\s+/g, ' ') === expected.replace(/\s+/g, ' ');
    }
  }

  private async executeInSandbox(
    language: string,
    sourceCode: string,
    stdinData: string,
    sandboxDir: string,
  ): Promise<SingleExecutionResult> {
    const lang = language.toLowerCase();
    let command: string;
    let args: string[];

    if (lang === 'javascript' || lang === 'node') {
      const filePath = path.join(sandboxDir, 'main.js');
      fs.writeFileSync(filePath, sourceCode, 'utf8');
      command = 'node';
      args = ['--max-old-space-size=128', filePath];
    } else if (lang === 'python' || lang === 'py') {
      const filePath = path.join(sandboxDir, 'main.py');
      fs.writeFileSync(filePath, sourceCode, 'utf8');
      command = process.platform === 'win32' ? 'python' : 'python3';
      args = ['-u', filePath];
    } else if (lang === 'java') {
      const filePath = path.join(sandboxDir, 'Main.java');
      fs.writeFileSync(filePath, sourceCode, 'utf8');
      command = 'java';
      args = [filePath];
    } else {
      return {
        stdout: '',
        stderr: `Unsupported language: ${language}`,
        executionTimeMs: 0,
        status: 'runtime_error',
        exitCode: 1,
      };
    }

    return new Promise((resolve) => {
      const startTime = Date.now();
      let stdout = '';
      let stderr = '';
      let isTimeout = false;

      const proc = spawn(command, args, {
        cwd: sandboxDir,
        env: {
          PATH: process.env.PATH,
          NODE_ENV: 'production',
        },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      const timer = setTimeout(() => {
        isTimeout = true;
        try {
          proc.kill('SIGKILL');
        } catch {
          // ignore
        }
      }, this.defaultTimeoutMs);

      if (proc.stdin) {
        if (stdinData) {
          proc.stdin.write(stdinData);
        }
        proc.stdin.end();
      }

      proc.stdout.on('data', (data) => {
        if (stdout.length < this.maxBufferBytes) {
          stdout += data.toString();
        }
      });

      proc.stderr.on('data', (data) => {
        if (stderr.length < this.maxBufferBytes) {
          stderr += data.toString();
        }
      });

      proc.on('error', (err) => {
        clearTimeout(timer);
        resolve({
          stdout: '',
          stderr: `Process launch failed: ${err.message}`,
          executionTimeMs: Date.now() - startTime,
          status: 'runtime_error',
          exitCode: 1,
        });
      });

      proc.on('close', (code) => {
        clearTimeout(timer);
        const executionTimeMs = Date.now() - startTime;

        if (isTimeout) {
          return resolve({
            stdout: stdout.trim(),
            stderr: 'Execution timed out (exceeded limit of 5000ms)',
            executionTimeMs,
            status: 'timeout',
            exitCode: null,
          });
        }

        const hasError = code !== 0 || stderr.length > 0;
        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          executionTimeMs,
          status: hasError ? 'runtime_error' : 'passed',
          exitCode: code,
        });
      });
    });
  }
}
