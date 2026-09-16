import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsArray, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePortfolioDto {
  @ApiProperty({ example: 'Alex Vance — Software Portfolio' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'alex-vance' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({ example: 'modern-minimal' })
  @IsString()
  @IsOptional()
  template?: string;

  @ApiPropertyOptional({ example: 'dark-indigo' })
  @IsString()
  @IsOptional()
  theme?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  sections?: any[];
}

export class UpdatePortfolioDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  template?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  theme?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  sections?: any[];
}
