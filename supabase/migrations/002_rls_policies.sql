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
