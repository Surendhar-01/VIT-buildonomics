import { IsNotEmpty, IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CandidateSearchFilterDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  query?: string;

  @ApiPropertyOptional({ example: 'React,Node.js' })
  @IsOptional()
  skills?: any;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  credentialType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  minScore?: string;
}

export class CreateShortlistDto {
  @ApiProperty({ example: 'Q3 High-Potential Full-Stack Candidates' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;
}

export class AddCandidateToShortlistDto {
  @ApiProperty({ example: 'demo-student-uuid' })
  @IsString()
  @IsNotEmpty()
  candidateId: string;

  @ApiPropertyOptional({ example: 'Top 5% in Algorithmic benchmark. Excellent project portfolio.' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class OpportunityRequestDto {
  @ApiProperty({ example: 'demo-student-uuid' })
  @IsString()
  @IsNotEmpty()
  candidateId: string;

  @ApiProperty({ example: 'Full Stack Engineer Position @ TechCorp' })
  @IsString()
  @IsNotEmpty()
  jobTitle: string;

  @ApiProperty({ example: 'We were very impressed by your verified SkillProof credentials.' })
  @IsString()
  @IsNotEmpty()
  message: string;
}
