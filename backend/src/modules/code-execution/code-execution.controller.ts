import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CodeExecutionService } from './code-execution.service';
import { RunCodeDto } from './dto/run-code.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Code Execution')
@Controller('code-execution')
export class CodeExecutionController {
  constructor(private readonly executionService: CodeExecutionService) {}

  @Post('run')
  @Public()
  @ApiOperation({ summary: 'Run a code snippet directly in isolated sandbox' })
  @ApiResponse({ status: 200, description: 'Execution output and execution time' })
  async runSingleSnippet(@Body() dto: RunCodeDto) {
    return this.executionService.runSingle(dto.language, dto.sourceCode, dto.input || '');
  }

  @Post('evaluate')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Evaluate code against a list of test cases' })
  @ApiResponse({ status: 200, description: 'Evaluation breakdown with pass percentage' })
  async evaluateSubmission(@Body() dto: RunCodeDto) {
    return this.executionService.evaluateSubmission(dto);
  }
}
