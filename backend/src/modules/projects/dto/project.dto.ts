import { IsNotEmpty, IsString, IsOptional, IsArray, IsBoolean, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({ example: 'HyperLog Observability Engine' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'https://github.com/example/hyperlog' })
  @IsString()
  @IsOptional()
  repositoryUrl?: string;

  @ApiPropertyOptional({ example: 'https://hyperlog.demo.skillproof.io' })
  @IsString()
  @IsOptional()
  liveUrl?: string;

  @ApiProperty({ example: ['TypeScript', 'Node.js', 'Redis', 'React'] })
  @IsArray()
  technologies: string[];

  @ApiPropertyOptional({ example: 'Distributed Systems' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contributionDetails?: string;

  @ApiPropertyOptional({ enum: ['in_progress', 'completed', 'archived'] })
  @IsString()
  @IsOptional()
  @IsIn(['in_progress', 'completed', 'archived'])
  status?: string;

  @ApiPropertyOptional({ enum: ['public', 'private'] })
  @IsString()
  @IsOptional()
  @IsIn(['public', 'private'])
  visibility?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;
}

export class UpdateProjectDto extends CreateProjectDto {}

export class GitHubSyncDto {
  @ApiProperty({ example: 'https://github.com/facebook/react' })
  @IsString()
  @IsNotEmpty()
  repoUrl: string;
}
