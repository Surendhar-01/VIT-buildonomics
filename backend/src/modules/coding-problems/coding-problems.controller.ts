import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CodingProblemsService } from './coding-problems.service';
import {
  AddTestCaseDto,
  CreateCodingProblemDto,
  SubmitCodeDto,
} from './dto/coding-problem.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Coding Problems')
@Controller('coding-problems')
export class CodingProblemsController {
  constructor(private readonly problemsService: CodingProblemsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List all published coding problems' })
  async getAllProblems(
    @Query('difficulty') difficulty?: string,
    @Query('category') category?: string,
  ) {
    return this.problemsService.getAllProblems(difficulty, category);
  }

  @Get(':idOrSlug')
  @Public()
  @ApiOperation({ summary: 'Get coding problem details with public sample test cases' })
  async getProblemById(@Param('idOrSlug') idOrSlug: string) {
    return this.problemsService.getProblemById(idOrSlug);
  }

  @Post()
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new coding problem (Admin)' })
  async createProblem(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCodingProblemDto,
  ) {
    return this.problemsService.createProblem(dto, userId);
  }

  @Post(':id/test-cases')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a public or hidden test case (Admin)' })
  async addTestCase(
    @Param('id') problemId: string,
    @Body() dto: AddTestCaseDto,
  ) {
    return this.problemsService.addTestCase(problemId, dto);
  }

  @Post(':id/run')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Run code against public sample test cases' })
  async runSampleTests(
    @Param('id') problemId: string,
    @Body() dto: SubmitCodeDto,
  ) {
    return this.problemsService.runSampleTests(problemId, dto);
  }

  @Post(':id/submit')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit solution against all test cases and trigger AI evaluation' })
  async submitSolution(
    @Param('id') problemId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SubmitCodeDto,
  ) {
    return this.problemsService.submitSolution(problemId, userId, dto);
  }
}
