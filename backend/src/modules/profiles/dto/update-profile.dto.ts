import { IsOptional, IsString, IsInt, IsIn, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  full_name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  avatar_url?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  headline?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  education?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  institution?: string;

  @ApiPropertyOptional()
  @IsOptional()
  graduationYear?: any;

  @ApiPropertyOptional()
  @IsOptional()
  graduation_year?: any;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  experience?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  certifications?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  githubUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  github_url?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  linkedinUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  linkedin_url?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  resumeUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  resume_url?: string;

  @ApiPropertyOptional({ enum: ['public', 'private', 'recruiters_only'] })
  @IsString()
  @IsOptional()
  @IsIn(['public', 'private', 'recruiters_only'])
  visibility?: string;

  @ApiPropertyOptional()
  @IsOptional()
  skills?: any;

  @ApiPropertyOptional()
  @IsOptional()
  completenessScore?: any;
}

export class AddSkillDto {
  @ApiPropertyOptional()
  @IsString()
  skillName: string;

  @ApiPropertyOptional({ enum: ['beginner', 'intermediate', 'advanced', 'expert'] })
  @IsString()
  @IsIn(['beginner', 'intermediate', 'advanced', 'expert'])
  proficiencyLevel: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  evidenceDescription?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  category?: string;
}
