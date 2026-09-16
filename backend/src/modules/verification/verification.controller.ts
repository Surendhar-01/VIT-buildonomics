import { Controller, Get, Param, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { VerificationService } from './verification.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Public Verification')
@Controller('verify')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Get(':credentialId')
  @Public()
  @ApiOperation({ summary: 'Publicly verify an Ed25519 signed digital credential' })
  @ApiResponse({ status: 200, description: 'Cryptographic signature and credential verification status' })
  async verifyCredential(
    @Param('credentialId') credentialId: string,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.verificationService.verifyCredential(credentialId, ip, userAgent);
  }

  @Get(':credentialId/signature')
  @Public()
  @ApiOperation({ summary: 'Inspect raw canonical payload, Ed25519 signature and public key' })
  async getSignatureDetails(@Param('credentialId') credentialId: string) {
    return this.verificationService.getSignatureDetails(credentialId);
  }
}
