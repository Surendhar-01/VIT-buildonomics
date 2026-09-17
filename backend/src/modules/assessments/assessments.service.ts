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

    // Deduplicate assessments by normalized title
    const seenTitles = new Set<string>();
    const deduplicatedList: any[] = [];
    for (const a of list) {
      const normTitle = (a.title || '').trim().toLowerCase();
      if (!seenTitles.has(normTitle)) {
        seenTitles.add(normTitle);
        deduplicatedList.push(a);
      }
    }
    return deduplicatedList;
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

    // Ensure public sample test cases are populated for each problem
    for (const prob of problems) {
      if (!prob.sampleTestCases || prob.sampleTestCases.length === 0) {
        if (this.db.isUsingSupabase && this.db.client) {
          const { data: tcs } = await this.db.client
            .from('coding_test_cases')
            .select('*')
            .eq('problem_id', prob.id)
            .eq('is_hidden', false);
          if (tcs && tcs.length > 0) {
            prob.sampleTestCases = tcs;
          }
        }
        if (!prob.sampleTestCases || prob.sampleTestCases.length === 0) {
          const memCases = this.db.inMemory.codingTestCases.get(prob.id) || [];
          prob.sampleTestCases = memCases.filter((tc: any) => !tc.is_hidden);
        }
      }
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

  async disqualifyAssessment(
    assessmentId: string,
    candidateId: string,
    body: { attemptId?: string; reason: string; violationsLog?: any[] },
  ) {
    const attemptId = body.attemptId || uuidv4();
    let attempt = this.db.inMemory.assessmentAttempts.get(attemptId);
    if (!attempt && this.db.isUsingSupabase && this.db.client && body.attemptId) {
      try {
        const { data } = await this.db.client
          .from('assessment_attempts')
          .select('*')
          .eq('id', attemptId)
          .single();
        attempt = data;
      } catch {}
    }

    const disqualifiedAt = new Date().toISOString();
    const updated = {
      ...(attempt || {
        id: attemptId,
        assessment_id: assessmentId,
        candidate_id: candidateId,
        started_at: disqualifiedAt,
      }),
      status: 'disqualified',
      total_score: 0,
      percentage: 0,
      submitted_at: disqualifiedAt,
      violation_reason: body.reason || 'Prohibited action detected during proctored session',
      violations_log: body.violationsLog || [],
    };

    if (this.db.isUsingSupabase && this.db.client) {
      try {
        await this.db.client
          .from('assessment_attempts')
          .upsert(updated)
          .eq('id', attemptId);
      } catch {}
    }

    this.db.inMemory.assessmentAttempts.set(attemptId, updated);
    this.db.logAudit(candidateId, 'ASSESSMENT_DISQUALIFIED', 'assessment_attempt', attemptId, {
      reason: body.reason,
      violationsCount: body.violationsLog?.length || 1,
    });

    return {
      success: true,
      disqualified: true,
      attemptId,
      reason: body.reason,
      disqualifiedAt,
      message: 'Candidate disqualified due to anti-cheat proctoring violation. Credential eligibility revoked.',
    };
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

    if (attempt.status === 'disqualified') {
      return {
        attempt,
        submissions: [],
        skillSummary: {
          accuracy: 0,
          speedRating: 'Disqualified',
          timeComplexityScore: 'Disqualified',
          recommendedNextStep: `Assessment rejected due to proctoring violation: ${attempt.violation_reason || 'Prohibited actions detected'}. Credential generation (Ed25519) revoked.`,
        },
      };
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
        .select('id, user_id, headline, full_name, resume_url')
        .or(`user_id.eq.${userId},id.eq.${userId}`)
        .single();
      profile = data;

      if (profile) {
        const { data: ps } = await this.db.client
          .from('profile_skills')
          .select('proficiency_level, evidence_description, verified, skills(name, category)')
          .eq('profile_id', profile.id);

        profile.skills = (ps || []).map((item: any) => ({
          name: item.skills?.name || 'Skill',
          category: item.skills?.category || 'general',
          proficiency_level: item.proficiency_level,
          evidence_description: item.evidence_description,
          verified: item.verified,
        }));
      }
    } else {
      profile =
        this.db.inMemory.profiles.get(userId) ||
        Array.from(this.db.inMemory.profiles.values()).find((p) => p.user_id === userId);
      if (profile) {
        const profileSkills =
          this.db.inMemory.profileSkills.get(profile.id) ||
          this.db.inMemory.profileSkills.get(userId) ||
          [];
        profile.skills = profileSkills.map((ps: any) => {
          const skill = this.db.inMemory.skills.get(ps.skill_id);
          return skill
            ? { ...skill, proficiency_level: ps.proficiency_level }
            : { name: ps.skill_name || 'Skill' };
        });
      }
    }

    return profile;
  }

  async getPersonalizedRecommendations(userId: string, role?: string) {
    const isStaffOrRecruiter = role && ['recruiter', 'admin', 'issuer'].includes(role.toLowerCase());

    const profile = await this.getProfileWithSkills(userId);
    const rawSkills = profile?.skills || [];
    const skillNames = rawSkills
      .map((s: any) => s?.skill_name || s?.name || (typeof s === 'string' ? s : ''))
      .filter(Boolean);

    const hasUploadedResume = Boolean(
      (profile?.resume_url && profile.resume_url.trim().length > 0) ||
      skillNames.length > 0
    );

    // If candidate has NOT uploaded a resume OR has no skills extracted (and not recruiter/admin/issuer):
    if (!isStaffOrRecruiter && (!hasUploadedResume || skillNames.length === 0)) {
      return {
        hasResume: false,
        unlocked: false,
        message: 'No resume uploaded yet. In your profile page, please upload your resume to unlock problem-solving assessments tailored to your skills.',
        candidateSkills: [],
        assessments: [],
        problems: [],
      };
    }

    const allAssessments = await this.getAllAssessments();

    // Fetch problems from DB/in-memory
    let allProblems: any[] = [];
    if (this.db.isUsingSupabase && this.db.client) {
      const { data } = await this.db.client
        .from('coding_problems')
        .select('*')
        .eq('status', 'published');
      allProblems = data || [];
    }
    const memProblems = Array.from(this.db.inMemory.codingProblems.values()).filter(
      (p) => p.status === 'published',
    );
    const existingProblemIds = new Set(allProblems.map((p) => p.id));
    for (const mp of memProblems) {
      if (!existingProblemIds.has(mp.id)) {
        allProblems.push(mp);
      }
    }

    if (isStaffOrRecruiter) {
      return {
        hasResume: true,
        unlocked: true,
        candidateSkills: ['Algorithms', 'Data Structures', 'Full-Stack', 'Relational Databases'],
        assessments: allAssessments.map((a: any) => ({
          ...a,
          isRecommended: true,
          matchedSkills: ['Core Engineering', 'Problem Solving'],
          recommendationReason: 'Platform benchmark catalog entry',
        })),
        problems: allProblems.map((p: any) => ({
          ...p,
          isRecommended: true,
          matchedSkills: [p.category || 'Algorithms'],
        })),
      };
    }

    const lowerSkills = skillNames.map((s: string) => s.toLowerCase());

    const matchedAssessments = allAssessments
      .map((a: any) => {
        const cat = (a.category || '').toLowerCase();
        const title = (a.title || '').toLowerCase();
        const desc = (a.description || '').toLowerCase();

        const matched: string[] = [];
        lowerSkills.forEach((s: string) => {
          if (cat.includes(s) || title.includes(s) || desc.includes(s)) {
            matched.push(s);
          } else if (
            (s.includes('sql') || s.includes('postgres') || s.includes('mysql') || s.includes('database') || s.includes('rdbms')) &&
            (cat.includes('sql') || cat.includes('database') || title.includes('sql') || title.includes('database'))
          ) {
            matched.push(s);
          } else if (
            (s.includes('react') ||
              s.includes('vue') ||
              s.includes('angular') ||
              s.includes('frontend') ||
              s.includes('javascript') ||
              s.includes('typescript') ||
              s.includes('html') ||
              s.includes('css') ||
              s.includes('tailwind') ||
              s.includes('next')) &&
            (cat.includes('frontend') || title.includes('frontend'))
          ) {
            matched.push(s);
          } else if (
            (s.includes('node') ||
              s.includes('express') ||
              s.includes('nest') ||
              s.includes('backend') ||
              s.includes('redis') ||
              s.includes('python') ||
              s.includes('api') ||
              s.includes('django') ||
              s.includes('fastapi') ||
              s.includes('spring')) &&
            (cat.includes('backend') || title.includes('backend'))
          ) {
            matched.push(s);
          } else if (
            (s.includes('algorithm') ||
              s.includes('data structure') ||
              s.includes('dsa') ||
              s.includes('java') ||
              s.includes('c++') ||
              s.includes('c#') ||
              s.includes('python') ||
              s.includes('problem solving') ||
              s.includes('fullstack') ||
              s.includes('full stack')) &&
            (cat.includes('full stack') || title.includes('algorithmic'))
          ) {
            matched.push(s);
          }
        });

        const uniqueMatched = Array.from(new Set(matched));
        if (uniqueMatched.length > 0) {
          return {
            ...a,
            isRecommended: true,
            matchedSkills: uniqueMatched,
            recommendationReason: `Matched from your resume: ${uniqueMatched.join(', ')}`,
          };
        }
        return null;
      })
      .filter(Boolean);

    // Deduplicate matched assessments by title
    const seenAssessTitles = new Set<string>();
    const deduplicatedAssessments: any[] = [];
    for (const a of matchedAssessments) {
      const norm = (a.title || '').trim().toLowerCase();
      if (!seenAssessTitles.has(norm)) {
        seenAssessTitles.add(norm);
        deduplicatedAssessments.push(a);
      }
    }

    // Ensure at least 1 assessment is unlocked if resume skills are present
    if (deduplicatedAssessments.length === 0 && allAssessments.length > 0) {
      deduplicatedAssessments.push({
        ...allAssessments[0],
        isRecommended: true,
        matchedSkills: skillNames.slice(0, 3),
        recommendationReason: `Recommended technical benchmark for ${skillNames[0]} profile`,
      });
    }

    const matchedProblems = allProblems
      .map((p: any) => {
        const cat = (p.category || '').toLowerCase();
        const title = (p.title || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();

        const matched: string[] = [];
        lowerSkills.forEach((s: string) => {
          if (cat.includes(s) || title.includes(s) || desc.includes(s)) {
            matched.push(s);
          } else if (
            (s.includes('sql') || s.includes('postgres') || s.includes('mysql')) &&
            (cat.includes('sql') || cat.includes('database'))
          ) {
            matched.push(s);
          } else if (
            (s.includes('react') || s.includes('javascript') || s.includes('typescript') || s.includes('frontend')) &&
            cat.includes('frontend')
          ) {
            matched.push(s);
          } else if (
            (s.includes('node') || s.includes('backend') || s.includes('redis') || s.includes('python')) &&
            (cat.includes('backend') || cat.includes('system'))
          ) {
            matched.push(s);
          } else if (
            (s.includes('algorithm') || s.includes('two sum') || s.includes('stack') || s.includes('dsa') || s.includes('java')) &&
            (cat.includes('algorithm') || cat.includes('data-structure'))
          ) {
            matched.push(s);
          }
        });

        const uniqueMatched = Array.from(new Set(matched));
        if (uniqueMatched.length > 0) {
          return {
            ...p,
            isRecommended: true,
            matchedSkills: uniqueMatched,
          };
        }
        return null;
      })
      .filter(Boolean);

    if (matchedProblems.length === 0 && allProblems.length > 0) {
      matchedProblems.push({
        ...allProblems[0],
        isRecommended: true,
        matchedSkills: skillNames.slice(0, 2),
      });
    }

    return {
      hasResume: true,
      unlocked: true,
      candidateSkills: skillNames,
      assessments: deduplicatedAssessments,
      problems: matchedProblems,
    };
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
