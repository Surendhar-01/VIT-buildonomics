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
import { ProjectsService } from './projects.service';
import { CreateProjectDto, GitHubSyncDto, UpdateProjectDto } from './dto/project.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Projects')
@Controller('projects')
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user projects' })
  async getMyProjects(@CurrentUser('id') userId: string) {
    return this.projectsService.getMyProjects(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Add a new project' })
  async createProject(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectsService.createProject(userId, dto);
  }

  @Post('github-sync')
  @ApiOperation({ summary: 'Extract metadata and summary from GitHub repository URL' })
  async fetchGitHubMetadata(@Body() dto: GitHubSyncDto) {
    return this.projectsService.fetchGitHubMetadata(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project details by ID' })
  async getProjectById(@Param('id') id: string) {
    return this.projectsService.getProjectById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update project details' })
  async updateProject(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.updateProject(userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a project' })
  async deleteProject(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.projectsService.deleteProject(userId, id);
  }
}
