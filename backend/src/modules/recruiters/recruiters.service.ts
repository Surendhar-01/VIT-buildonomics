import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import {
  AddCandidateToShortlistDto,
  CandidateSearchFilterDto,
  CreateShortlistDto,
  OpportunityRequestDto,
} from './dto/recruiter.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RecruitersService {
  constructor(private readonly db: DatabaseService) {}

  async searchCandidates(filters: CandidateSearchFilterDto) {
    let profiles: any[] = [];

    if (this.db.isUsingSupabase && this.db.client) {
      const { data } = await this.db.client
        .from('profiles')
        .select('*, profile_skills(*, skills(*))')
        .or('visibility.eq.public,visibility.eq.recruiters_only');
      profiles = data || [];
    } else {
      profiles = Array.from(this.db.inMemory.profiles.values()).filter(
        (p) => p.visibility === 'public' || p.visibility === 'recruiters_only',
      );
    }

    // Attach credentials and projects to profiles
    const candidatesWithEvidence = profiles.map((p) => {
      const creds = Array.from(this.db.inMemory.credentials.values()).filter(
        (c) => c.recipient_id === p.id && c.status === 'active',
      );
      const projs = Array.from(this.db.inMemory.projects.values()).filter(
        (pr) => pr.profile_id === p.id,
      );
      const rawSkills = this.db.inMemory.profileSkills.get(p.id) || [];
      const skills = rawSkills.map(
        (rs) => rs.skill_name || this.db.inMemory.skills.get(rs.skill_id)?.name || 'Skill',
      );

      return {
        ...p,
        credentials: creds,
        projects: projs,
        skills,
      };
    });

    // Apply filters
    let results = candidatesWithEvidence;

    if (filters.query) {
      const q = filters.query.toLowerCase();
      results = results.filter(
        (c) =>
          c.full_name?.toLowerCase().includes(q) ||
          c.headline?.toLowerCase().includes(q) ||
          c.skills.some((s: string) => s.toLowerCase().includes(q)),
      );
    }

    if (filters.skills && filters.skills.length > 0) {
      results = results.filter((c) =>
        filters.skills.some((reqSkill) =>
          c.skills.some((s: string) => s.toLowerCase().includes(reqSkill.toLowerCase())),
        ),
      );
    }

    return results;
  }

  async getShortlists(recruiterId: string) {
    const lists: any[] = [];
    for (const sl of this.db.inMemory.shortlists.values()) {
      if (sl.recruiter_id === recruiterId) {
        const candidates = this.db.inMemory.shortlistedCandidates.get(sl.id) || [];
        lists.push({ ...sl, candidates });
      }
    }

    // Auto-create default shortlist if none exists so recruiter always has an active list
    if (lists.length === 0) {
      const defaultList = {
        id: uuidv4(),
        recruiter_id: recruiterId,
        name: 'Top Engineering Prospects',
        description: 'Vetted candidates saved for active engineering roles',
        created_at: new Date().toISOString(),
      };
      this.db.inMemory.shortlists.set(defaultList.id, defaultList);
      this.db.inMemory.shortlistedCandidates.set(defaultList.id, []);
      lists.push({ ...defaultList, candidates: [] });
    }

    return lists;
  }

  async createShortlist(recruiterId: string, dto: CreateShortlistDto) {
    const id = uuidv4();
    const shortlist = {
      id,
      recruiter_id: recruiterId,
      name: dto.name,
      description: dto.description || '',
      created_at: new Date().toISOString(),
    };
    this.db.inMemory.shortlists.set(id, shortlist);
    this.db.inMemory.shortlistedCandidates.set(id, []);
    return shortlist;
  }

  async addCandidateToShortlist(
    recruiterId: string,
    shortlistId: string,
    dto: AddCandidateToShortlistDto,
  ) {
    const sl = this.db.inMemory.shortlists.get(shortlistId);
    if (!sl) {
      throw new NotFoundException('Shortlist not found');
    }

    let candidateProfile: any = null;
    if (this.db.isUsingSupabase && this.db.client) {
      const { data } = await this.db.client
        .from('profiles')
        .select('*')
        .or(`id.eq.${dto.candidateId},user_id.eq.${dto.candidateId}`)
        .single();
      candidateProfile = data;
    }
    if (!candidateProfile) {
      candidateProfile = this.db.inMemory.profiles.get(dto.candidateId);
    }

    const entry = {
      id: uuidv4(),
      shortlist_id: shortlistId,
      candidate_id: dto.candidateId,
      candidate_name: candidateProfile?.full_name || 'Candidate',
      candidate_headline: candidateProfile?.headline || 'Software Engineer',
      candidate_slug: candidateProfile?.slug || candidateProfile?.id,
      notes: dto.notes || '',
      status: 'reviewing',
      created_at: new Date().toISOString(),
    };

    const list = this.db.inMemory.shortlistedCandidates.get(shortlistId) || [];
    // prevent duplicate
    const filtered = list.filter((item) => item.candidate_id !== dto.candidateId);
    filtered.push(entry);
    this.db.inMemory.shortlistedCandidates.set(shortlistId, filtered);

    this.db.logAudit(recruiterId, 'SHORTLIST_CANDIDATE', 'shortlist', shortlistId, {
      candidateId: dto.candidateId,
    });
    return entry;
  }

  async removeCandidateFromShortlist(
    recruiterId: string,
    shortlistId: string,
    candidateId: string,
  ) {
    const list = this.db.inMemory.shortlistedCandidates.get(shortlistId) || [];
    const filtered = list.filter(
      (item) => item.candidate_id !== candidateId && item.id !== candidateId,
    );
    this.db.inMemory.shortlistedCandidates.set(shortlistId, filtered);
    return { success: true, message: 'Candidate removed from shortlist.' };
  }

  async deleteShortlist(recruiterId: string, shortlistId: string) {
    this.db.inMemory.shortlists.delete(shortlistId);
    this.db.inMemory.shortlistedCandidates.delete(shortlistId);
    return { success: true, message: 'Shortlist deleted.' };
  }

  async sendOpportunityRequest(recruiterId: string, dto: OpportunityRequestDto) {
    const opp = {
      id: uuidv4(),
      recruiter_id: recruiterId,
      candidate_id: dto.candidateId,
      job_title: dto.jobTitle,
      message: dto.message,
      status: 'sent',
      sent_at: new Date().toISOString(),
    };

    this.db.logAudit(recruiterId, 'SEND_OPPORTUNITY', 'candidate', dto.candidateId, {
      jobTitle: dto.jobTitle,
    });

    return {
      success: true,
      message: `Interview opportunity dispatched to candidate successfully.`,
      opportunity: opp,
    };
  }
}
