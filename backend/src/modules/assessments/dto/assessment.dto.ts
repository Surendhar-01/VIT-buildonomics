import { IsNotEmpty, IsString, IsInt, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAssessmentDto {
  @ApiProperty({ example: 'Full-Stack Algorithmic Benchmark' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 3600 })
  @IsInt()
  durationSeconds: number;

  @ApiProperty({ example: 'intermediate' })
  @IsString()
  difficulty: string;

  @ApiProperty({ example: 'Full Stack Engineering' })
  @IsString()
  category: string;

  @ApiPropertyOptional({ example: ['prob-two-sum', 'prob-valid-parens'] })
  @IsArray()
  @IsOptional()
  problemIds?: string[];
}

export class SubmitAssessmentDto {
  @ApiProperty({ example: 'attempt-uuid' })
  @IsString()
  @IsNotEmpty()
  attemptId: string;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  submissions?: any[];
}
