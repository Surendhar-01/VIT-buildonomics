import { IsEmail, IsNotEmpty, IsString, MinLength, IsIn, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'alex@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Secret123!' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Alex Vance' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'student', enum: ['student', 'recruiter', 'issuer'] })
  @IsString()
  @IsIn(['student', 'recruiter', 'issuer'])
  role: string;

  @ApiPropertyOptional({ example: 'Vellore Institute of Technology' })
  @IsString()
  @IsOptional()
  institutionName?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'alex@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Secret123!' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({ example: 'student', enum: ['student', 'recruiter', 'issuer', 'admin'] })
  @IsString()
  @IsOptional()
  role?: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'alex@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
