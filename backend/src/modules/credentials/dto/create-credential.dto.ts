import { IsNotEmpty, IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCredentialDto {
  @ApiProperty({ example: 'demo-student-uuid' })
  @IsString()
  @IsNotEmpty()
  recipientId: string;

  @ApiProperty({ example: 'Certified Algorithmic Problem Solver' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Awarded for demonstrating algorithmic excellence' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'Pass Full-Stack Algorithmic Benchmark with >= 90% score' })
  @IsString()
  @IsNotEmpty()
  criteria: string;

  @ApiProperty({ example: 'assessment_achievement' })
  @IsString()
  @IsNotEmpty()
  credentialType: string;

  @ApiPropertyOptional({ example: { assessmentScore: 95, rank: 'Top 5%' } })
  @IsObject()
  @IsOptional()
  achievementData?: Record<string, any>;

  @ApiPropertyOptional({ example: 'tmpl-algo-master' })
  @IsString()
  @IsOptional()
  templateId?: string;

  @ApiPropertyOptional({ example: '2028-12-31T23:59:59Z' })
  @IsString()
  @IsOptional()
  expiresAt?: string;
}

export class RevokeCredentialDto {
  @ApiProperty({ example: 'Found fraudulent test case manipulation' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
