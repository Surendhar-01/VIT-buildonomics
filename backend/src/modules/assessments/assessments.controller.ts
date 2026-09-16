import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AssessmentsService } from './assessments.service';
import { CreateAssessmentDto, SubmitAssessmentDto } from './dto/assessment.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AiService } from '../ai/ai.service';

@ApiTags('Assessments')
@Controller('assessments')
export class AssessmentsController {
  constructor(
    private readonly assessmentsService: AssessmentsService,
    private readonly aiService: AiService,
  ) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List all active assessments' })
  async getAllAssessments() {
    return this.assessmentsService.getAllAssessments();
  }

  @Get('me/attempts')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current candidate assessment attempts' })
  async getMyAttempts(@CurrentUser('id') userId: string) {
    return this.assessmentsService.getMyAttempts(userId);
  }

  @Get('attempts/:attemptId/result')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get detailed report for an assessment attempt' })
  async getAttemptResult(@Param('attemptId') attemptId: string) {
    return this.assessmentsService.getAttemptResult(attemptId);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get assessment details with problem list' })
  async getAssessmentById(@Param('id') id: string) {
    return this.assessmentsService.getAssessmentById(id);
  }

  @Post(':id/start')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start a timed assessment attempt' })
  async startAssessment(
    @Param('id') id: string,
    @CurrentUser('id') candidateId: string,
  ) {
    return this.assessmentsService.startAssessment(id, candidateId);
  }

  @Post(':id/submit')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit assessment for scoring' })
  async submitAssessment(
    @Param('id') id: string,
    @CurrentUser('id') candidateId: string,
    @Body() dto: SubmitAssessmentDto,
  ) {
    return this.assessmentsService.submitAssessment(dto, candidateId);
  }

  @Post()
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new assessment benchmark (Admin)' })
  async createAssessment(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateAssessmentDto,
  ) {
    return this.assessmentsService.createAssessment(dto, userId);
  }

  @Get('recommended')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get personalized assessment recommendations based on profile skills' })
  async getRecommendedAssessments(@CurrentUser('id') userId: string) {
    const profile = await this.assessmentsService.getProfileWithSkills(userId);
    const skills = profile?.skills?.map((s: any) => s.name) || [];
    const targetRole = profile?.headline || 'Full-Stack Software Engineer';

    const recommendations = await this.aiService.recommendAssessmentsFromResume({
      skills,
      targetRole,
    });

    const assessments = await this.assessmentsService.getAssessmentsByCategories(
      recommendations.map((r: any) => r.category)
    );

    return assessments.map((a: any) => {
      const rec = recommendations.find((r: any) => r.category === a.category);
      return {
        ...a,
        recommendationReason: rec?.reason,
        priority: rec?.priority,
        matchedSkills: rec?.matchedSkills,
      };
    });
  }
}
