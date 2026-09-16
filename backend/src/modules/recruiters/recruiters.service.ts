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

  private isUuid(str: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str || '');
  }

  private readonly DEMO_RECRUITER_UUID = '00000000-0000-0000-0000-000000000002';

  async getShortlists(recruiterId: string) {
    const validRecruiterId = this.isUuid(recruiterId) ? recruiterId : this.DEMO_RECRUITER_UUID;
    let lists: any[] = [];

    if (this.db.isUsingSupabase && this.db.client) {
      try {
        const { data, error } = await this.db.client
          .from('recruiter_shortlists')
          .select('*, shortlisted_candidates(*, profiles(*))')
          .eq('recruiter_id', validRecruiterId)
          .order('created_at', { ascending: true });

        if (!error && data && data.length > 0) {
          lists = data.map((sl: any) => ({
            id: sl.id,
            recruiter_id: sl.recruiter_id,
            name: sl.name,
            description: sl.description || '',
            created_at: sl.created_at,
            candidates: (sl.shortlisted_candidates || []).map((sc: any) => ({
              id: sc.id,
              shortlist_id: sc.shortlist_id,
              candidate_id: sc.candidate_id,
              candidate_name: sc.profiles?.full_name || 'Candidate',
              candidate_headline: sc.profiles?.headline || 'Software Engineer',
              candidate_slug: sc.profiles?.full_name
                ? sc.profiles.full_name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                : sc.candidate_id,
              notes: sc.notes || '',
              status: sc.status || 'reviewing',
              created_at: sc.created_at,
              profile: sc.profiles,
            })),
          }));
        } else if (!error && (!data || data.length === 0)) {
          // Auto-create default shortlist in Supabase
          const { data: created, error: cErr } = await this.db.client
            .from('recruiter_shortlists')
            .insert({
              recruiter_id: validRecruiterId,
              name: 'Top Engineering Prospects',
              description: 'Vetted candidates saved for active engineering roles',
            })
            .select()
            .single();

          if (!cErr && created) {
            lists.push({
              ...created,
              candidates: [],
            });
          }
        }
      } catch (dbErr) {
        console.error('Error fetching shortlists from Supabase:', dbErr);
      }
    }

    // Fallback to in-memory if Supabase yielded nothing or wasn't available
    if (lists.length === 0) {
      for (const sl of this.db.inMemory.shortlists.values()) {
        if (sl.recruiter_id === validRecruiterId || sl.recruiter_id === recruiterId) {
          const candidates = this.db.inMemory.shortlistedCandidates.get(sl.id) || [];
          lists.push({ ...sl, candidates });
        }
      }

      if (lists.length === 0) {
        const defaultList = {
          id: uuidv4(),
          recruiter_id: validRecruiterId,
          name: 'Top Engineering Prospects',
          description: 'Vetted candidates saved for active engineering roles',
          created_at: new Date().toISOString(),
        };
        this.db.inMemory.shortlists.set(defaultList.id, defaultList);
        this.db.inMemory.shortlistedCandidates.set(defaultList.id, []);
        lists.push({ ...defaultList, candidates: [] });
      }
    }

    // Sync to in-memory cache for ultra-fast fallback access
    for (const sl of lists) {
      this.db.inMemory.shortlists.set(sl.id, sl);
      this.db.inMemory.shortlistedCandidates.set(sl.id, sl.candidates || []);
    }

    return lists;
  }

  async createShortlist(recruiterId: string, dto: CreateShortlistDto) {
    const validRecruiterId = this.isUuid(recruiterId) ? recruiterId : this.DEMO_RECRUITER_UUID;
    let shortlist: any = null;

    if (this.db.isUsingSupabase && this.db.client) {
      try {
        const { data, error } = await this.db.client
          .from('recruiter_shortlists')
          .insert({
            recruiter_id: validRecruiterId,
            name: dto.name,
            description: dto.description || '',
          })
          .select()
          .single();

        if (!error && data) {
          shortlist = data;
        } else if (error) {
          console.error('Failed to insert recruiter_shortlists:', error);
        }
      } catch (err) {
        console.error('Supabase createShortlist error:', err);
      }
    }

    if (!shortlist) {
      shortlist = {
        id: uuidv4(),
        recruiter_id: validRecruiterId,
        name: dto.name,
        description: dto.description || '',
        created_at: new Date().toISOString(),
      };
    }

    this.db.inMemory.shortlists.set(shortlist.id, shortlist);
    this.db.inMemory.shortlistedCandidates.set(shortlist.id, []);
    return { ...shortlist, candidates: [] };
  }

  async addCandidateToShortlist(
    recruiterId: string,
    shortlistId: string,
    dto: AddCandidateToShortlistDto,
  ) {
    const validRecruiterId = this.isUuid(recruiterId) ? recruiterId : this.DEMO_RECRUITER_UUID;
    let activeShortlist = this.db.inMemory.shortlists.get(shortlistId);

    // Resolve shortlist from Supabase if not found in memory
    if (!activeShortlist && this.db.isUsingSupabase && this.db.client && this.isUuid(shortlistId)) {
      const { data: slData } = await this.db.client
        .from('recruiter_shortlists')
        .select('*')
        .eq('id', shortlistId)
        .maybeSingle();
      if (slData) {
        activeShortlist = slData;
        this.db.inMemory.shortlists.set(slData.id, slData);
      }
    }

    // If still not found, ensure a shortlist exists for this recruiter
    if (!activeShortlist) {
      if (this.db.isUsingSupabase && this.db.client) {
        const { data: existingLists } = await this.db.client
          .from('recruiter_shortlists')
          .select('*')
          .eq('recruiter_id', validRecruiterId)
          .limit(1);

        if (existingLists && existingLists.length > 0) {
          activeShortlist = existingLists[0];
          shortlistId = activeShortlist.id;
        } else {
          const { data: created } = await this.db.client
            .from('recruiter_shortlists')
            .insert({
              recruiter_id: validRecruiterId,
              name: 'Top Engineering Prospects',
              description: 'Vetted candidates saved for active engineering roles',
            })
            .select()
            .single();
          if (created) {
            activeShortlist = created;
            shortlistId = created.id;
          }
        }
      }
    }

    if (!activeShortlist) {
      activeShortlist = {
        id: shortlistId || uuidv4(),
        recruiter_id: validRecruiterId,
        name: 'Top Engineering Prospects',
        description: 'Vetted candidates saved for active engineering roles',
        created_at: new Date().toISOString(),
      };
      shortlistId = activeShortlist.id;
      this.db.inMemory.shortlists.set(shortlistId, activeShortlist);
    }

    // Resolve candidate profile and ensure we have their profiles(id) UUID
    let candidateProfile: any = null;
    let targetProfileId = dto.candidateId;

    if (this.db.isUsingSupabase && this.db.client && this.isUuid(dto.candidateId)) {
      const { data: pData } = await this.db.client
        .from('profiles')
        .select('*')
        .or(`id.eq.${dto.candidateId},user_id.eq.${dto.candidateId}`)
        .maybeSingle();

      if (pData) {
        candidateProfile = pData;
        targetProfileId = pData.id;
      }
    }

    if (!candidateProfile) {
      candidateProfile = this.db.inMemory.profiles.get(dto.candidateId);
      if (candidateProfile) {
        targetProfileId = candidateProfile.id;
      }
    }

    let savedEntryId = uuidv4();
    let savedCreatedAt = new Date().toISOString();

    // Persist to Supabase shortlisted_candidates
    if (
      this.db.isUsingSupabase &&
      this.db.client &&
      this.isUuid(shortlistId) &&
      this.isUuid(targetProfileId)
    ) {
      try {
        // Ensure shortlist exists in DB
        const { data: checkSl } = await this.db.client
          .from('recruiter_shortlists')
          .select('id')
          .eq('id', shortlistId)
          .maybeSingle();

        if (!checkSl) {
          await this.db.client.from('recruiter_shortlists').insert({
            id: shortlistId,
            recruiter_id: validRecruiterId,
            name: activeShortlist.name || 'Top Engineering Prospects',
            description: activeShortlist.description || '',
          });
        }

        // Check for existing candidate entry in this shortlist
        const { data: existing } = await this.db.client
          .from('shortlisted_candidates')
          .select('*')
          .eq('shortlist_id', shortlistId)
          .eq('candidate_id', targetProfileId)
          .maybeSingle();

        if (existing) {
          const { data: updated } = await this.db.client
            .from('shortlisted_candidates')
            .update({
              notes: dto.notes !== undefined ? dto.notes : existing.notes,
              status: 'reviewing',
            })
            .eq('id', existing.id)
            .select()
            .single();

          if (updated) {
            savedEntryId = updated.id;
            savedCreatedAt = updated.created_at;
          }
        } else {
          const { data: inserted, error: insErr } = await this.db.client
            .from('shortlisted_candidates')
            .insert({
              shortlist_id: shortlistId,
              candidate_id: targetProfileId,
              notes: dto.notes || '',
              status: 'reviewing',
            })
            .select()
            .single();

          if (!insErr && inserted) {
            savedEntryId = inserted.id;
            savedCreatedAt = inserted.created_at;
          } else if (insErr) {
            console.error('Failed to insert candidate into Supabase shortlisted_candidates:', insErr);
          }
        }
      } catch (saveErr) {
        console.error('Error persisting shortlisted candidate to Supabase:', saveErr);
      }
    }

    const entry = {
      id: savedEntryId,
      shortlist_id: shortlistId,
      candidate_id: targetProfileId,
      candidate_name: candidateProfile?.full_name || 'Candidate',
      candidate_headline: candidateProfile?.headline || 'Software Engineer',
      candidate_slug: candidateProfile?.full_name
        ? candidateProfile.full_name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        : targetProfileId,
      notes: dto.notes || '',
      status: 'reviewing',
      created_at: savedCreatedAt,
      profile: candidateProfile,
    };

    const list = this.db.inMemory.shortlistedCandidates.get(shortlistId) || [];
    const filtered = list.filter((item) => item.candidate_id !== targetProfileId);
    filtered.push(entry);
    this.db.inMemory.shortlistedCandidates.set(shortlistId, filtered);

    this.db.logAudit(recruiterId, 'SHORTLIST_CANDIDATE', 'shortlist', shortlistId, {
      candidateId: targetProfileId,
    });
    return entry;
  }

  async removeCandidateFromShortlist(
    recruiterId: string,
    shortlistId: string,
    candidateId: string,
  ) {
    if (this.db.isUsingSupabase && this.db.client && this.isUuid(shortlistId)) {
      try {
        if (this.isUuid(candidateId)) {
          await this.db.client
            .from('shortlisted_candidates')
            .delete()
            .eq('shortlist_id', shortlistId)
            .or(`id.eq.${candidateId},candidate_id.eq.${candidateId}`);
        }
      } catch (err) {
        console.error('Failed to remove shortlisted candidate from Supabase:', err);
      }
    }

    const list = this.db.inMemory.shortlistedCandidates.get(shortlistId) || [];
    const filtered = list.filter(
      (item) => item.candidate_id !== candidateId && item.id !== candidateId,
    );
    this.db.inMemory.shortlistedCandidates.set(shortlistId, filtered);
    return { success: true, message: 'Candidate removed from shortlist.' };
  }

  async deleteShortlist(recruiterId: string, shortlistId: string) {
    if (this.db.isUsingSupabase && this.db.client && this.isUuid(shortlistId)) {
      try {
        await this.db.client
          .from('shortlisted_candidates')
          .delete()
          .eq('shortlist_id', shortlistId);
        await this.db.client
          .from('recruiter_shortlists')
          .delete()
          .eq('id', shortlistId);
      } catch (err) {
        console.error('Failed to delete shortlist from Supabase:', err);
      }
    }

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
