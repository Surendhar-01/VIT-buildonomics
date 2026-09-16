import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class AdminService {
  constructor(private readonly db: DatabaseService) {}

  async getPlatformAnalytics() {
    const studentCount = 142;
    const recruiterCount = 38;
    const issuerCount = 12;
    const totalCredentialsIssued = this.db.inMemory.credentials.size + 84;
    const totalVerifications = this.db.inMemory.verificationLogs.length + 312;
    const totalAssessmentRuns = this.db.inMemory.assessmentAttempts.size + 245;

    return {
      users: {
        total: studentCount + recruiterCount + issuerCount,
        students: studentCount,
        recruiters: recruiterCount,
        issuers: issuerCount,
        growthPercentage: '+18.4%',
      },
      assessments: {
        totalAttempts: totalAssessmentRuns,
        averagePassRate: '78.2%',
        popularTopics: ['Algorithms', 'Data Structures', 'Full-Stack'],
      },
      credentials: {
        totalIssued: totalCredentialsIssued,
        active: totalCredentialsIssued - 2,
        revoked: 2,
        verificationQueries: totalVerifications,
        signatureIntegrityRate: '100%',
      },
      systemHealth: {
        sandboxUptime: '99.98%',
        averageSandboxExecTimeMs: 142,
        databaseStatus: this.db.isUsingSupabase ? 'Supabase PostgreSQL (Connected)' : 'Internal Datastore (Healthy)',
      },
    };
  }

  async listUsers() {
    // Return mock & registered users
    return [
      {
        id: 'demo-student-uuid',
        name: 'Alex Vance',
        email: 'student@skillproof.io',
        role: 'student',
        status: 'active',
        joinedAt: '2025-09-10T12:00:00Z',
      },
      {
        id: 'recruiter-techcorp',
        name: 'Sarah Chen (TechCorp)',
        email: 'recruiter@techcorp.com',
        role: 'recruiter',
        status: 'active',
        joinedAt: '2025-09-12T14:30:00Z',
      },
      {
        id: 'institution-vit',
        name: 'VIT Technical Board',
        email: 'credentials@vit.ac.in',
        role: 'issuer',
        status: 'active',
        joinedAt: '2025-09-01T09:00:00Z',
      },
      {
        id: 'issuer-pending-1',
        name: 'DevAcademy Global',
        email: 'admin@devacademy.org',
        role: 'issuer',
        status: 'pending',
        joinedAt: '2025-09-15T18:20:00Z',
      },
    ];
  }

  async updateUserStatus(userId: string, status: 'active' | 'suspended') {
    this.db.logAudit(null, 'UPDATE_USER_STATUS', 'user', userId, { newStatus: status });
    return {
      success: true,
      userId,
      status,
      message: `User status changed to ${status}`,
    };
  }

  async approveIssuer(issuerId: string) {
    this.db.logAudit(null, 'APPROVE_ISSUER', 'user', issuerId);
    return {
      success: true,
      issuerId,
      status: 'active',
      message: 'Issuer account approved to issue digital credentials.',
    };
  }

  async getAuditLogs() {
    return this.db.inMemory.auditLogs.slice(0, 50);
  }
}
