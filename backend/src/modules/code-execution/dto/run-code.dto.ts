import { IsNotEmpty, IsString, IsIn, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TestCaseDto {
  @ApiProperty({ example: '[2,7,11,15]\\n9' })
  @IsString()
  input: string;

  @ApiProperty({ example: '[0, 1]' })
  @IsString()
  expectedOutput: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  isHidden?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  weight?: number;
}

export class RunCodeDto {
  @ApiProperty({ example: 'javascript', enum: ['javascript', 'python', 'java'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['javascript', 'python', 'java'])
  language: string;

  @ApiProperty({ example: 'const fs = require("fs"); console.log("Hello");' })
  @IsString()
  @IsNotEmpty()
  sourceCode: string;

  @ApiPropertyOptional({ example: '5\n10' })
  @IsString()
  @IsOptional()
  input?: string;

  @ApiPropertyOptional({ type: [TestCaseDto] })
  @IsArray()
  @IsOptional()
  testCases?: TestCaseDto[];
}
