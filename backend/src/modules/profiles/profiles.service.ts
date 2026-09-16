import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { AddSkillDto, UpdateProfileDto } from './dto/update-profile.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ProfilesService {
  constructor(private readonly db: DatabaseService) {}

  async getMyProfile(userId: string) {
    let profile: any = null;

    if (this.db.isUsingSupabase && this.db.client) {
      const { data } = await this.db.client
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      profile = data;
    } else {
      profile = this.db.inMemory.profiles.get(userId);
    }

    if (!profile) {
      // Auto-initialize profile if first login
      profile = {
        id: userId,
        user_id: userId,
        full_name: 'New Candidate',
        headline: 'Aspiring Software Engineer',
        bio: '',
        location: '',
        education: '',
        institution: '',
        graduation_year: new Date().getFullYear(),
        experience: '',
        certifications: '',
        github_url: '',
        linkedin_url: '',
        resume_url: '',
        visibility: 'public',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      if (this.db.isUsingSupabase && this.db.client) {
        await this.db.client.from('profiles').insert(profile);
      } else {
        this.db.inMemory.profiles.set(userId, profile);
      }
    }

    const skills = await this.getProfileSkills(profile.id);
    const completeness = this.calculateCompleteness(profile, skills);

    return {
      ...profile,
      skills,
      completenessScore: completeness,
    };
  }

  async updateMyProfile(userId: string, dto: UpdateProfileDto) {
    const existing = await this.getMyProfile(userId);

    const getVal = (camel: string, snake: string) => {
      if ((dto as any)[camel] !== undefined) return (dto as any)[camel];
      if ((dto as any)[snake] !== undefined) return (dto as any)[snake];
      return undefined;
    };

    const dbPayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (getVal('fullName', 'full_name') !== undefined) dbPayload.full_name = getVal('fullName', 'full_name');
    if (getVal('avatarUrl', 'avatar_url') !== undefined) dbPayload.avatar_url = getVal('avatarUrl', 'avatar_url');
    if (getVal('headline', 'headline') !== undefined) dbPayload.headline = getVal('headline', 'headline');
    if (getVal('bio', 'bio') !== undefined) dbPayload.bio = getVal('bio', 'bio');
    if (getVal('location', 'location') !== undefined) dbPayload.location = getVal('location', 'location');
    if (getVal('education', 'education') !== undefined) dbPayload.education = getVal('education', 'education');
    if (getVal('institution', 'institution') !== undefined) dbPayload.institution = getVal('institution', 'institution');
    if (getVal('graduationYear', 'graduation_year') !== undefined) {
      const yr = Number(getVal('graduationYear', 'graduation_year'));
      dbPayload.graduation_year = isNaN(yr) ? null : yr;
    }
    if (getVal('experience', 'experience') !== undefined) dbPayload.experience = getVal('experience', 'experience');
    if (getVal('certifications', 'certifications') !== undefined) dbPayload.certifications = getVal('certifications', 'certifications');
    if (getVal('githubUrl', 'github_url') !== undefined) dbPayload.github_url = getVal('githubUrl', 'github_url');
    if (getVal('linkedinUrl', 'linkedin_url') !== undefined) dbPayload.linkedin_url = getVal('linkedinUrl', 'linkedin_url');
    const resumeVal = getVal('resumeUrl', 'resume_url');
    if (resumeVal !== undefined && resumeVal !== null && typeof resumeVal === 'string' && resumeVal.trim().length > 0) {
      dbPayload.resume_url = resumeVal.trim();
    }
    if (getVal('visibility', 'visibility') !== undefined) dbPayload.visibility = getVal('visibility', 'visibility');

    if (this.db.isUsingSupabase && this.db.client) {
      let { data, error } = await this.db.client
        .from('profiles')
        .update(dbPayload)
        .eq('user_id', userId)
        .select();

      if (error) {
        console.error('Supabase profile update error:', error);
        throw new Error(`Database update failed: ${error.message}`);
      }

      if (!data || data.length === 0) {
        // Fallback update by profile id
        const { error: idErr } = await this.db.client
          .from('profiles')
          .update(dbPayload)
          .eq('id', existing.id);
        if (idErr) {
          console.error('Supabase fallback profile update error:', idErr);
        }
      }
    } else {
      const memoryProfile = {
        ...existing,
        ...dbPayload,
      };
      this.db.inMemory.profiles.set(userId, memoryProfile);
    }

    return this.getMyProfile(userId);
  }

  async getPublicProfile(idOrUserId: string) {
    let profile: any = null;
    if (this.db.isUsingSupabase && this.db.client) {
      const { data } = await this.db.client
        .from('profiles')
        .select('*')
        .or(`id.eq.${idOrUserId},user_id.eq.${idOrUserId}`)
        .single();
      profile = data;
    } else {
      profile =
        this.db.inMemory.profiles.get(idOrUserId) ||
        Array.from(this.db.inMemory.profiles.values()).find(
          (p) => p.user_id === idOrUserId,
        );
    }

    if (!profile) {
      throw new NotFoundException('Candidate profile not found');
    }

    const skills = await this.getProfileSkills(profile.id);
    return {
      ...profile,
      skills,
      completenessScore: this.calculateCompleteness(profile, skills),
    };
  }

  async addSkill(userId: string, dto: AddSkillDto) {
    const profile = await this.getMyProfile(userId);
    const skillRecord = {
      id: uuidv4(),
      profile_id: profile.id,
      skill_name: dto.skillName,
      proficiency_level: dto.proficiencyLevel,
      evidence_description: dto.evidenceDescription || '',
      category: dto.category || 'General',
      verified: true,
      created_at: new Date().toISOString(),
    };

    if (this.db.isUsingSupabase && this.db.client) {
      // Find or create skill in skills table
      let { data: sk } = await this.db.client
        .from('skills')
        .select('id')
        .eq('name', dto.skillName)
        .single();
      if (!sk) {
        const { data: newSk } = await this.db.client
          .from('skills')
          .insert({ name: dto.skillName, category: 'general' })
          .select()
          .single();
        sk = newSk;
      }
      await this.db.client.from('profile_skills').insert({
        profile_id: profile.id,
        skill_id: sk.id,
        proficiency_level: dto.proficiencyLevel,
        evidence_description: dto.evidenceDescription || '',
      });
    } else {
      const list = this.db.inMemory.profileSkills.get(profile.id) || [];
      list.push(skillRecord);
      this.db.inMemory.profileSkills.set(profile.id, list);
    }

    return skillRecord;
  }

  async removeSkill(userId: string, skillId: string) {
    const profile = await this.getMyProfile(userId);
    if (this.db.isUsingSupabase && this.db.client) {
      await this.db.client
        .from('profile_skills')
        .delete()
        .eq('profile_id', profile.id)
        .eq('id', skillId);
    } else {
      const list = this.db.inMemory.profileSkills.get(profile.id) || [];
      this.db.inMemory.profileSkills.set(
        profile.id,
        list.filter((s) => s.id !== skillId && s.skill_id !== skillId),
      );
    }
    return { success: true };
  }

  private async getProfileSkills(profileId: string) {
    if (this.db.isUsingSupabase && this.db.client) {
      const { data } = await this.db.client
        .from('profile_skills')
        .select('id, proficiency_level, evidence_description, verified, skills(name, category)')
        .eq('profile_id', profileId);
      return (
        data?.map((item: any) => ({
          id: item.id,
          skill_name: item.skills?.name || 'Skill',
          category: item.skills?.category || 'general',
          proficiency_level: item.proficiency_level,
          evidence_description: item.evidence_description,
          verified: item.verified,
        })) || []
      );
    }

    const list = this.db.inMemory.profileSkills.get(profileId) || [];
    return list.map((item) => {
      const globalSkill = this.db.inMemory.skills.get(item.skill_id);
      return {
        ...item,
        skill_name: item.skill_name || globalSkill?.name || 'Skill',
        category: item.category || globalSkill?.category || 'general',
      };
    });
  }

  private calculateCompleteness(profile: any, skills: any[]): number {
    let score = 0;
    if (profile.full_name) score += 10;
    if (profile.headline) score += 15;
    if (profile.bio && profile.bio.length > 30) score += 20;
    if (profile.education) score += 10;
    if (profile.location) score += 5;
    if (profile.github_url) score += 10;
    if (profile.linkedin_url) score += 10;
    if (skills && skills.length >= 3) score += 20;
    return Math.min(100, score);
  }

  async clearResume(userId: string) {
    if (this.db.isUsingSupabase && this.db.client) {
      await this.db.client
        .from('profiles')
        .update({ resume_url: null })
        .or(`user_id.eq.${userId},id.eq.${userId}`);
    }
    const mem = this.db.inMemory.profiles.get(userId);
    if (mem) mem.resume_url = null;
    return { success: true, message: 'Resume cleared successfully.' };
  }
}
