import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CodeExecutionService } from '../code-execution/code-execution.service';
import { AiService } from '../ai/ai.service';
import {
  AddTestCaseDto,
  CreateCodingProblemDto,
  SubmitCodeDto,
} from './dto/coding-problem.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CodingProblemsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly executionService: CodeExecutionService,
    private readonly aiService: AiService,
  ) {}

  async getAllProblems(difficulty?: string, category?: string) {
    let list: any[] = [];
    if (this.db.isUsingSupabase && this.db.client) {
      let query = this.db.client.from('coding_problems').select('*').eq('status', 'published');
      if (difficulty) query = query.eq('difficulty', difficulty);
      if (category) query = query.eq('category', category);
      const { data } = await query;
      list = data || [];
    }

    let memoryList = Array.from(this.db.inMemory.codingProblems.values()).filter(
      (p) => p.status === 'published',
    );
    if (difficulty) memoryList = memoryList.filter((p) => p.difficulty === difficulty);
    if (category) memoryList = memoryList.filter((p) => p.category === category);

    const existingIds = new Set(list.map((p) => p.id));
    for (const mp of memoryList) {
      if (!existingIds.has(mp.id)) {
        list.push(mp);
      }
    }
    return list;
  }

  async getProblemById(idOrSlug: string) {
    let problem: any = null;

    if (this.db.isUsingSupabase && this.db.client) {
      const { data } = await this.db.client
        .from('coding_problems')
        .select('*')
        .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
        .single();
      problem = data;
    }

    if (!problem) {
      problem =
        this.db.inMemory.codingProblems.get(idOrSlug) ||
        Array.from(this.db.inMemory.codingProblems.values()).find(
          (p) => p.slug === idOrSlug || p.id === idOrSlug,
        );
    }

    if (!problem) {
      throw new NotFoundException(`Coding problem not found`);
    }

    // Return only PUBLIC test cases to client
    const testCases = await this.getTestCases(problem.id, false);

    return {
      ...problem,
      sampleTestCases: testCases,
    };
  }

  async createProblem(dto: CreateCodingProblemDto, userId?: string) {
    const id = uuidv4();
    const problem = {
      id,
      title: dto.title,
      slug: dto.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      description: dto.description,
      difficulty: dto.difficulty,
      category: dto.category,
      supported_languages: dto.supportedLanguages || ['javascript', 'python'],
      constraints: dto.constraints || '',
      starter_code: dto.starterCode || {},
      evaluation_type: 'standard_io',
      status: 'published',
      created_by: userId || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (this.db.isUsingSupabase && this.db.client) {
      const { data, error } = await this.db.client
        .from('coding_problems')
        .insert(problem)
        .select()
        .single();
      if (error) throw new BadRequestException(error.message);
      return data;
    }

    this.db.inMemory.codingProblems.set(id, problem);
    return problem;
  }

  async addTestCase(problemId: string, dto: AddTestCaseDto) {
    const id = uuidv4();
    const testCase = {
      id,
      problem_id: problemId,
      input_data: dto.inputData,
      expected_output: dto.expectedOutput,
      is_hidden: dto.isHidden ?? false,
      weight: dto.weight ?? 1,
      created_at: new Date().toISOString(),
    };

    if (this.db.isUsingSupabase && this.db.client) {
      const { data, error } = await this.db.client
        .from('coding_test_cases')
        .insert(testCase)
        .select()
        .single();
      if (error) throw new BadRequestException(error.message);
      return data;
    }

    const list = this.db.inMemory.codingTestCases.get(problemId) || [];
    list.push(testCase);
    this.db.inMemory.codingTestCases.set(problemId, list);
    return testCase;
  }

  /**
   * Run only sample / public test cases
   */
  async runSampleTests(problemId: string, dto: SubmitCodeDto) {
    const problem = await this.getProblemById(problemId);
    const publicTestCases = await this.getTestCases(problem.id, false);

    const testCasesForRunner = publicTestCases.map((tc) => ({
      input: tc.input_data,
      expectedOutput: tc.expected_output,
      isHidden: false,
    }));

    return this.executionService.evaluateSubmission({
      language: dto.language,
      sourceCode: dto.sourceCode,
      testCases: testCasesForRunner,
    });
  }

  /**
   * Submit against ALL test cases (public + hidden) and generate AI feedback
   */
  async submitSolution(problemId: string, userId: string, dto: SubmitCodeDto) {
    const problem = await this.getProblemById(problemId);
    const allTestCases = await this.getTestCases(problem.id, true);

    const testCasesForRunner = allTestCases.map((tc) => ({
      input: tc.input_data,
      expectedOutput: tc.expected_output,
      isHidden: tc.is_hidden,
    }));

    const executionResult = await this.executionService.evaluateSubmission({
      language: dto.language,
      sourceCode: dto.sourceCode,
      testCases: testCasesForRunner,
    });

    const submissionId = uuidv4();
    const submissionRecord = {
      id: submissionId,
      attempt_id: dto.attemptId || null,
      problem_id: problem.id,
      candidate_id: userId,
      language: dto.language,
      source_code: dto.sourceCode,
      execution_status: executionResult.overallStatus,
      passed_test_cases: executionResult.passedCount,
      total_test_cases: executionResult.totalCount,
      execution_time_ms: executionResult.totalTimeMs,
      submitted_at: new Date().toISOString(),
    };

    // Store submission
    if (this.db.isUsingSupabase && this.db.client) {
      await this.db.client.from('coding_submissions').insert(submissionRecord);
    } else {
      this.db.inMemory.codingSubmissions.set(submissionId, submissionRecord);
    }

    // Generate AI feedback asynchronously or synchronously
    const aiFeedback = await this.aiService.generateCodingFeedback({
      problemTitle: problem.title,
      language: dto.language,
      sourceCode: dto.sourceCode,
      passedCount: executionResult.passedCount,
      totalCount: executionResult.totalCount,
      executionTimeMs: executionResult.totalTimeMs,
      testResults: executionResult.results,
    });

    const feedbackRecord = {
      id: uuidv4(),
      submission_id: submissionId,
      feedback_type: 'code_review',
      content: aiFeedback,
      model_name: aiFeedback.model,
      created_at: new Date().toISOString(),
    };

    if (this.db.isUsingSupabase && this.db.client) {
      await this.db.client.from('ai_feedback').insert(feedbackRecord);
    } else {
      this.db.inMemory.aiFeedback.set(submissionId, feedbackRecord);
    }

    return {
      submissionId,
      execution: executionResult,
      aiFeedback,
    };
  }

  private async getTestCases(problemId: string, includeHidden: boolean) {
    if (this.db.isUsingSupabase && this.db.client) {
      let query = this.db.client.from('coding_test_cases').select('*').eq('problem_id', problemId);
      if (!includeHidden) {
        query = query.eq('is_hidden', false);
      }
      const { data } = await query;
      return data || [];
    }

    const list = this.db.inMemory.codingTestCases.get(problemId) || [];
    if (!includeHidden) {
      return list.filter((tc) => !tc.is_hidden);
    }
    return list;
  }
}
