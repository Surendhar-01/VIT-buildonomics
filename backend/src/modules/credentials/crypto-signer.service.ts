import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class CryptoSignerService implements OnModuleInit {
  private readonly logger = new Logger(CryptoSignerService.name);
  private privateKey: string;
  private publicKey: string;
  private keyId: string;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.keyId = this.configService.get<string>('CREDENTIAL_SIGNING_KEY_ID') || 'skillproof-ed25519-v1';
    
    const envPrivKey = this.configService.get<string>('CREDENTIAL_SIGNING_PRIVATE_KEY');
    const envPubKey = this.configService.get<string>('CREDENTIAL_SIGNING_PUBLIC_KEY');

    if (envPrivKey && envPubKey) {
      this.privateKey = envPrivKey;
      this.publicKey = envPubKey;
      this.logger.log(`Initialized Ed25519 signing keys from environment (Key ID: ${this.keyId})`);
    } else {
      // Auto-generate standard Ed25519 asymmetric key pair
      const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });
      this.privateKey = privateKey;
      this.publicKey = publicKey;
      this.logger.log(`Generated active Ed25519 key pair for digital credential signing (Key ID: ${this.keyId})`);
    }
  }

  getKeyId(): string {
    return this.keyId;
  }

  getPublicKeyPem(): string {
    return this.publicKey;
  }

  /**
   * Produce deterministic, canonical JSON representation of payload
   */
  canonicalize(obj: any): string {
    if (obj === null || typeof obj !== 'object') {
      return JSON.stringify(obj);
    }
    if (Array.isArray(obj)) {
      return '[' + obj.map((item) => this.canonicalize(item)).join(',') + ']';
    }
    const sortedKeys = Object.keys(obj).sort();
    const parts = sortedKeys.map(
      (key) => `${JSON.stringify(key)}:${this.canonicalize(obj[key])}`,
    );
    return '{' + parts.join(',') + '}';
  }

  /**
   * Sign canonical payload using Ed25519
   */
  signPayload(payload: any): { signature: string; keyId: string; canonicalString: string } {
    const canonicalString = this.canonicalize(payload);
    const signature = crypto
      .sign(null, Buffer.from(canonicalString, 'utf8'), this.privateKey)
      .toString('base64');

    return {
      signature,
      keyId: this.keyId,
      canonicalString,
    };
  }

  /**
   * Verify an Ed25519 digital signature against canonical payload
   */
  verifySignature(canonicalString: string, signature: string, publicKeyPem?: string): boolean {
    try {
      const pubKey = publicKeyPem || this.publicKey;
      return crypto.verify(
        null,
        Buffer.from(canonicalString, 'utf8'),
        pubKey,
        Buffer.from(signature, 'base64'),
      );
    } catch (err) {
      this.logger.warn(`Signature verification exception: ${err.message}`);
      return false;
    }
  }
}
