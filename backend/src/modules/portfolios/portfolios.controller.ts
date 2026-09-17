import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PortfoliosService } from './portfolios.service';
import { CreatePortfolioDto, UpdatePortfolioDto } from './dto/portfolio.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Portfolios')
@Controller('portfolios')
export class PortfoliosController {
  constructor(private readonly portfoliosService: PortfoliosService) {}

  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current candidate portfolios' })
  async getMyPortfolios(@CurrentUser('id') userId: string) {
    return this.portfoliosService.getMyPortfolios(userId);
  }

  @Post()
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new portfolio' })
  async createPortfolio(
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePortfolioDto,
  ) {
    return this.portfoliosService.createPortfolio(userId, dto);
  }

  @Get('public/:slug')
  @Public()
  @ApiOperation({ summary: 'Get public portfolio page by custom slug' })
  async getPublicPortfolioBySlug(
    @Param('slug') slug: string,
    @Headers('x-dev-user-id') devUserId?: string,
  ) {
    return this.portfoliosService.getPublicPortfolioBySlug(slug, devUserId);
  }

  @Get(':id')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get portfolio details by ID' })
  async getPortfolioById(@Param('id') id: string) {
    return this.portfoliosService.getPortfolioById(id);
  }

  @Patch(':id')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update portfolio sections, theme or template' })
  async updatePortfolio(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePortfolioDto,
  ) {
    return this.portfoliosService.updatePortfolio(userId, id, dto);
  }

  @Post(':id/publish')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle portfolio publication status' })
  async togglePublish(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body('isPublished') isPublished: boolean,
  ) {
    return this.portfoliosService.publishToggle(userId, id, isPublished);
  }
}
