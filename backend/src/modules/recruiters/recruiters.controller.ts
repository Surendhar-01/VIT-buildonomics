import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RecruitersService } from './recruiters.service';
import {
  AddCandidateToShortlistDto,
  CandidateSearchFilterDto,
  CreateShortlistDto,
  OpportunityRequestDto,
} from './dto/recruiter.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Recruiters')
@Controller('recruiters')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('recruiter', 'admin')
@ApiBearerAuth()
export class RecruitersController {
  constructor(private readonly recruitersService: RecruitersService) {}

  @Get('candidates')
  @ApiOperation({ summary: 'Search public candidates with verified skills and credentials' })
  async searchCandidates(@Query() filters: CandidateSearchFilterDto) {
    return this.recruitersService.searchCandidates(filters);
  }

  @Get('shortlists')
  @ApiOperation({ summary: 'List recruiter candidate shortlists' })
  async getShortlists(@CurrentUser('id') recruiterId: string) {
    return this.recruitersService.getShortlists(recruiterId);
  }

  @Post('shortlists')
  @ApiOperation({ summary: 'Create a candidate shortlist' })
  async createShortlist(
    @CurrentUser('id') recruiterId: string,
    @Body() dto: CreateShortlistDto,
  ) {
    return this.recruitersService.createShortlist(recruiterId, dto);
  }

  @Post('shortlists/:id/candidates')
  @ApiOperation({ summary: 'Add a candidate to a shortlist with private recruiter notes' })
  async addCandidateToShortlist(
    @CurrentUser('id') recruiterId: string,
    @Param('id') shortlistId: string,
    @Body() dto: AddCandidateToShortlistDto,
  ) {
    return this.recruitersService.addCandidateToShortlist(recruiterId, shortlistId, dto);
  }

  @Post('opportunities')
  @ApiOperation({ summary: 'Send an interview invitation or job opportunity to a candidate' })
  async sendOpportunityRequest(
    @CurrentUser('id') recruiterId: string,
    @Body() dto: OpportunityRequestDto,
  ) {
    return this.recruitersService.sendOpportunityRequest(recruiterId, dto);
  }
}
