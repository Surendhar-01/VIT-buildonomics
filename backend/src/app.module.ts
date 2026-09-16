import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { SkillsModule } from './modules/skills/skills.module';
import { PortfoliosModule } from './modules/portfolios/portfolios.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { CodingProblemsModule } from './modules/coding-problems/coding-problems.module';
import { AssessmentsModule } from './modules/assessments/assessments.module';
import { CodeExecutionModule } from './modules/code-execution/code-execution.module';
import { AiModule } from './modules/ai/ai.module';
import { CredentialsModule } from './modules/credentials/credentials.module';
import { VerificationModule } from './modules/verification/verification.module';
import { RecruitersModule } from './modules/recruiters/recruiters.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    DatabaseModule,
    AuthModule,
    ProfilesModule,
    SkillsModule,
    PortfoliosModule,
    ProjectsModule,
    CodingProblemsModule,
    AssessmentsModule,
    CodeExecutionModule,
    AiModule,
    CredentialsModule,
    VerificationModule,
    RecruitersModule,
    AdminModule,
  ],
})
export class AppModule {}
