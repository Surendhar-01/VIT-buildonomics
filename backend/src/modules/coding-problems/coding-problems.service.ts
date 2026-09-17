import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CodeExecutionService } from '../code-execution/code-execution.service';
import { AiService } from '../ai/ai.service';
import { CredentialsService } from '../credentials/credentials.service';
import {
  AddTestCaseDto,
  CreateCodingProblemDto,
  SubmitCodeDto,
} from './dto/coding-problem.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CodingProblemsService {
  private readonly logger = new Logger(CodingProblemsService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly executionService: CodeExecutionService,
    private readonly aiService: AiService,
    private readonly credentialsService: CredentialsService,
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

    // Automatically issue Ed25519 Verifiable Digital Credential on successful submission
    const totalCount = executionResult.totalCount || 1;
    const passedCount = executionResult.passedCount || 0;
    const passPercentage = Math.round((passedCount / totalCount) * 100);
    const isSuccess = executionResult.overallStatus === 'passed' || passPercentage >= 50;

    let issuedCredential: any = null;
    if (isSuccess && userId) {
      try {
        issuedCredential = await this.credentialsService.issueCredential(
          'institution-vit',
          'VIT Technical Assessment Board',
          {
            recipientId: userId,
            title: `Certified Algorithmic Problem Solver: ${problem.title}`,
            description: `Officially awarded for demonstrating optimal algorithmic execution in ${problem.title} with a ${passPercentage}% test case pass rate in the verified sandbox environment.`,
            criteria: `Achieved ${passedCount}/${totalCount} test case pass rate (${passPercentage}%) with ${executionResult.totalTimeMs}ms execution time in ${dto.language.toUpperCase()}.`,
            credentialType: 'assessment_achievement',
            achievementData: {
              problemId: problem.id,
              problemTitle: problem.title,
              category: problem.category || 'Algorithms',
              difficulty: problem.difficulty || 'intermediate',
              language: dto.language,
              score: passPercentage,
              passRate: `${passPercentage}%`,
              passedCount,
              totalCount,
              executionTimeMs: executionResult.totalTimeMs,
              timeComplexity: aiFeedback?.complexityAnalysis?.timeComplexity || 'O(N)',
              spaceComplexity: aiFeedback?.complexityAnalysis?.spaceComplexity || 'O(N)',
              verifiedAt: new Date().toISOString(),
            },
          },
        );
        this.logger.log(
          `Issued Ed25519 digital credential (${issuedCredential.credential_id}) for candidate ${userId} on solving ${problem.title}`,
        );
      } catch (credErr) {
        this.logger.warn(`Could not issue credential for coding problem submission: ${credErr.message}`);
      }
    }

    return {
      submissionId,
      execution: executionResult,
      aiFeedback,
      credential: issuedCredential,
    };
  }

  private async getTestCases(problemId: string, includeHidden: boolean) {
    if (this.db.isUsingSupabase && this.db.client) {
      let query = this.db.client.from('coding_test_cases').select('*').eq('problem_id', problemId);
      if (!includeHidden) {
        query = query.eq('is_hidden', false);
      }
      const { data } = await query;
      if (data && data.length > 0) {
        return data;
      }
    }

    const list = this.db.inMemory.codingTestCases.get(problemId) || [];
    if (!includeHidden) {
      return list.filter((tc) => !tc.is_hidden);
    }
    return list;
  }
}
