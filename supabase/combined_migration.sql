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


-- ==========================================

-- ==========================================================
-- AI SkillProof Platform — Row Level Security (RLS) Policies (002)
-- ==========================================================

-- Enable RLS on all sensitive tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE coding_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE coding_test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE coding_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE credential_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE credential_revocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE credential_verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruiter_shortlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shortlisted_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES POLICIES
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (visibility = 'public' OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = user_id);

-- 2. USER ROLES POLICIES
CREATE POLICY "Users can view their own roles" 
ON user_roles FOR SELECT 
USING (auth.uid() = user_id);

-- 3. SKILLS POLICIES
CREATE POLICY "Skills are readable by everyone" 
ON skills FOR SELECT 
TO authenticated, anon 
USING (true);

-- 4. PROFILE SKILLS POLICIES
CREATE POLICY "Profile skills viewable if profile is viewable" 
ON profile_skills FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = profile_skills.profile_id 
    AND (p.visibility = 'public' OR p.user_id = auth.uid())
));

CREATE POLICY "Users can manage their own profile skills" 
ON profile_skills FOR ALL 
USING (EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = profile_skills.profile_id AND p.user_id = auth.uid()
));

-- 5. PORTFOLIOS POLICIES
CREATE POLICY "Published portfolios are viewable by anyone" 
ON portfolios FOR SELECT 
USING (is_published = true OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = portfolios.profile_id AND p.user_id = auth.uid()
));

CREATE POLICY "Users can manage their own portfolios" 
ON portfolios FOR ALL 
USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = portfolios.profile_id AND p.user_id = auth.uid()
));

-- 6. PORTFOLIO SECTIONS POLICIES
CREATE POLICY "Portfolio sections viewable if portfolio is visible" 
ON portfolio_sections FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM portfolios port 
    WHERE port.id = portfolio_sections.portfolio_id 
    AND (port.is_published = true OR EXISTS (
        SELECT 1 FROM profiles p WHERE p.id = port.profile_id AND p.user_id = auth.uid()
    ))
));

CREATE POLICY "Users can manage their portfolio sections" 
ON portfolio_sections FOR ALL 
USING (EXISTS (
    SELECT 1 FROM portfolios port 
    JOIN profiles p ON p.id = port.profile_id 
    WHERE port.id = portfolio_sections.portfolio_id AND p.user_id = auth.uid()
));

-- 7. PROJECTS POLICIES
CREATE POLICY "Public projects are viewable by anyone" 
ON projects FOR SELECT 
USING (visibility = 'public' OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = projects.profile_id AND p.user_id = auth.uid()
));

CREATE POLICY "Users can manage their own projects" 
ON projects FOR ALL 
USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = projects.profile_id AND p.user_id = auth.uid()
));

-- 8. CODING PROBLEMS POLICIES
CREATE POLICY "Published coding problems viewable by authenticated users" 
ON coding_problems FOR SELECT 
TO authenticated, anon 
USING (status = 'published');

-- 9. CODING TEST CASES POLICIES (PROTECT HIDDEN TEST CASES)
CREATE POLICY "Public sample test cases are viewable" 
ON coding_test_cases FOR SELECT 
TO authenticated 
USING (is_hidden = false);

-- 10. ASSESSMENTS POLICIES
CREATE POLICY "Active assessments viewable by authenticated users" 
ON assessments FOR SELECT 
TO authenticated 
USING (status = 'active');

CREATE POLICY "Assessment problems viewable by authenticated users" 
ON assessment_problems FOR SELECT 
TO authenticated 
USING (true);

-- 11. ATTEMPTS & SUBMISSIONS POLICIES
CREATE POLICY "Candidates can view their own attempts" 
ON assessment_attempts FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = assessment_attempts.candidate_id AND p.user_id = auth.uid()
));

CREATE POLICY "Candidates can insert their own attempts" 
ON assessment_attempts FOR INSERT 
WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = assessment_attempts.candidate_id AND p.user_id = auth.uid()
));

CREATE POLICY "Candidates can view their own submissions" 
ON coding_submissions FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = coding_submissions.candidate_id AND p.user_id = auth.uid()
));

-- 12. CREDENTIALS POLICIES (PUBLIC VERIFICATION)
CREATE POLICY "Credentials are publicly readable for verification" 
ON credentials FOR SELECT 
TO authenticated, anon 
USING (true);

CREATE POLICY "Credential revocations are publicly readable" 
ON credential_revocations FOR SELECT 
TO authenticated, anon 
USING (true);

-- 13. RECRUITER SHORTLISTS POLICIES
CREATE POLICY "Recruiters can manage their own shortlists" 
ON recruiter_shortlists FOR ALL 
USING (recruiter_id = auth.uid());

CREATE POLICY "Recruiters can manage shortlisted candidates" 
ON shortlisted_candidates FOR ALL 
USING (EXISTS (
    SELECT 1 FROM recruiter_shortlists rs WHERE rs.id = shortlisted_candidates.shortlist_id AND rs.recruiter_id = auth.uid()
));


-- ==========================================

-- ==========================================================
-- AI SkillProof Platform — Storage Buckets Configuration (003)
-- ==========================================================

-- Insert storage buckets if not existing
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('project-images', 'project-images', true),
    ('resumes', 'resumes', false),
    ('credential-assets', 'credential-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for project-images
CREATE POLICY "Public can view project images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'project-images');

CREATE POLICY "Authenticated users can upload project images" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'project-images');

CREATE POLICY "Users can delete own project images" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'project-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage Policies for resumes (Private)
CREATE POLICY "Users can upload their own resume" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own resume" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage Policies for credential-assets
CREATE POLICY "Public can view credential assets" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'credential-assets');


-- ==========================================

-- ==========================================================
-- AI SkillProof Platform — Seed Data Migration (004)
-- ==========================================================

-- 1. SEED SKILLS
INSERT INTO skills (name, category, description) VALUES
('React.js', 'frontend', 'Component-based UI library with hooks and state management'),
('Next.js', 'frontend', 'Full-stack React framework with SSR and App Router'),
('TypeScript', 'languages', 'Strongly typed superset of JavaScript'),
('JavaScript (ES6+)', 'languages', 'Modern ECMAScript standards, async/await, closures'),
('Python', 'languages', 'Versatile programming language for web, data, and algorithms'),
('Java', 'languages', 'Object-oriented enterprise programming language'),
('Node.js', 'backend', 'V8 JavaScript runtime for building scalable server-side systems'),
('NestJS', 'backend', 'Progressive Node.js framework with modular architecture'),
('PostgreSQL', 'database', 'Advanced relational database with JSONB and RLS capabilities'),
('MongoDB', 'database', 'NoSQL document database for semi-structured data'),
('Docker', 'devops', 'Containerization platform for reproducible application environments'),
('AWS Cloud', 'cloud', 'Cloud infrastructure covering S3, EC2, Lambda, and RDS'),
('RESTful APIs', 'backend', 'Design principles for clean, idempotent, and secure web APIs'),
('System Design', 'fundamentals', 'Distributed systems design, caching, load balancing, sharding'),
('Data Structures & Algorithms', 'fundamentals', 'Trees, graphs, dynamic programming, complexity analysis'),
('Machine Learning / AI', 'ai', 'Neural networks, LLM integration, prompt engineering')
ON CONFLICT (name) DO NOTHING;

-- 2. SEED CODING PROBLEMS
-- Problem 1: Two Sum
INSERT INTO coding_problems (
    id, title, slug, description, difficulty, category, supported_languages, constraints, starter_code
) VALUES (
    'a1111111-1111-1111-1111-111111111111',
    'Two Sum Problem',
    'two-sum-problem',
    'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice. Format output as `[i, j]` with space after comma or simple JSON array.',
    'easy',
    'algorithms',
    ARRAY['javascript', 'python'],
    '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\nOnly one valid answer exists.',
    '{"javascript": "function solve(input) {\n    const lines = input.trim().split(\"\\n\");\n    const nums = JSON.parse(lines[0]);\n    const target = parseInt(lines[1], 10);\n    \n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const complement = target - nums[i];\n        if (map.has(complement)) {\n            return JSON.stringify([map.get(complement), i]);\n        }\n        map.set(nums[i], i);\n    }\n    return \"[]\";\n}\n\nconst fs = require(\"fs\");\nconst input = fs.readFileSync(0, \"utf-8\");\nconsole.log(solve(input));", "python": "import sys, json\n\ndef solve(input_data):\n    lines = input_data.strip().split(\"\\n\")\n    nums = json.loads(lines[0])\n    target = int(lines[1])\n    \n    seen = {}\n    for i, num in enumerate(nums):\n        comp = target - num\n        if comp in seen:\n            return json.dumps([seen[comp], i])\n        seen[num] = i\n    return \"[]\"\n\nif __name__ == \"__main__\":\n    data = sys.stdin.read()\n    print(solve(data))"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;

-- Test cases for Two Sum
INSERT INTO coding_test_cases (problem_id, input_data, expected_output, is_hidden, weight) VALUES
('a1111111-1111-1111-1111-111111111111', '[2,7,11,15]' || E'\n' || '9', '[0, 1]', false, 1),
('a1111111-1111-1111-1111-111111111111', '[3,2,4]' || E'\n' || '6', '[1, 2]', false, 1),
('a1111111-1111-1111-1111-111111111111', '[3,3]' || E'\n' || '6', '[0, 1]', true, 2),
('a1111111-1111-1111-1111-111111111111', '[1,5,8,12,19]' || E'\n' || '20', '[0, 4]', true, 2);

-- Problem 2: Valid Parentheses
INSERT INTO coding_problems (
    id, title, slug, description, difficulty, category, supported_languages, constraints, starter_code
) VALUES (
    'b2222222-2222-2222-2222-222222222222',
    'Valid Parentheses String',
    'valid-parentheses-string',
    'Given a string `s` containing just the characters ''('', '')'', ''{'', ''}'', ''['' and '']'', determine if the input string is valid. Output `true` or `false`.',
    'easy',
    'data-structures',
    ARRAY['javascript', 'python'],
    '1 <= s.length <= 10^4\ns consists of parentheses only ''()[]{}''.',
    '{"javascript": "function solve(input) {\n    const s = input.trim();\n    const stack = [];\n    const map = { \")\": \"(\", \"}\": \"{\", \"]\": \"[\" };\n    for (const char of s) {\n        if (char === \"(\" || char === \"{\" || char === \"[\") {\n            stack.push(char);\n        } else if (stack.pop() !== map[char]) {\n            return \"false\";\n        }\n    }\n    return stack.length === 0 ? \"true\" : \"false\";\n}\n\nconst fs = require(\"fs\");\nconsole.log(solve(fs.readFileSync(0, \"utf-8\")));", "python": "import sys\n\ndef solve(s):\n    s = s.strip()\n    stack = []\n    mapping = {\")\": \"(\", \"}\": \"{\", \"]\": \"[\"}\n    for char in s:\n        if char in mapping.values():\n            stack.append(char)\n        elif char in mapping:\n            if not stack or stack.pop() != mapping[char]:\n                return \"false\"\n    return \"true\" if not stack else \"false\"\n\nif __name__ == \"__main__\":\n    print(solve(sys.stdin.read()))"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;

-- Test cases for Valid Parentheses
INSERT INTO coding_test_cases (problem_id, input_data, expected_output, is_hidden, weight) VALUES
('b2222222-2222-2222-2222-222222222222', '()[]{}', 'true', false, 1),
('b2222222-2222-2222-2222-222222222222', '(]', 'false', false, 1),
('b2222222-2222-2222-2222-222222222222', '([{}])', 'true', true, 2),
('b2222222-2222-2222-2222-222222222222', '[(])', 'false', true, 2);

-- Problem 3: Palindrome Check
INSERT INTO coding_problems (
    id, title, slug, description, difficulty, category, supported_languages, constraints, starter_code
) VALUES (
    'c3333333-3333-3333-3333-333333333333',
    'Valid Palindrome Phrase',
    'valid-palindrome-phrase',
    'A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers. Return `true` or `false`.',
    'easy',
    'algorithms',
    ARRAY['javascript', 'python'],
    '1 <= s.length <= 2 * 10^5\ns consists only of printable ASCII characters.',
    '{"javascript": "function solve(input) {\n    const clean = input.toLowerCase().replace(/[^a-z0-9]/g, \"\");\n    const rev = clean.split(\"\").reverse().join(\"\");\n    return clean === rev ? \"true\" : \"false\";\n}\n\nconst fs = require(\"fs\");\nconsole.log(solve(fs.readFileSync(0, \"utf-8\")));", "python": "import sys, re\n\ndef solve(s):\n    clean = re.sub(r\"[^a-zA-Z0-9]\", \"\", s).lower()\n    return \"true\" if clean == clean[::-1] else \"false\"\n\nif __name__ == \"__main__\":\n    print(solve(sys.stdin.read()))"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;

-- Test cases for Palindrome
INSERT INTO coding_test_cases (problem_id, input_data, expected_output, is_hidden, weight) VALUES
('c3333333-3333-3333-3333-333333333333', 'A man, a plan, a canal: Panama', 'true', false, 1),
('c3333333-3333-3333-3333-333333333333', 'race a car', 'false', false, 1),
('c3333333-3333-3333-3333-333333333333', '0P', 'false', true, 2),
('c3333333-3333-3333-3333-333333333333', 'Was it a car or a cat I saw?', 'true', true, 2);

-- 3. SEED ASSESSMENTS
INSERT INTO assessments (
    id, title, description, duration_seconds, difficulty, category, status
) VALUES (
    'd4444444-4444-4444-4444-444444444444',
    'Full-Stack Algorithmic Benchmark',
    'Timed technical assessment covering array lookups, stack operations, and string filtering under time constraints.',
    3600,
    'intermediate',
    'Full Stack Engineering',
    'active'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO assessment_problems (assessment_id, problem_id, display_order, points) VALUES
('d4444444-4444-4444-4444-444444444444', 'a1111111-1111-1111-1111-111111111111', 1, 35),
('d4444444-4444-4444-4444-444444444444', 'b2222222-2222-2222-2222-222222222222', 2, 35),
('d4444444-4444-4444-4444-444444444444', 'c3333333-3333-3333-3333-333333333333', 3, 30)
ON CONFLICT (assessment_id, problem_id) DO NOTHING;

-- 4. SEED CREDENTIAL TEMPLATES
INSERT INTO credential_templates (
    id, issuer_id, title, description, criteria, credential_type, status
) VALUES (
    'e5555555-5555-5555-5555-555555555555',
    '00000000-0000-0000-0000-000000000001',
    'Certified Algorithmic Problem Solver',
    'Awarded for passing rigorous automated code execution benchmarks with 90%+ pass rate and optimal time complexity.',
    'Complete the Full-Stack Algorithmic Benchmark assessment with automated test pass rate >= 90%.',
    'assessment_achievement',
    'active'
),
(
    'e6666666-6666-6666-6666-666666666666',
    '00000000-0000-0000-0000-000000000001',
    'Full-Stack Web Development Specialist',
    'Awarded for verified mastery in modern frontend components, backend REST architectures, and database design.',
    'Published at least 2 verified full-stack projects with live demos and repository evidence.',
    'project_completion',
    'active'
) ON CONFLICT (id) DO NOTHING;
