import { Module } from '@nestjs/common';
import { AssessmentsService } from './assessments.service';
import { AssessmentsController } from './assessments.controller';
import { AiModule } from '../ai/ai.module';
import { CredentialsModule } from '../credentials/credentials.module';

@Module({
  imports: [AiModule, CredentialsModule],
  controllers: [AssessmentsController],
  providers: [AssessmentsService],
  exports: [AssessmentsService],
})
export class AssessmentsModule {}
