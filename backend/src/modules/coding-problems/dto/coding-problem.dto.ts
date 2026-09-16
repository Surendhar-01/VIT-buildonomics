import { IsNotEmpty, IsString, IsOptional, IsArray, IsIn, IsBoolean, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCodingProblemDto {
  @ApiProperty({ example: 'Two Sum Problem' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'two-sum-problem' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'easy', enum: ['easy', 'medium', 'hard'] })
  @IsString()
  @IsIn(['easy', 'medium', 'hard'])
  difficulty: string;

  @ApiProperty({ example: 'algorithms' })
  @IsString()
  category: string;

  @ApiProperty({ example: ['javascript', 'python'] })
  @IsArray()
  supportedLanguages: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  constraints?: string;

  @ApiPropertyOptional()
  @IsOptional()
  starterCode?: Record<string, string>;
}

export class AddTestCaseDto {
  @ApiProperty({ example: '[2,7,11,15]\\n9' })
  @IsString()
  @IsNotEmpty()
  inputData: string;

  @ApiProperty({ example: '[0, 1]' })
  @IsString()
  @IsNotEmpty()
  expectedOutput: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isHidden?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  weight?: number;
}

export class SubmitCodeDto {
  @ApiProperty({ example: 'javascript' })
  @IsString()
  @IsNotEmpty()
  language: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sourceCode: string;

  @ApiPropertyOptional({ example: 'attempt-uuid' })
  @IsString()
  @IsOptional()
  attemptId?: string;
}
