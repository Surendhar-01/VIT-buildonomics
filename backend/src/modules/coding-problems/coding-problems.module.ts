import { Module } from '@nestjs/common';
import { CodingProblemsService } from './coding-problems.service';
import { CodingProblemsController } from './coding-problems.controller';
import { CodeExecutionModule } from '../code-execution/code-execution.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [CodeExecutionModule, AiModule],
  controllers: [CodingProblemsController],
  providers: [CodingProblemsService],
  exports: [CodingProblemsService],
})
export class CodingProblemsModule {}
