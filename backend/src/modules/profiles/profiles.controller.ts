import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';
import { AddSkillDto, UpdateProfileDto } from './dto/update-profile.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Profiles')
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile and completeness metrics' })
  async getMyProfile(@CurrentUser('id') userId: string) {
    return this.profilesService.getMyProfile(userId);
  }

  @Patch('me')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update profile details' })
  async updateMyProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profilesService.updateMyProfile(userId, dto);
  }

  @Post('me/skills')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a verified skill with evidence' })
  async addSkill(@CurrentUser('id') userId: string, @Body() dto: AddSkillDto) {
    return this.profilesService.addSkill(userId, dto);
  }

  @Delete('me/skills/:skillId')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a skill from profile' })
  async removeSkill(
    @CurrentUser('id') userId: string,
    @Param('skillId') skillId: string,
  ) {
    return this.profilesService.removeSkill(userId, skillId);
  }

  @Delete('me/resume')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clear candidate resume' })
  async clearResume(@CurrentUser('id') userId: string) {
    return this.profilesService.clearResume(userId);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get public profile by ID or user ID' })
  async getPublicProfile(@Param('id') id: string) {
    return this.profilesService.getPublicProfile(id);
  }
}
