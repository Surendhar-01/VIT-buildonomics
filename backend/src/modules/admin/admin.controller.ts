import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('analytics')
  @ApiOperation({ summary: 'Platform analytics, issuance stats and activity benchmarks (Admin)' })
  async getAnalytics() {
    return this.adminService.getPlatformAnalytics();
  }

  @Get('users')
  @ApiOperation({ summary: 'List platform users across all roles (Admin)' })
  async listUsers() {
    return this.adminService.listUsers();
  }

  @Patch('users/:id/status')
  @ApiOperation({ summary: 'Suspend or restore a user account (Admin)' })
  async updateUserStatus(
    @Param('id') userId: string,
    @Body('status') status: 'active' | 'suspended',
  ) {
    return this.adminService.updateUserStatus(userId, status);
  }

  @Post('issuers/:id/approve')
  @ApiOperation({ summary: 'Approve an institution / issuer registration (Admin)' })
  async approveIssuer(@Param('id') issuerId: string) {
    return this.adminService.approveIssuer(issuerId);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Inspect immutable system audit log entries (Admin)' })
  async getAuditLogs() {
    return this.adminService.getAuditLogs();
  }
}
