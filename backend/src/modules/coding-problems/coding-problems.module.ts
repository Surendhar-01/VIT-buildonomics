import { Module } from '@nestjs/common';
import { CodingProblemsService } from './coding-problems.service';
import { CodingProblemsController } from './coding-problems.controller';
import { CodeExecutionModule } from '../code-execution/code-execution.module';
import { AiModule } from '../ai/ai.module';
import { CredentialsModule } from '../credentials/credentials.module';

@Module({
  imports: [CodeExecutionModule, AiModule, CredentialsModule],
  controllers: [CodingProblemsController],
  providers: [CodingProblemsService],
  exports: [CodingProblemsService],
})
export class CodingProblemsModule {}
