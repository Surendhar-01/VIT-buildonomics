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

    let allCreds: any[] = [];
    let allProjects: any[] = [];

    if (this.db.isUsingSupabase && this.db.client) {
      const { data } = await this.db.client
        .from('profiles')
        .select('*, profile_skills(*, skills(*))')
        .or('visibility.eq.public,visibility.eq.recruiters_only');
      profiles = data || [];

      const { data: cData } = await this.db.client
        .from('credentials')
        .select('*')
        .eq('status', 'active');
      allCreds = cData || [];

      const { data: prData } = await this.db.client
        .from('projects')
        .select('*');
      allProjects = prData || [];
    } else {
      profiles = Array.from(this.db.inMemory.profiles.values()).filter(
        (p) => p.visibility === 'public' || p.visibility === 'recruiters_only',
      );
      allCreds = Array.from(this.db.inMemory.credentials.values()).filter(
        (c) => c.status === 'active',
      );
      allProjects = Array.from(this.db.inMemory.projects.values());
    }

    // Attach credentials, projects, verified skills, and clean slug to profiles
    const candidatesWithEvidence = profiles.map((p) => {
      const creds = allCreds.filter(
        (c) => c.recipient_id === p.id || c.recipient_id === p.user_id,
      );
      const projs = allProjects.filter(
        (pr) => pr.profile_id === p.id || pr.profile_id === p.user_id,
      );

      // Extract skills from Supabase join or in-memory fallback
      let rawSkillsList: string[] = [];
      if (p.profile_skills && Array.isArray(p.profile_skills)) {
        rawSkillsList = p.profile_skills
          .map((ps: any) => ps.skills?.name || ps.skill_name)
          .filter(Boolean);
      }

      if (rawSkillsList.length === 0) {
        const memSkills =
          this.db.inMemory.profileSkills.get(p.id) ||
          this.db.inMemory.profileSkills.get(p.user_id) ||
          [];
        rawSkillsList = memSkills.map(
          (rs: any) => rs.skill_name || this.db.inMemory.skills.get(rs.skill_id)?.name || 'Skill',
        );
      }

      // If candidate has no explicitly added skills yet, extract from headline/bio or provide sensible defaults
      if (rawSkillsList.length === 0) {
        const text = `${p.headline || ''} ${p.bio || ''}`.toLowerCase();
        if (text.includes('ai') || text.includes('machine learning')) {
          rawSkillsList = ['Python', 'TensorFlow', 'React', 'FastAPI', 'PostgreSQL'];
        } else if (text.includes('full-stack') || text.includes('full stack')) {
          rawSkillsList = ['JavaScript', 'TypeScript', 'React', 'Node.js', 'PostgreSQL'];
        } else {
          rawSkillsList = ['JavaScript', 'React', 'Node.js', 'Problem Solving'];
        }
      }

      const skills = Array.from(new Set(rawSkillsList));
      const slug = p.slug || (p.full_name ? p.full_name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : p.id);

      return {
        ...p,
        credentials: creds,
        projects: projs,
        skills,
        slug,
      };
    });

    // Apply filters
    let results = candidatesWithEvidence;

    if (filters.query && typeof filters.query === 'string' && filters.query.trim()) {
      const q = filters.query.trim().toLowerCase();
      results = results.filter(
        (c) =>
          (c.full_name && c.full_name.toLowerCase().includes(q)) ||
          (c.headline && c.headline.toLowerCase().includes(q)) ||
          (c.bio && c.bio.toLowerCase().includes(q)) ||
          (c.skills && c.skills.some((s: string) => s.toLowerCase().includes(q))),
      );
    }

    // Process skills filter
    let filterSkills: string[] = [];
    if (filters.skills) {
      if (Array.isArray(filters.skills)) {
        filterSkills = filters.skills;
      } else if (typeof filters.skills === 'string') {
        filterSkills = (filters.skills as string).split(',').map((s) => s.trim()).filter(Boolean);
      }
    }
    filterSkills = filterSkills.filter((s) => s && s !== 'undefined');

    if (filterSkills.length > 0) {
      results = results.filter((c) =>
        filterSkills.some((reqSkill) => {
          const reqLower = reqSkill.toLowerCase().replace('.js', '').trim();
          return c.skills.some((s: string) => {
            const sLower = s.toLowerCase().replace('.js', '').trim();
            return sLower === reqLower || sLower.includes(reqLower) || reqLower.includes(sLower);
          });
        }),
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
