import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import * as QRCode from 'qrcode';
import { DatabaseService } from '../../database/database.service';
import { CryptoSignerService } from './crypto-signer.service';
import { CreateCredentialDto, RevokeCredentialDto } from './dto/create-credential.dto';

@Injectable()
export class CredentialsService implements OnModuleInit {
  private readonly frontendUrl: string;

  constructor(
    private readonly db: DatabaseService,
    private readonly signer: CryptoSignerService,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
  }

  async onModuleInit() {
    // Seed default verifiable certificate SKP-2026-ALGO01 if not already present
    const defaultId = 'SKP-2026-ALGO01';
    if (!this.db.inMemory.credentials.has(defaultId)) {
      const verificationUrl = `${this.frontendUrl}/verify/${defaultId}`;
      const payloadToSign = {
        credential_id: defaultId,
        recipient_id: 'demo-student-uuid',
        issuer_id: 'institution-vit',
        title: 'Certified Algorithmic Problem Solver',
        description: 'Awarded for demonstrating optimal algorithmic execution in the Full-Stack Algorithmic Benchmark.',
        criteria: 'Achieved 100% test case pass rate with optimal O(N) runtime complexity.',
        credential_type: 'assessment_achievement',
        achievement_data: { score: 100, passRate: '100%', assessment: 'Full-Stack Algorithmic Benchmark' },
        issued_at: '2026-01-15T10:00:00.000Z',
        expires_at: null,
      };

      const { signature, keyId, canonicalString } = this.signer.signPayload(payloadToSign);
      let qrCode = '';
      try {
        qrCode = await QRCode.toDataURL(verificationUrl, {
          errorCorrectionLevel: 'H',
          margin: 2,
          width: 280,
          color: { dark: '#1e1b4b', light: '#ffffff' },
        });
      } catch {}

      const seedRecord = {
        id: uuidv4(),
        credential_id: defaultId,
        recipient_id: 'demo-student-uuid',
        issuer_id: 'institution-vit',
        issuer_name: 'VIT Technical Board',
        template_id: 'tmpl-algo-master',
        title: payloadToSign.title,
        description: payloadToSign.description,
        criteria: payloadToSign.criteria,
        credential_type: payloadToSign.credential_type,
        achievement_data: payloadToSign.achievement_data,
        issued_at: payloadToSign.issued_at,
        expires_at: null,
        status: 'active',
        signature,
        key_id: keyId,
        canonical_payload: canonicalString,
        verification_url: verificationUrl,
        qr_code: qrCode,
        created_at: payloadToSign.issued_at,
      };

      this.db.inMemory.credentials.set(defaultId, seedRecord);
    }
  }

  async issueCredential(issuerId: string, issuerName: string, dto: CreateCredentialDto) {
    // Generate unique verifiable credential ID: SKP-YYYY-RANDOM
    const year = new Date().getFullYear();
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const credentialId = `SKP-${year}-${randomHex}`;
    const issuedAt = new Date().toISOString();

    const verificationUrl = `${this.frontendUrl}/verify/${credentialId}`;

    // Canonical payload for Ed25519 signing
    const payloadToSign = {
      credential_id: credentialId,
      recipient_id: dto.recipientId,
      issuer_id: issuerId,
      title: dto.title,
      description: dto.description,
      criteria: dto.criteria,
      credential_type: dto.credentialType,
      achievement_data: dto.achievementData || {},
      issued_at: issuedAt,
      expires_at: dto.expiresAt || null,
    };

    const { signature, keyId, canonicalString } = this.signer.signPayload(payloadToSign);

    // Generate QR code data URL
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 280,
      color: {
        dark: '#1e1b4b',
        light: '#ffffff',
      },
    });

    const credentialRecord = {
      id: uuidv4(),
      credential_id: credentialId,
      recipient_id: dto.recipientId,
      issuer_id: issuerId,
      issuer_name: issuerName,
      template_id: dto.templateId || null,
      title: dto.title,
      description: dto.description,
      criteria: dto.criteria,
      credential_type: dto.credentialType,
      achievement_data: dto.achievementData || {},
      issued_at: issuedAt,
      expires_at: dto.expiresAt || null,
      status: 'active',
      signature,
      key_id: keyId,
      canonical_payload: canonicalString,
      verification_url: verificationUrl,
      qr_code: qrCodeDataUrl,
      created_at: issuedAt,
    };

    const isIssuerUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(issuerId);
    const isRecipientUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dto.recipientId);

    if (this.db.isUsingSupabase && this.db.client && isRecipientUuid) {
      try {
        const supaPayload = {
          ...credentialRecord,
          issuer_id: isIssuerUuid ? issuerId : '00000000-0000-0000-0000-000000000001',
        };
        const { data, error } = await this.db.client
          .from('credentials')
          .insert(supaPayload)
          .select()
          .single();
        if (!error && data) {
          this.db.inMemory.credentials.set(credentialId, credentialRecord);
          this.db.logAudit(issuerId, 'ISSUE_CREDENTIAL', 'credential', credentialId, { title: dto.title });
          return { ...data, qr_code: qrCodeDataUrl };
        }
      } catch (err) {
        // Fall back to inMemory store
      }
    }

    this.db.inMemory.credentials.set(credentialId, credentialRecord);
    this.db.logAudit(issuerId, 'ISSUE_CREDENTIAL', 'credential', credentialId, { title: dto.title });
    return credentialRecord;
  }

  async getIssuedCredentials(issuerId: string, role: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(issuerId);
    let supaList: any[] = [];
    if (this.db.isUsingSupabase && this.db.client) {
      try {
        let query = this.db.client.from('credentials').select('*').order('issued_at', { ascending: false });
        if (role !== 'admin' && isUuid) {
          query = query.eq('issuer_id', issuerId);
        }
        const { data, error } = await query;
        if (!error && data) {
          supaList = data;
        }
      } catch {}
    }

    const memList: any[] = [];
    for (const cred of this.db.inMemory.credentials.values()) {
      if (role === 'admin' || cred.issuer_id === issuerId || !isUuid) {
        memList.push(cred);
      }
    }

    const seen = new Set(supaList.map((c) => c.credential_id));
    for (const c of memList) {
      if (!seen.has(c.credential_id)) {
        supaList.push(c);
      }
    }

    return supaList.sort((a, b) => new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime());
  }

  async getMyCredentials(userId: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (this.db.isUsingSupabase && this.db.client && isUuid) {
      // Find candidate profile to match either profile.id or profile.user_id
      const { data: prof } = await this.db.client
        .from('profiles')
        .select('id, user_id')
        .or(`id.eq.${userId},user_id.eq.${userId}`)
        .single();

      let orFilter = `recipient_id.eq.${userId}`;
      if (prof) {
        orFilter = `recipient_id.eq.${prof.id},recipient_id.eq.${prof.user_id}`;
      }

      const { data, error } = await this.db.client
        .from('credentials')
        .select('*')
        .or(orFilter)
        .order('issued_at', { ascending: false });
      if (error) throw new BadRequestException(error.message);
      return data || [];
    }

    const list: any[] = [];
    for (const cred of this.db.inMemory.credentials.values()) {
      if (cred.recipient_id === userId) {
        list.push(cred);
      }
    }
    return list;
  }

  async getCredentialById(credentialId: string) {
    let cred: any = null;
    if (this.db.isUsingSupabase && this.db.client) {
      const { data } = await this.db.client
        .from('credentials')
        .select('*')
        .eq('credential_id', credentialId)
        .single();
      cred = data;
    }

    // Fallback to inMemory if not found in Supabase (e.g. seeded credentials)
    if (!cred) {
      cred = this.db.inMemory.credentials.get(credentialId);
    }

    if (!cred) {
      throw new NotFoundException(`Credential '${credentialId}' not found`);
    }

    // Attach QR code if not saved
    if (!cred.qr_code) {
      cred.qr_code = await QRCode.toDataURL(cred.verification_url, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 280,
      });
    }

    return cred;
  }

  async revokeCredential(credentialId: string, revokedBy: string, role: string, dto: RevokeCredentialDto) {
    const cred = await this.getCredentialById(credentialId);
    if (!cred) {
      throw new NotFoundException('Credential not found');
    }

    if (role !== 'admin' && cred.issuer_id !== revokedBy) {
      throw new ForbiddenException('Only the issuing organization or platform admin can revoke this credential');
    }

    const revokedAt = new Date().toISOString();
    const revocationRecord = {
      id: uuidv4(),
      credential_id: credentialId,
      revoked_by: revokedBy,
      reason: dto.reason,
      revoked_at: revokedAt,
    };

    if (this.db.isUsingSupabase && this.db.client) {
      await this.db.client
        .from('credentials')
        .update({ status: 'revoked' })
        .eq('credential_id', credentialId);

      await this.db.client
        .from('credential_revocations')
        .insert(revocationRecord);
    } else {
      cred.status = 'revoked';
      this.db.inMemory.credentials.set(credentialId, cred);
      this.db.inMemory.credentialRevocations.set(credentialId, revocationRecord);
    }

    this.db.logAudit(revokedBy, 'REVOKE_CREDENTIAL', 'credential', credentialId, { reason: dto.reason });
    return {
      success: true,
      message: `Credential ${credentialId} has been revoked`,
      revokedAt,
      reason: dto.reason,
    };
  }

  async listTemplates() {
    if (this.db.isUsingSupabase && this.db.client) {
      const { data } = await this.db.client
        .from('credential_templates')
        .select('*')
        .eq('status', 'active');
      return data || [];
    }
    return Array.from(this.db.inMemory.credentialTemplates.values());
  }

  async createTemplate(issuerId: string, data: any) {
    const template = {
      id: uuidv4(),
      issuer_id: issuerId,
      title: data.title,
      description: data.description,
      criteria: data.criteria,
      credential_type: data.credentialType || 'custom',
      status: 'active',
      created_at: new Date().toISOString(),
    };
    if (this.db.isUsingSupabase && this.db.client) {
      const { data: row } = await this.db.client
        .from('credential_templates')
        .insert(template)
        .select()
        .single();
      return row;
    }
    this.db.inMemory.credentialTemplates.set(template.id, template);
    return template;
  }
}
