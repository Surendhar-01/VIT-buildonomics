-- ==========================================================
-- AI SkillProof Platform — Database Schema Migration (001)
-- PostgreSQL / Supabase Schema Definition
-- ==========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    headline TEXT,
    bio TEXT,
    location TEXT,
    education TEXT,
    institution TEXT,
    graduation_year INTEGER,
    experience TEXT,
    certifications TEXT,
    github_url TEXT,
    linkedin_url TEXT,
    resume_url TEXT,
    visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'recruiters_only')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. USER ROLES
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'recruiter', 'issuer', 'admin')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_role UNIQUE (user_id, role)
);

-- 3. SKILLS
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL CHECK (category IN ('frontend', 'backend', 'database', 'ai', 'cloud', 'devops', 'mobile', 'languages', 'fundamentals')),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. PROFILE SKILLS
CREATE TABLE IF NOT EXISTS profile_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    proficiency_level TEXT NOT NULL DEFAULT 'intermediate' CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    evidence_description TEXT,
    verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_profile_skill UNIQUE (profile_id, skill_id)
);

-- 5. PORTFOLIOS
CREATE TABLE IF NOT EXISTS portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    template TEXT NOT NULL DEFAULT 'modern-minimal' CHECK (template IN ('modern-minimal', 'tech-lead', 'creative-dev', 'executive-summary')),
    theme TEXT NOT NULL DEFAULT 'dark-indigo' CHECK (theme IN ('dark-indigo', 'slate-cyan', 'cyber-emerald', 'light-clean')),
    is_published BOOLEAN NOT NULL DEFAULT false,
    custom_domain TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. PORTFOLIO SECTIONS
CREATE TABLE IF NOT EXISTS portfolio_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    section_type TEXT NOT NULL CHECK (section_type IN ('hero', 'about', 'skills', 'projects', 'assessments', 'credentials', 'experience', 'education', 'contact')),
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_visible BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. PROJECTS
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    repository_url TEXT,
    live_url TEXT,
    technologies TEXT[] NOT NULL DEFAULT '{}',
    category TEXT DEFAULT 'Full Stack',
    contribution_details TEXT,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('in_progress', 'completed', 'archived')),
    visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
    is_featured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. PROJECT IMAGES
CREATE TABLE IF NOT EXISTS project_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    alt_text TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. CODING PROBLEMS
CREATE TABLE IF NOT EXISTS coding_problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    category TEXT NOT NULL CHECK (category IN ('algorithms', 'data-structures', 'sql', 'system-logic', 'debugging', 'frontend-logic')),
    supported_languages TEXT[] NOT NULL DEFAULT ARRAY['javascript', 'python', 'java'],
    constraints TEXT,
    starter_code JSONB NOT NULL DEFAULT '{"javascript": "", "python": "", "java": ""}'::jsonb,
    evaluation_type TEXT NOT NULL DEFAULT 'standard_io' CHECK (evaluation_type IN ('standard_io', 'unit_test', 'sql_eval')),
    created_by UUID,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. CODING TEST CASES
CREATE TABLE IF NOT EXISTS coding_test_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL REFERENCES coding_problems(id) ON DELETE CASCADE,
    input_data TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    is_hidden BOOLEAN NOT NULL DEFAULT false,
    weight INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. ASSESSMENTS
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL DEFAULT 3600,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    category TEXT NOT NULL,
    created_by UUID,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. ASSESSMENT PROBLEMS
CREATE TABLE IF NOT EXISTS assessment_problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES coding_problems(id) ON DELETE CASCADE,
    display_order INTEGER NOT NULL DEFAULT 0,
    points INTEGER NOT NULL DEFAULT 100,
    CONSTRAINT uq_assessment_problem UNIQUE (assessment_id, problem_id)
);

-- 13. ASSESSMENT ATTEMPTS
CREATE TABLE IF NOT EXISTS assessment_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'timed_out', 'abandoned')),
    total_score NUMERIC(5,2) DEFAULT 0,
    percentage NUMERIC(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. CODING SUBMISSIONS
CREATE TABLE IF NOT EXISTS coding_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID REFERENCES assessment_attempts(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES coding_problems(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    language TEXT NOT NULL CHECK (language IN ('javascript', 'python', 'java')),
    source_code TEXT NOT NULL,
    execution_status TEXT NOT NULL CHECK (execution_status IN ('passed', 'failed', 'runtime_error', 'timeout', 'compile_error')),
    passed_test_cases INTEGER NOT NULL DEFAULT 0,
    total_test_cases INTEGER NOT NULL DEFAULT 0,
    execution_time_ms INTEGER DEFAULT 0,
    memory_usage_kb INTEGER DEFAULT 0,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. AI FEEDBACK
CREATE TABLE IF NOT EXISTS ai_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES coding_submissions(id) ON DELETE CASCADE,
    feedback_type TEXT NOT NULL DEFAULT 'code_review' CHECK (feedback_type IN ('code_review', 'skill_gap', 'portfolio_optimization')),
    content JSONB NOT NULL,
    model_name TEXT NOT NULL DEFAULT 'gemini-1.5-flash',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. CREDENTIAL TEMPLATES
CREATE TABLE IF NOT EXISTS credential_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issuer_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    criteria TEXT NOT NULL,
    credential_type TEXT NOT NULL CHECK (credential_type IN ('course_completion', 'assessment_achievement', 'project_completion', 'internship_completion', 'institution_skill', 'custom')),
    template_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. CREDENTIALS
CREATE TABLE IF NOT EXISTS credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credential_id TEXT NOT NULL UNIQUE,
    recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    issuer_id UUID NOT NULL,
    template_id UUID REFERENCES credential_templates(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    achievement_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    credential_type TEXT NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
    signature TEXT NOT NULL,
    key_id TEXT NOT NULL,
    verification_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. CREDENTIAL REVOCATIONS
CREATE TABLE IF NOT EXISTS credential_revocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credential_id TEXT NOT NULL REFERENCES credentials(credential_id) ON DELETE CASCADE,
    revoked_by UUID NOT NULL,
    reason TEXT NOT NULL,
    revoked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. CREDENTIAL VERIFICATION LOGS
CREATE TABLE IF NOT EXISTS credential_verification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credential_id TEXT NOT NULL REFERENCES credentials(credential_id) ON DELETE CASCADE,
    verification_result TEXT NOT NULL CHECK (verification_result IN ('valid', 'revoked', 'expired', 'tampered', 'not_found')),
    ip_hash TEXT,
    user_agent TEXT,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. RECRUITER SHORTLISTS
CREATE TABLE IF NOT EXISTS recruiter_shortlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recruiter_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 21. SHORTLISTED CANDIDATES
CREATE TABLE IF NOT EXISTS shortlisted_candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shortlist_id UUID NOT NULL REFERENCES recruiter_shortlists(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'reviewing' CHECK (status IN ('reviewing', 'interview_requested', 'offered', 'rejected', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_shortlist_candidate UNIQUE (shortlist_id, candidate_id)
);

-- 22. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_slug ON portfolios(slug);
CREATE INDEX IF NOT EXISTS idx_projects_profile_id ON projects(profile_id);
CREATE INDEX IF NOT EXISTS idx_coding_problems_slug ON coding_problems(slug);
CREATE INDEX IF NOT EXISTS idx_test_cases_problem_id ON coding_test_cases(problem_id);
CREATE INDEX IF NOT EXISTS idx_attempts_candidate ON assessment_attempts(candidate_id);
CREATE INDEX IF NOT EXISTS idx_credentials_recipient ON credentials(recipient_id);
CREATE INDEX IF NOT EXISTS idx_credentials_id ON credentials(credential_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
