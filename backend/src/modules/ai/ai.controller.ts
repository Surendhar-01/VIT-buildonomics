import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AiService } from './ai.service';
import {
  AnalyzeResumeDto,
  ApplyResumeDto,
  CodingFeedbackDto,
  GenerateBioDto,
  GenerateProjectSummaryDto,
  SkillGapDto,
} from './dto/ai-request.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('AI Copilot')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('portfolio-description')
  @Public()
  @ApiOperation({ summary: 'Generate professional bio and headline' })
  async generateBio(@Body() dto: GenerateBioDto) {
    return this.aiService.generateBio(dto);
  }

  @Post('project-summary')
  @Public()
  @ApiOperation({ summary: 'Generate structured project summary and highlights' })
  async generateProjectSummary(@Body() dto: GenerateProjectSummaryDto) {
    return this.aiService.generateProjectSummary(dto);
  }

  @Post('coding-feedback')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate structured AI feedback for code submission' })
  async generateCodingFeedback(@Body() dto: CodingFeedbackDto) {
    return this.aiService.generateCodingFeedback(dto);
  }

  @Post('skill-gap-analysis')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Analyze skills against target role and generate learning roadmap' })
  async generateSkillGapAnalysis(@Body() dto: SkillGapDto) {
    return this.aiService.generateSkillGapAnalysis(dto);
  }

  @Post('analyze-resume')
  @Public()
  @ApiOperation({ summary: 'Analyze resume and extract skills, headline, bio, and projects' })
  async analyzeResume(@Body() dto: AnalyzeResumeDto) {
    return this.aiService.analyzeResume(dto);
  }

  @Post('apply-resume-data')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Apply extracted resume data to candidate profile' })
  async applyResumeData(@Req() req: any, @Body() dto: ApplyResumeDto) {
    const userId = req.user?.id || req.user?.sub || 'demo-student-uuid';
    return this.aiService.applyResumeData(userId, dto.parsedData);
  }
}
