import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CryptoSignerService } from '../credentials/crypto-signer.service';

@Injectable()
export class VerificationService {
  constructor(
    private readonly db: DatabaseService,
    private readonly signer: CryptoSignerService,
  ) {}

  async verifyCredential(credentialId: string, ip?: string, userAgent?: string) {
    let cred: any = null;
    let revocation: any = null;

    if (this.db.isUsingSupabase && this.db.client) {
      const { data } = await this.db.client
        .from('credentials')
        .select('*')
        .eq('credential_id', credentialId)
        .single();
      cred = data;

      if (cred && cred.status === 'revoked') {
        const { data: revData } = await this.db.client
          .from('credential_revocations')
          .select('*')
          .eq('credential_id', credentialId)
          .single();
        revocation = revData;
      }
    }

    if (!cred) {
      cred = this.db.inMemory.credentials.get(credentialId);
      revocation = this.db.inMemory.credentialRevocations.get(credentialId);
    }

    if (!cred) {
      this.recordVerificationLog(credentialId, 'not_found', ip, userAgent);
      throw new NotFoundException(`Verifiable Credential with ID '${credentialId}' not found.`);
    }

    // Reconstruct canonical payload for signature check
    const payloadToVerify = {
      credential_id: cred.credential_id,
      recipient_id: cred.recipient_id,
      issuer_id: cred.issuer_id,
      title: cred.title,
      description: cred.description,
      criteria: cred.criteria,
      credential_type: cred.credential_type,
      achievement_data: cred.achievement_data || {},
      issued_at: cred.issued_at,
      expires_at: cred.expires_at || null,
    };

    const canonicalString = this.signer.canonicalize(payloadToVerify);
    const isSignatureValid = this.signer.verifySignature(canonicalString, cred.signature);

    // Expiry check
    let isExpired = false;
    if (cred.expires_at) {
      isExpired = new Date(cred.expires_at).getTime() < Date.now();
    }

    const isRevoked = cred.status === 'revoked';

    let resultStatus: 'valid' | 'revoked' | 'expired' | 'tampered' = 'valid';
    if (!isSignatureValid) {
      resultStatus = 'tampered';
    } else if (isRevoked) {
      resultStatus = 'revoked';
    } else if (isExpired) {
      resultStatus = 'expired';
    }

    this.recordVerificationLog(credentialId, resultStatus, ip, userAgent);

    // Lookup recipient profile name
    let recipientName = 'Candidate';
    if (this.db.isUsingSupabase && this.db.client) {
      const { data: prof } = await this.db.client
        .from('profiles')
        .select('full_name')
        .eq('id', cred.recipient_id)
        .single();
      if (prof?.full_name) recipientName = prof.full_name;
    } else {
      const prof = this.db.inMemory.profiles.get(cred.recipient_id);
      if (prof?.full_name) recipientName = prof.full_name;
    }

    return {
      credentialId: cred.credential_id,
      title: cred.title,
      description: cred.description,
      criteria: cred.criteria,
      credentialType: cred.credential_type,
      achievementData: cred.achievement_data,
      recipientName,
      recipientId: cred.recipient_id,
      issuerName: cred.issuer_name || 'Authorized Certification Board',
      issuerId: cred.issuer_id,
      issuedAt: cred.issued_at,
      expiresAt: cred.expires_at,
      status: resultStatus,
      isSignatureValid,
      isExpired,
      isRevoked,
      revocationReason: revocation?.reason || null,
      revokedAt: revocation?.revoked_at || null,
      keyId: cred.key_id,
      verifiedAt: new Date().toISOString(),
    };
  }

  async getSignatureDetails(credentialId: string) {
    let cred: any = null;
    if (this.db.isUsingSupabase && this.db.client) {
      const { data } = await this.db.client
        .from('credentials')
        .select('*')
        .eq('credential_id', credentialId)
        .single();
      cred = data;
    }

    if (!cred) {
      cred = this.db.inMemory.credentials.get(credentialId);
    }

    if (!cred) {
      throw new NotFoundException(`Credential '${credentialId}' not found.`);
    }

    const payloadToVerify = {
      credential_id: cred.credential_id,
      recipient_id: cred.recipient_id,
      issuer_id: cred.issuer_id,
      title: cred.title,
      description: cred.description,
      criteria: cred.criteria,
      credential_type: cred.credential_type,
      achievement_data: cred.achievement_data || {},
      issued_at: cred.issued_at,
      expires_at: cred.expires_at || null,
    };

    const canonicalString = this.signer.canonicalize(payloadToVerify);
    const isSignatureValid = this.signer.verifySignature(canonicalString, cred.signature);

    return {
      credentialId: cred.credential_id,
      algorithm: 'Ed25519 (RFC 8032)',
      keyId: cred.key_id,
      signature: cred.signature,
      canonicalPayload: canonicalString,
      isSignatureValid,
      publicKeyPem: this.signer.getPublicKeyPem(),
    };
  }

  private recordVerificationLog(
    credentialId: string,
    result: string,
    ip?: string,
    userAgent?: string,
  ) {
    const log = {
      credential_id: credentialId,
      verification_result: result,
      ip_hash: ip ? Buffer.from(ip).toString('base64').substring(0, 16) : 'anonymous',
      user_agent: userAgent?.substring(0, 120) || 'Unknown Client',
      verified_at: new Date().toISOString(),
    };

    if (this.db.isUsingSupabase && this.db.client) {
      this.db.client.from('credential_verification_logs').insert(log).then();
    } else {
      this.db.inMemory.verificationLogs.push(log);
    }
  }
}
