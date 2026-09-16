import { Module } from '@nestjs/common';
import { CredentialsService } from './credentials.service';
import { CredentialsController } from './credentials.controller';
import { CryptoSignerService } from './crypto-signer.service';

@Module({
  controllers: [CredentialsController],
  providers: [CredentialsService, CryptoSignerService],
  exports: [CredentialsService, CryptoSignerService],
})
export class CredentialsModule {}
