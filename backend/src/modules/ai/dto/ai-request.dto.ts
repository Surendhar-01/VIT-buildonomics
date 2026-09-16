import { IsNotEmpty, IsString, IsOptional, IsArray, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateBioDto {
  @ApiProperty({ example: 'Alex Vance' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'Full-Stack Developer' })
  @IsString()
  @IsNotEmpty()
  targetRole: string;

  @ApiProperty({ example: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'] })
  @IsArray()
  skills: string[];

  @ApiPropertyOptional({ example: 'Built a real-time analytics dashboard and distributed logger' })
  @IsString()
  @IsOptional()
  keyAchievements?: string;

  @ApiPropertyOptional({ example: 'professional' })
  @IsString()
  @IsOptional()
  tone?: string;
}

export class GenerateProjectSummaryDto {
  @ApiProperty({ example: 'HyperLog Observability' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: ['TypeScript', 'Node.js', 'Redis'] })
  @IsArray()
  technologies: string[];

  @ApiPropertyOptional({ example: 'https://github.com/example/hyperlog' })
  @IsString()
  @IsOptional()
  repoUrl?: string;

  @ApiPropertyOptional({ example: 'Stream processing pipeline for ingesting high frequency log streams' })
  @IsString()
  @IsOptional()
  rawNotes?: string;
}

export class CodingFeedbackDto {
  @ApiProperty({ example: 'Two Sum Problem' })
  @IsString()
  @IsNotEmpty()
  problemTitle: string;

  @ApiProperty({ example: 'javascript' })
  @IsString()
  @IsNotEmpty()
  language: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sourceCode: string;

  @ApiProperty({ example: 4 })
  passedCount: number;

  @ApiProperty({ example: 4 })
  totalCount: number;

  @ApiProperty({ example: 125 })
  executionTimeMs: number;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  testResults?: any[];
}

export class SkillGapDto {
  @ApiProperty({ example: 'Senior Backend Engineer' })
  @IsString()
  @IsNotEmpty()
  targetRole: string;

  @ApiProperty({ example: ['JavaScript', 'HTML/CSS', 'Basic React'] })
  @IsArray()
  currentSkills: string[];

  @ApiPropertyOptional({ example: 'Must have strong experience with distributed queues, PostgreSQL, Docker, and CI/CD pipelines' })
  @IsString()
  @IsOptional()
  jobDescription?: string;
}

export class AnalyzeResumeDto {
  @ApiProperty({ example: 'Suren - Full Stack Developer with React, Node.js, PostgreSQL...' })
  @IsString()
  @IsNotEmpty()
  resumeText: string;

  @ApiPropertyOptional({ example: 'resume.pdf' })
  @IsString()
  @IsOptional()
  fileName?: string;
}

export class ApplyResumeDto {
  @ApiProperty()
  @IsObject()
  parsedData: any;
}

export class AssessmentRecommendationDto {
  @ApiProperty({ example: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'] })
  @IsArray()
  skills: string[];

  @ApiPropertyOptional({ example: 'Full-Stack Developer' })
  @IsString()
  @IsOptional()
  targetRole?: string;
}
