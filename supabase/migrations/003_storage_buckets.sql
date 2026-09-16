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
