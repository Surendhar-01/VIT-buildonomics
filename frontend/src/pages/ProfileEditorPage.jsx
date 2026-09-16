import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  User,
  Sparkles,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  Globe,
  FileText,
  AlertCircle,
  Upload,
  ArrowRight,
  Code2,
  Clock,
  Award,
  Terminal,
  FileUp,
} from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '../components/BrandIcons';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

export default function ProfileEditorPage() {
  const [profile, setProfile] = useState({
    fullName: '',
    headline: '',
    bio: '',
    location: '',
    education: '',
    institution: '',
    graduationYear: 2026,
    experience: '',
    githubUrl: '',
    linkedinUrl: '',
    resumeUrl: '',
    visibility: 'public',
    skills: [],
  });

  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillProficiency, setNewSkillProficiency] = useState('intermediate');
  const [newSkillEvidence, setNewSkillEvidence] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('languages');

  const [saving, setSaving] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // Resume Upload & Tailored Assessment State
  const [resumeText, setResumeText] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [inputMethod, setInputMethod] = useState('file'); // 'file' | 'paste'
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [analysisError, setAnalysisError] = useState('');
  const [tailoredData, setTailoredData] = useState({ unlocked: false, assessments: [], problems: [], candidateSkills: [] });

  const loadData = async () => {
    try {
      const [data, recData] = await Promise.all([
        api.getMyProfile(),
        api.getRecommendedAssessments().catch(() => null),
      ]);

      if (data) {
        setProfile({
          fullName: data.full_name || data.fullName || '',
          headline: data.headline || '',
          bio: data.bio || '',
          location: data.location || '',
          education: data.education || '',
          institution: data.institution || '',
          graduationYear: data.graduation_year || data.graduationYear || 2026,
          experience: data.experience || '',
          githubUrl: data.github_url || data.githubUrl || '',
          linkedinUrl: data.linkedin_url || data.linkedinUrl || '',
          resumeUrl: data.resume_url || data.resumeUrl || '',
          visibility: data.visibility || 'public',
          skills: data.skills || [],
        });
      }

      if (recData) {
        setTailoredData(recData);
      }
    } catch (err) {
      console.error('Error fetching profile or assessments:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setAnalysisError('');
    try {
      if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        const text = await file.text();
        setResumeText(text);
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result;
          if (typeof content === 'string') {
            const printable = content.replace(/[^\x20-\x7E\t\r\n]/g, ' ').replace(/\s+/g, ' ');
            setResumeText(printable.slice(0, 9000));
          }
        };
        reader.readAsText(file);
      }
    } catch (err) {
      console.error('File reading error:', err);
      setAnalysisError('Could not parse file directly. You can switch to "Paste Text" tab.');
    }
  };

  const handleAnalyzeResume = async () => {
    if (!resumeText.trim()) {
      setAnalysisError('Please choose a file or paste your resume text first.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError('');
    try {
      const result = await api.analyzeResume(resumeText, uploadedFileName || 'uploaded-resume.txt');
      setParsedData(result);
    } catch (err) {
      setAnalysisError(err.message || 'AI resume analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyResume = async () => {
    if (!parsedData) return;

    setIsApplying(true);
    setAnalysisError('');
    try {
      await api.applyResumeData({
        ...parsedData,
        resumeFileName: uploadedFileName || 'verified-resume.pdf',
      });
      setStatusMessage(`Resume applied successfully! ${parsedData.skills?.length || 0} verified skills saved and tailored problem-solving assessments unlocked.`);
      setIsError(false);
      setParsedData(null);
      setResumeText('');
      setUploadedFileName('');
      await loadData();
      setTimeout(() => setStatusMessage(''), 5000);
    } catch (err) {
      setIsError(true);
      setAnalysisError(`Failed to save resume data: ${err.message}`);
    } finally {
      setIsApplying(false);
    }
  };

  const handleClearResume = async () => {
    if (!window.confirm('Are you sure you want to clear your uploaded resume? This will re-lock problem-solving assessments until a new resume is uploaded.')) return;
    try {
      await api.clearResume();
      setStatusMessage('Resume cleared. Problem-solving assessments locked.');
      setIsError(false);
      await loadData();
      setTimeout(() => setStatusMessage(''), 4000);
    } catch (err) {
      setStatusMessage(`Failed to clear resume: ${err.message}`);
      setIsError(true);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage('');
    setIsError(false);
    try {
      const updated = await api.updateProfile(profile);
      if (updated) {
        setProfile((prev) => ({
          ...prev,
          fullName: updated.full_name || updated.fullName || prev.fullName,
          headline: updated.headline || prev.headline,
          bio: updated.bio || prev.bio,
          location: updated.location || prev.location,
          education: updated.education || prev.education,
          institution: updated.institution || prev.institution,
          graduationYear: updated.graduation_year || updated.graduationYear || prev.graduationYear,
          experience: updated.experience || prev.experience,
          githubUrl: updated.github_url || updated.githubUrl || prev.githubUrl,
          linkedinUrl: updated.linkedin_url || updated.linkedinUrl || prev.linkedinUrl,
          resumeUrl: updated.resume_url || updated.resumeUrl || prev.resumeUrl,
          visibility: updated.visibility || prev.visibility,
          skills: updated.skills || prev.skills,
        }));
      }
      setStatusMessage('Profile successfully saved and synchronized with Supabase.');
      setTimeout(() => setStatusMessage(''), 4000);
    } catch (err) {
      setIsError(true);
      setStatusMessage(`Error saving to database: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateAiBio = async () => {
    setAiGenerating(true);
    try {
      const skillsList = profile.skills.map((s) => s.skill_name || s.name);
      const res = await api.generateBio({
        fullName: profile.fullName || 'Candidate',
        targetRole: profile.headline || 'Full-Stack Software Engineer',
        skills: skillsList.length > 0 ? skillsList : ['React', 'Node.js', 'PostgreSQL'],
        keyAchievements: profile.experience,
      });

      if (res.bio) {
        setProfile((prev) => ({
          ...prev,
          headline: res.headline || prev.headline,
          bio: res.bio,
        }));
        setStatusMessage('AI Bio generated. Feel free to adjust or approve.');
        setTimeout(() => setStatusMessage(''), 3000);
      }
    } catch (err) {
      setStatusMessage(`AI generator error: ${err.message}`);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;

    try {
      const added = await api.addSkill({
        skillName: newSkillName.trim(),
        proficiencyLevel: newSkillProficiency,
        evidenceDescription: newSkillEvidence.trim(),
        category: newSkillCategory,
      });

      setProfile((prev) => ({
        ...prev,
        skills: [...prev.skills, added],
      }));

      setNewSkillName('');
      setNewSkillEvidence('');
    } catch (err) {
      console.error('Add skill failed:', err);
    }
  };

  const handleRemoveSkill = async (skillId) => {
    try {
      await api.removeSkill(skillId);
      setProfile((prev) => ({
        ...prev,
        skills: prev.skills.filter((s) => s.id !== skillId),
      }));
    } catch (err) {
      console.error('Remove skill failed:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Profile & Verified Skills
          </h1>
          <p className="text-xs text-slate-600">
            Showcase your skills with verified evidence and automated credentials.
          </p>
        </div>

        <Button
          onClick={handleSave}
          variant="primary"
          size="sm"
          loading={saving}
          icon={Save}
        >
          Save Changes
        </Button>
      </div>

      {statusMessage && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2.5 transition-all shadow-xs ${
            isError
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {isError ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span className="font-medium">{statusMessage}</span>
        </div>
      )}

      {/* AI Resume Upload & Assessment Unlocker */}
      <div className="rounded-3xl bg-white border border-indigo-100 p-6 sm:p-8 space-y-6 shadow-sm">
        {profile.resumeUrl && tailoredData.unlocked && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  Resume Verified: <span className="font-mono text-emerald-700">{profile.resumeUrl}</span>
                </div>
                <div className="text-[11px] text-emerald-700">
                  {tailoredData.candidateSkills?.length || profile.skills?.length || 0} skills detected from resume • Tailored problem-solving assessments unlocked below!
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClearResume}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-3 py-1.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 transition-colors self-start sm:self-auto"
            >
              Clear Resume & Re-lock
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              AI Resume Verification & Benchmark Unlocker
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileUp className="w-5 h-5 text-indigo-600" />
              Upload Resume to Unlock Problem-Solving Assessments
            </h2>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              Upload or paste your technical resume. Our AI automatically extracts your verified skills and education, and unlocks tailored problem-solving assessments specifically aligned with your tech stack.
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-center">
            <button
              type="button"
              onClick={() => setInputMethod('file')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                inputMethod === 'file'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Upload File
            </button>
            <button
              type="button"
              onClick={() => setInputMethod('paste')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                inputMethod === 'paste'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Paste Text
            </button>
          </div>
        </div>

        {analysisError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{analysisError}</span>
          </div>
        )}

        {inputMethod === 'file' ? (
          <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-6 text-center transition-colors bg-slate-50/50">
            <input
              type="file"
              id="resume-file-input"
              accept=".pdf,.txt,.docx,.md"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label htmlFor="resume-file-input" className="cursor-pointer flex flex-col items-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-xs font-semibold text-slate-800">
                {uploadedFileName ? (
                  <span className="text-indigo-600 font-bold">{uploadedFileName}</span>
                ) : (
                  <span>Click to select PDF, TXT, DOCX, or MD resume</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">Max size 5MB • Formats: .pdf, .txt, .docx, .md</p>
            </label>
          </div>
        ) : (
          <div className="space-y-2">
            <textarea
              rows={5}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your raw technical resume content or LinkedIn summary here..."
              className="w-full bg-slate-50 text-slate-900 text-xs p-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono leading-relaxed"
            />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Powered by Google Gemini 3.6 Flash
          </div>

          <Button
            type="button"
            variant="primary"
            size="sm"
            loading={isAnalyzing}
            onClick={handleAnalyzeResume}
            icon={Sparkles}
          >
            {isAnalyzing ? 'Analyzing with AI...' : 'Analyze Resume with AI'}
          </Button>
        </div>

        {/* AI Parsed Result Preview */}
        {parsedData && (
          <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900">{parsedData.fullName || 'Candidate'}</h4>
                <p className="text-xs text-indigo-700 font-medium">{parsedData.headline || 'Full-Stack Software Engineer'}</p>
              </div>
              <Badge variant="brand" className="text-[10px]">
                {parsedData.model || 'Gemini 3.6 Flash'}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Extracted Skills ({parsedData.skills?.length || 0}):
              </div>
              <div className="flex flex-wrap gap-1.5">
                {parsedData.skills?.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-indigo-800 font-semibold text-xs shadow-2xs"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {parsedData.bio && (
              <div className="text-xs text-slate-600 leading-relaxed italic border-l-2 border-indigo-400 pl-3">
                "{parsedData.bio.slice(0, 200)}..."
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button
                type="button"
                variant="primary"
                size="sm"
                loading={isApplying}
                onClick={handleApplyResume}
                icon={CheckCircle2}
              >
                {isApplying ? 'Applying to Profile...' : 'Apply to Profile & Unlock Assessments'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Main Profile Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600" /> Personal Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                className="w-full bg-slate-50 text-slate-800 text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={profile.location}
                placeholder="e.g. San Francisco, CA"
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                className="w-full bg-slate-50 text-slate-800 text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-700">
                Professional Headline
              </label>
              <button
                type="button"
                onClick={handleGenerateAiBio}
                disabled={aiGenerating}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {aiGenerating ? 'Synthesizing...' : 'AI Generate Bio & Headline'}
              </button>
            </div>
            <input
              type="text"
              value={profile.headline}
              placeholder="e.g. Full-Stack Engineer | Distributed Systems & Real-Time APIs"
              onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
              className="w-full bg-slate-50 text-slate-800 text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Biography & Summary
            </label>
            <textarea
              rows={4}
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="Describe your technical background, engineering passions, and architecture experience..."
              className="w-full bg-slate-50 text-slate-800 text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed resize-none"
            />
          </div>
        </div>

        {/* Education & Experience */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" /> Education & Background
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Degree / Education
              </label>
              <input
                type="text"
                value={profile.education}
                placeholder="e.g. B.Tech Computer Science"
                onChange={(e) => setProfile({ ...profile, education: e.target.value })}
                className="w-full bg-slate-50 text-slate-800 text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Institution
              </label>
              <input
                type="text"
                value={profile.institution}
                placeholder="e.g. Vellore Institute of Technology"
                onChange={(e) => setProfile({ ...profile, institution: e.target.value })}
                className="w-full bg-slate-50 text-slate-800 text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Graduation Year
              </label>
              <input
                type="number"
                value={profile.graduationYear}
                onChange={(e) => setProfile({ ...profile, graduationYear: parseInt(e.target.value) || 2026 })}
                className="w-full bg-slate-50 text-slate-800 text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Internship / Work Experience
            </label>
            <input
              type="text"
              value={profile.experience}
              placeholder="e.g. Software Engineering Intern @ CloudScale Tech (Summer 2025)"
              onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
              className="w-full bg-slate-50 text-slate-800 text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Social & Visibility Links */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-600" /> Links & Visibility
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                GitHub Profile URL
              </label>
              <div className="relative">
                <GithubIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={profile.githubUrl}
                  placeholder="https://github.com/yourhandle"
                  onChange={(e) => setProfile({ ...profile, githubUrl: e.target.value })}
                  className="w-full bg-slate-50 text-slate-800 text-xs pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                LinkedIn Profile URL
              </label>
              <div className="relative">
                <LinkedinIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={profile.linkedinUrl}
                  placeholder="https://linkedin.com/in/yourhandle"
                  onChange={(e) => setProfile({ ...profile, linkedinUrl: e.target.value })}
                  className="w-full bg-slate-50 text-slate-800 text-xs pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Profile Discoverability
            </label>
            <select
              value={profile.visibility}
              onChange={(e) => setProfile({ ...profile, visibility: e.target.value })}
              className="bg-slate-50 text-slate-800 text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="public">Public (Visible to employers and shareable portfolio)</option>
              <option value="recruiters_only">Recruiters Only</option>
              <option value="private">Private (Only you can view)</option>
            </select>
          </div>
        </div>
      </form>

      {/* Technical Skills & Evidence Section */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Skills with Evidence</h2>
            <p className="text-xs text-slate-600">
              Attach project-based evidence to reinforce each demonstrated skill.
            </p>
          </div>
        </div>

        {/* Existing skills list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {profile.skills.map((s) => (
            <div
              key={s.id}
              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">{s.skill_name || s.name}</span>
                  <Badge variant="cyan" className="text-[10px] capitalize">
                    {s.proficiency_level}
                  </Badge>
                  {s.verified && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" title="Verified Evidence" />
                  )}
                </div>
                {s.evidence_description && (
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {s.evidence_description}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleRemoveSkill(s.id)}
                className="text-slate-500 hover:text-rose-600 p-1 transition-colors"
                title="Remove skill"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Add Skill Form */}
        <form onSubmit={handleAddSkill} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="text-xs font-semibold text-slate-700">Add Technical Skill</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              placeholder="Skill Name (e.g. React.js)"
              className="bg-white text-slate-800 text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <select
              value={newSkillProficiency}
              onChange={(e) => setNewSkillProficiency(e.target.value)}
              className="bg-white text-slate-800 text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
            <select
              value={newSkillCategory}
              onChange={(e) => setNewSkillCategory(e.target.value)}
              className="bg-white text-slate-800 text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="frontend">Frontend</option>
              <option value="backend">Backend</option>
              <option value="database">Database</option>
              <option value="ai">AI / Machine Learning</option>
              <option value="languages">Languages</option>
              <option value="devops">Cloud & DevOps</option>
            </select>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newSkillEvidence}
              onChange={(e) => setNewSkillEvidence(e.target.value)}
              placeholder="Evidence description (e.g. Built a real-time analytics engine handling 10k events)"
              className="flex-1 bg-white text-slate-800 text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <Button type="submit" variant="secondary" size="sm" icon={Plus}>
              Add
            </Button>
          </div>
        </form>
      </div>

      {/* Problem Solving Assessments Tailored to Your Resume */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              Tailored Skill Benchmarks
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Code2 className="w-5 h-5 text-indigo-600" />
              Problem-Solving Assessments Tailored to Your Resume
            </h2>
            <p className="text-xs text-slate-600">
              Personalized coding benchmarks unlocked based on your verified resume skills.
            </p>
          </div>

          <Link to="/assessments">
            <Button variant="secondary" size="sm" icon={ArrowRight}>
              Open Assessments Portal
            </Button>
          </Link>
        </div>

        {tailoredData.unlocked && tailoredData.assessments?.length > 0 ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tailoredData.assessments.map((a) => (
                <div
                  key={a.id}
                  className="p-5 rounded-2xl bg-slate-50/60 border border-slate-200 hover:border-indigo-400 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{a.title}</h3>
                      <Badge variant="brand" className="text-[10px]">
                        {Math.round((a.duration_seconds || 3600) / 60)} mins
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{a.description}</p>
                    {a.matchedSkills && a.matchedSkills.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 pt-1">
                        <span className="text-[11px] font-semibold text-emerald-700">Matched from Resume:</span>
                        {a.matchedSkills.map((s, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-600 capitalize">{a.difficulty} • {a.category}</span>
                    <Link to={`/assessments/${a.id}`}>
                      <Button variant="primary" size="sm" icon={ArrowRight}>
                        Start Benchmark
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {tailoredData.problems && tailoredData.problems.length > 0 && (
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-purple-600" />
                  Matched Coding Problem Challenges ({tailoredData.problems.length})
                </h3>
                <div className="space-y-2.5">
                  {tailoredData.problems.slice(0, 4).map((p) => (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{p.title}</span>
                          <Badge
                            variant={p.difficulty === 'easy' ? 'success' : p.difficulty === 'medium' ? 'warning' : 'danger'}
                            className="text-[10px] capitalize"
                          >
                            {p.difficulty}
                          </Badge>
                          <span className="text-[10px] text-slate-500 font-mono">[{p.category}]</span>
                          {p.matchedSkills && p.matchedSkills.length > 0 && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                              Resume Matched: {p.matchedSkills.join(', ')}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-1">{p.description}</p>
                      </div>

                      <Link to={`/problems/${p.id}`}>
                        <Button variant="secondary" size="sm" icon={Code2}>
                          Solve Problem
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 px-4 rounded-2xl bg-slate-50 border border-dashed border-slate-300 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Assessments Unlocked Yet</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Upload your technical resume above. Once uploaded, our AI matches your skills with relevant problem-solving assessments (e.g. SQL, Frontend, Backend, or Algorithms).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
