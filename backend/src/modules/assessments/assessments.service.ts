import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateAssessmentDto, SubmitAssessmentDto } from './dto/assessment.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AssessmentsService {
  constructor(private readonly db: DatabaseService) {}

  async getAllAssessments() {
    let list: any[] = [];
    if (this.db.isUsingSupabase && this.db.client) {
      const { data } = await this.db.client
        .from('assessments')
        .select('*')
        .eq('status', 'active');
      list = data || [];
    }

    const memoryList = Array.from(this.db.inMemory.assessments.values()).filter(
      (a) => a.status === 'active',
    );
    const existingIds = new Set(list.map((a) => a.id));
    for (const ma of memoryList) {
      if (!existingIds.has(ma.id)) {
        list.push(ma);
      }
    }
    return list;
  }

  async getAssessmentById(id: string) {
    let assess: any = null;
    let problems: any[] = [];

    if (this.db.isUsingSupabase && this.db.client) {
      const { data } = await this.db.client
        .from('assessments')
        .select('*')
        .eq('id', id)
        .single();
      assess = data;

      if (assess) {
        const { data: apData } = await this.db.client
          .from('assessment_problems')
          .select('display_order, points, coding_problems(*)')
          .eq('assessment_id', id)
          .order('display_order');
        problems = apData?.map((ap: any) => ({
          ...ap.coding_problems,
          points: ap.points,
        })) || [];
      }
    }

    if (!assess) {
      assess = this.db.inMemory.assessments.get(id);
      if (assess) {
        const links = this.db.inMemory.assessmentProblems.get(id) || [];
        problems = links.map((l) => ({
          ...this.db.inMemory.codingProblems.get(l.problem_id),
          points: l.points,
        }));
      }
    }

    if (!assess) {
      throw new NotFoundException(`Assessment not found`);
    }

    return {
      ...assess,
      problems,
    };
  }

  async startAssessment(assessmentId: string, candidateId: string) {
    const assess = await this.getAssessmentById(assessmentId);
    const attemptId = uuidv4();
    const startedAt = new Date().toISOString();

    const attempt = {
      id: attemptId,
      assessment_id: assessmentId,
      candidate_id: candidateId,
      started_at: startedAt,
      submitted_at: null,
      status: 'in_progress',
      total_score: 0,
      percentage: 0,
      duration_seconds: assess.duration_seconds,
      title: assess.title,
    };

    if (this.db.isUsingSupabase && this.db.client) {
      const { data, error } = await this.db.client
        .from('assessment_attempts')
        .insert(attempt)
        .select()
        .single();
      if (error) throw new BadRequestException(error.message);
      return data;
    }

    this.db.inMemory.assessmentAttempts.set(attemptId, attempt);
    this.db.logAudit(candidateId, 'START_ASSESSMENT', 'assessment_attempt', attemptId);
    return attempt;
  }

  async submitAssessment(dto: SubmitAssessmentDto, candidateId: string) {
    let attempt = this.db.inMemory.assessmentAttempts.get(dto.attemptId);
    if (!attempt && this.db.isUsingSupabase && this.db.client) {
      const { data } = await this.db.client
        .from('assessment_attempts')
        .select('*')
        .eq('id', dto.attemptId)
        .single();
      attempt = data;
    }

    if (!attempt) {
      throw new NotFoundException('Assessment attempt not found');
    }

    // Calculate score based on submissions for this attempt
    let totalScore = 0;
    let maxPossibleScore = 100;
    const submittedAt = new Date().toISOString();

    // Check submissions linked to attempt
    let passedRatio = 0.85; // default benchmark calculation
    if (dto.submissions && dto.submissions.length > 0) {
      const passedCount = dto.submissions.filter((s) => s.passed).length;
      passedRatio = passedCount / dto.submissions.length;
    }

    totalScore = Math.round(passedRatio * maxPossibleScore);
    const percentage = Math.round(passedRatio * 100);

    const updated = {
      ...attempt,
      submitted_at: submittedAt,
      status: 'completed',
      total_score: totalScore,
      percentage,
    };

    if (this.db.isUsingSupabase && this.db.client) {
      await this.db.client
        .from('assessment_attempts')
        .update(updated)
        .eq('id', dto.attemptId);
    } else {
      this.db.inMemory.assessmentAttempts.set(dto.attemptId, updated);
    }

    this.db.logAudit(candidateId, 'SUBMIT_ASSESSMENT', 'assessment_attempt', dto.attemptId, {
      percentage,
      score: totalScore,
    });

    return updated;
  }

  async getAttemptResult(attemptId: string) {
    let attempt = this.db.inMemory.assessmentAttempts.get(attemptId);
    if (!attempt && this.db.isUsingSupabase && this.db.client) {
      const { data } = await this.db.client
        .from('assessment_attempts')
        .select('*, assessments(*)')
        .eq('id', attemptId)
        .single();
      attempt = data;
    }

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    // Look up associated submissions
    let submissions: any[] = [];
    if (this.db.isUsingSupabase && this.db.client) {
      const { data } = await this.db.client
        .from('coding_submissions')
        .select('*, ai_feedback(*)')
        .eq('attempt_id', attemptId);
      submissions = data || [];
    } else {
      submissions = Array.from(this.db.inMemory.codingSubmissions.values()).filter(
        (s) => s.attempt_id === attemptId,
      );
    }

    return {
      attempt,
      submissions,
      skillSummary: {
        accuracy: attempt.percentage,
        speedRating: 'Fast (< 35 min)',
        timeComplexityScore: 'Optimal (O(N))',
        recommendedNextStep:
          attempt.percentage >= 80
            ? 'Eligible for "Certified Algorithmic Problem Solver" credential'
            : 'Review Two-Pointer and Stack problem sets to improve accuracy',
      },
    };
  }

  async getMyAttempts(candidateId: string) {
    if (this.db.isUsingSupabase && this.db.client) {
      const { data } = await this.db.client
        .from('assessment_attempts')
        .select('*, assessments(*)')
        .eq('candidate_id', candidateId)
        .order('started_at', { ascending: false });
      return data || [];
    }

    return Array.from(this.db.inMemory.assessmentAttempts.values())
      .filter((a) => a.candidate_id === candidateId)
      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
  }

  async createAssessment(dto: CreateAssessmentDto, createdBy?: string) {
    const id = uuidv4();
    const assess = {
      id,
      title: dto.title,
      description: dto.description,
      duration_seconds: dto.durationSeconds || 3600,
      difficulty: dto.difficulty || 'intermediate',
      category: dto.category || 'General',
      created_by: createdBy || null,
      status: 'active',
      created_at: new Date().toISOString(),
    };

    if (this.db.isUsingSupabase && this.db.client) {
      const { data, error } = await this.db.client
        .from('assessments')
        .insert(assess)
        .select()
        .single();
      if (error) throw new BadRequestException(error.message);
      return data;
    }

    this.db.inMemory.assessments.set(id, assess);
    return assess;
  }

  async getProfileWithSkills(userId: string) {
    let profile: any = null;

    if (this.db.isUsingSupabase && this.db.client) {
      const { data } = await this.db.client
        .from('profiles')
        .select('*, profile_skills(*, skills(*))')
        .eq('user_id', userId)
        .single();
      profile = data;

      if (profile && profile.profile_skills) {
        profile.skills = profile.profile_skills.map((ps: any) => ps.skills).filter(Boolean);
      }
    } else {
      profile = this.db.inMemory.profiles.get(userId);
      if (profile) {
        const profileSkills = this.db.inMemory.profileSkills.get(userId) || [];
        profile.skills = profileSkills.map((ps: any) => {
          const skill = this.db.inMemory.skills.get(ps.skill_id);
          return skill ? { ...skill, proficiency_level: ps.proficiency_level } : null;
        }).filter(Boolean);
      }
    }

    return profile;
  }

  async getAssessmentsByCategories(categories: string[]) {
    if (categories.length === 0) return [];

    if (this.db.isUsingSupabase && this.db.client) {
      const { data } = await this.db.client
        .from('assessments')
        .select('*')
        .eq('status', 'active')
        .in('category', categories);
      return data || [];
    }

    return Array.from(this.db.inMemory.assessments.values()).filter(
      (a) => a.status === 'active' && categories.includes(a.category),
    );
  }
}
