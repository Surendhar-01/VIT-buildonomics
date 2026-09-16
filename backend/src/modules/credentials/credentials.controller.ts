import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CredentialsService } from './credentials.service';
import { CreateCredentialDto, RevokeCredentialDto } from './dto/create-credential.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Credentials')
@Controller('credentials')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CredentialsController {
  constructor(private readonly credentialsService: CredentialsService) {}

  @Post()
  @Roles('issuer', 'admin')
  @ApiOperation({ summary: 'Issue a new cryptographically signed digital credential (Issuer/Admin)' })
  @ApiResponse({ status: 201, description: 'Signed credential with QR code' })
  async issueCredential(
    @CurrentUser('id') issuerId: string,
    @CurrentUser('full_name') issuerName: string,
    @Body() dto: CreateCredentialDto,
  ) {
    return this.credentialsService.issueCredential(issuerId, issuerName || 'Authorized Issuer', dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get all credentials awarded to current candidate' })
  async getMyCredentials(@CurrentUser('id') userId: string) {
    return this.credentialsService.getMyCredentials(userId);
  }

  @Get('issued')
  @Roles('issuer', 'admin')
  @ApiOperation({ summary: 'Get all credentials issued by current issuer or institution' })
  async getIssuedCredentials(
    @CurrentUser('id') issuerId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.credentialsService.getIssuedCredentials(issuerId, role);
  }

  @Get('templates')
  @ApiOperation({ summary: 'List credential templates for issuing' })
  async listTemplates() {
    return this.credentialsService.listTemplates();
  }

  @Post('templates')
  @Roles('issuer', 'admin')
  @ApiOperation({ summary: 'Create a new credential template' })
  async createTemplate(@CurrentUser('id') issuerId: string, @Body() body: any) {
    return this.credentialsService.createTemplate(issuerId, body);
  }

  @Get(':credentialId')
  @ApiOperation({ summary: 'Get detailed metadata of a specific credential' })
  async getCredential(@Param('credentialId') credentialId: string) {
    return this.credentialsService.getCredentialById(credentialId);
  }

  @Post(':credentialId/revoke')
  @Roles('issuer', 'admin')
  @ApiOperation({ summary: 'Revoke an issued credential with reason' })
  async revokeCredential(
    @Param('credentialId') credentialId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Body() dto: RevokeCredentialDto,
  ) {
    return this.credentialsService.revokeCredential(credentialId, userId, role, dto);
  }
}
