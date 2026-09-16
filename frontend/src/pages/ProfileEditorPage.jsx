import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await api.getMyProfile();
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
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    }
    fetchProfile();
  }, []);

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
    </div>
  );
}
