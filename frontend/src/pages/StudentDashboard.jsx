import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Code2,
  Award,
  Compass,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FolderGit2,
  Clock,
  QrCode,
  ExternalLink,
  UploadCloud,
  FileText,
  Check,
  AlertCircle,
  Loader2,
  GraduationCap,
} from 'lucide-react';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import QRModal from '../components/QRModal';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [credentials, setCredentials] = useState([]);
  const [recommendedData, setRecommendedData] = useState({ unlocked: false, assessments: [], problems: [] });
  const [projectsCount, setProjectsCount] = useState(0);
  const [selectedQR, setSelectedQR] = useState(null);
  const [loading, setLoading] = useState(true);

  // Resume Upload & Analysis State
  const [resumeMode, setResumeMode] = useState('upload'); // 'upload' | 'paste'
  const [resumeText, setResumeText] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [analysisError, setAnalysisError] = useState('');
  const [successBanner, setSuccessBanner] = useState('');

  const loadData = async () => {
    try {
      const [profData, credData, projData, recData] = await Promise.all([
        api.getMyProfile().catch(() => null),
        api.getMyCredentials().catch(() => []),
        api.getMyProjects().catch(() => []),
        api.getRecommendedAssessments().catch(() => ({ unlocked: false, assessments: [], problems: [] })),
      ]);
      setProfile(profData);
      setCredentials(credData);
      setRecommendedData(recData || { unlocked: false, assessments: [], problems: [] });
      setProjectsCount(projData?.length || 0);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle File selection and extraction
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setAnalysisError('');

    try {
      // If it's a text-based file or markdown, read directly
      if (file.name.endsWith('.txt') || file.name.endsWith('.md') || file.name.endsWith('.json')) {
        const text = await file.text();
        setResumeText(text);
      } else {
        // For PDF or DOCX files, attempt FileReader text read
        const text = await file.text().catch(() => '');
        if (text && text.length > 50) {
          setResumeText(text);
        } else {
          setResumeText(`Candidate Resume File: ${file.name} (${Math.round(file.size / 1024)} KB)`);
        }
      }
    } catch (err) {
      console.error('Error reading file:', err);
      setAnalysisError('Could not read file contents. You can switch to the "Paste Text" tab.');
    }
  };

  // Call Backend Groq LLM Resume Analyzer
  const handleAnalyzeResume = async () => {
    if (!resumeText.trim()) {
      setAnalysisError('Please select a resume file or paste your resume text first.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError('');
    try {
      const result = await api.analyzeResume(resumeText, uploadedFileName || 'uploaded-resume.txt');
      setParsedData(result);
    } catch (err) {
      setAnalysisError(err.message || 'Failed to analyze resume. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Apply parsed data into Profile, Skills, and Projects in Database
  const handleApplyToProfile = async () => {
    if (!parsedData) return;

    setIsApplying(true);
    setAnalysisError('');
    try {
      await api.applyResumeData(parsedData);
      setSuccessBanner(`Resume parsed successfully! ${parsedData.skills?.length || 0} skills and ${parsedData.projects?.length || 0} projects applied to your profile.`);
      setParsedData(null);
      setResumeText('');
      setUploadedFileName('');
      // Refresh dashboard counters
      await loadData();
      setTimeout(() => setSuccessBanner(''), 8000);
    } catch (err) {
      setAnalysisError(`Failed to save data: ${err.message}`);
    } finally {
      setIsApplying(false);
    }
  };

  const completeness = profile?.completenessScore || 0;
  const verifiedSkillsCount = profile?.skills?.length || 0;
  const activeCredentialsCount = credentials?.length || 0;
  const candidateName = profile?.full_name || user?.fullName || 'Candidate';
  const publicSlug = profile?.slug || profile?.user_id || profile?.id || 'me';

  return (
    <div className="space-y-8 animate-in fade-in pb-12">
      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3 text-xs font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner('')}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Welcome Header */}
      <div className="relative rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 overflow-hidden shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Verified Candidate Hub
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome, {candidateName}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
              {profile?.headline || 'Your account is ready. Upload your resume below to initialize your skills profile and begin verifiable benchmarks.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link to="/assessments">
              <Button variant="primary" size="sm" icon={Code2}>
                Take Assessment
              </Button>
            </Link>
            <Link to="/portfolio-builder">
              <Button variant="secondary" size="sm" icon={Compass}>
                Portfolio Builder
              </Button>
            </Link>
            <Link
              to={`/p/${publicSlug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-medium rounded-xl border border-slate-300 transition-colors"
            >
              <span>Public Link</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
            </Link>
          </div>
        </div>

        {/* Profile Completeness Bar */}
        <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-700 font-medium">Profile Completeness</span>
              <span className="text-indigo-600 font-bold">{completeness}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-500"
                style={{ width: `${completeness}%` }}
              />
            </div>
          </div>
          {completeness < 100 && (
            <Link to="/profile" className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 self-end sm:self-center">
              Complete Profile →
            </Link>
          )}
        </div>
      </div>

      {/* Metric Cards Grid - Real Dynamic Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs text-slate-600 font-medium mb-1">Verified Skills</div>
            <div className="text-2xl font-bold text-slate-900">{verifiedSkillsCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs text-slate-600 font-medium mb-1">Active Credentials</div>
            <div className="text-2xl font-bold text-slate-900">{activeCredentialsCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs text-slate-600 font-medium mb-1">Projects Showcased</div>
            <div className="text-2xl font-bold text-slate-900">{projectsCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700">
            <FolderGit2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs text-slate-600 font-medium mb-1">Benchmark Score</div>
            <div className="text-2xl font-bold text-slate-900">
              {profile?.benchmarkScore ? `${profile.benchmarkScore}%` : 'N/A'}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* CORE FEATURE: AI Resume Upload & Analysis Pipeline */}
      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Powered by Groq AI (Ultra-Fast Inference)
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Step 1: Upload or Paste Your Resume
            </h2>
            <p className="text-xs text-slate-600">
              Our AI automatically extracts your technical skills, constructs your verified profile, and maps your assessment roadmap.
            </p>
          </div>

          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-auto">
            <button
              onClick={() => setResumeMode('upload')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                resumeMode === 'upload'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Upload File
            </button>
            <button
              onClick={() => setResumeMode('paste')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                resumeMode === 'paste'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Paste Text
            </button>
          </div>
        </div>

        {analysisError && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{analysisError}</span>
          </div>
        )}

        {/* Upload Mode */}
        {resumeMode === 'upload' ? (
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 sm:p-8 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
            <input
              type="file"
              id="resume-file-input"
              accept=".pdf,.doc,.docx,.txt,.md"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="resume-file-input"
              className="cursor-pointer flex flex-col items-center justify-center space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-semibold text-slate-800">
                  {uploadedFileName ? (
                    <span className="text-indigo-600 font-bold">{uploadedFileName}</span>
                  ) : (
                    'Click to select your resume (.pdf, .txt, .docx, .md)'
                  )}
                </span>
                <p className="text-[11px] text-slate-500 mt-1">
                  Supported formats: PDF, DOCX, TXT, Markdown (Max 10MB)
                </p>
              </div>
            </label>
          </div>
        ) : (
          /* Paste Mode */
          <div className="space-y-2">
            <textarea
              rows={6}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume content or LinkedIn profile text here (including your skills, projects, and education)..."
              className="w-full bg-slate-50 text-slate-800 text-xs p-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
          </div>
        )}

        {/* Action Button */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Zero dummy data: Your dashboard will strictly reflect your analyzed credentials.
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={handleAnalyzeResume}
            disabled={isAnalyzing || (!resumeText.trim() && !uploadedFileName)}
            icon={isAnalyzing ? Loader2 : Sparkles}
            className={isAnalyzing ? 'animate-pulse' : ''}
          >
            {isAnalyzing ? 'Analyzing with Groq AI...' : 'Analyze Resume with AI'}
          </Button>
        </div>

        {/* Analysis Results Preview Card */}
        {parsedData && (
          <div className="mt-6 pt-6 border-t border-slate-200 space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  AI Resume Analysis Complete
                </h3>
                <p className="text-xs text-slate-600">Review the extracted skills and project highlights before saving.</p>
              </div>
              <Badge variant="success" className="text-xs">
                {parsedData.model || 'Groq AI'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Extracted Profile Details */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  Candidate Information
                </div>
                <div className="text-xs space-y-1">
                  <div className="text-slate-900 font-semibold">{parsedData.fullName || candidateName}</div>
                  <div className="text-indigo-600 font-medium">{parsedData.headline || 'Full-Stack Software Engineer'}</div>
                  <div className="text-slate-600 text-[11px]">{parsedData.education} — {parsedData.institution} ({parsedData.graduationYear})</div>
                </div>
                <div className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed">
                  {parsedData.bio}
                </div>
              </div>

              {/* Extracted Skills */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Extracted Technical Skills ({parsedData.skills?.length || 0})</span>
                  <Badge variant="brand" className="text-[10px]">Ready for verification</Badge>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pt-1">
                  {parsedData.skills?.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs font-semibold shadow-2xs"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {parsedData.projects?.length > 0 && (
                  <div className="pt-2 border-t border-slate-200">
                    <div className="text-[11px] font-bold text-slate-700 mb-1">Identified Projects ({parsedData.projects.length})</div>
                    <div className="text-xs text-slate-600 line-clamp-2">
                      {parsedData.projects.map((p) => p.title).join(', ')}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Confirm & Save to Profile Button */}
            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={handleApplyToProfile}
                disabled={isApplying}
                icon={isApplying ? Loader2 : Check}
              >
                {isApplying ? 'Applying to Profile...' : 'Apply to My Profile & Start Benchmarks'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Grid: Assessments & Credentials */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recommended Coding Challenges */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold mb-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                {recommendedData.unlocked ? 'Tailored to Resume' : 'Resume Required'}
              </div>
              <h2 className="text-base font-bold text-slate-900">Problem-Solving Benchmarks</h2>
              <p className="text-xs text-slate-600">
                {recommendedData.unlocked
                  ? 'Coding benchmarks matched directly to your verified resume skills'
                  : 'Isolated sandbox benchmarks unlocked after resume upload'}
              </p>
            </div>
            {recommendedData.unlocked && (
              <Link to="/assessments" className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold">
                View All ({recommendedData.assessments.length}) →
              </Link>
            )}
          </div>

          {recommendedData.unlocked && recommendedData.assessments.length > 0 ? (
            <div className="space-y-3">
              {recommendedData.assessments.slice(0, 3).map((a) => (
                <div
                  key={a.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-400 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900">{a.title}</span>
                      <Badge variant="brand" className="text-[10px]">{a.category}</Badge>
                      <span className="capitalize text-indigo-700 text-xs font-medium">{a.difficulty}</span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-1">{a.description}</p>
                    {a.matchedSkills && a.matchedSkills.length > 0 && (
                      <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Matched from resume: {a.matchedSkills.join(', ')}
                      </div>
                    )}
                  </div>

                  <Link to={`/assessments/${a.id}`}>
                    <Button variant="primary" size="sm" icon={ArrowRight}>
                      Start Test
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 px-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-800">Problem-Solving Benchmarks Locked</h4>
              <p className="text-[11px] text-slate-600 max-w-sm mx-auto">
                Problem-solving assessments are personalized to your actual technical stack. Upload your resume in your Profile to unlock your tailored benchmarks.
              </p>
              <Link to="/profile">
                <Button variant="primary" size="sm" icon={FileText}>
                  Go to Profile & Upload Resume
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Digital Credentials Wallet Preview */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Verified Credentials</h2>
                <p className="text-xs text-slate-600">Ed25519 digitally signed certificates</p>
              </div>
              <Link to="/wallet" className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold">
                Wallet →
              </Link>
            </div>

            <div className="space-y-3">
              {credentials.length > 0 ? (
                credentials.slice(0, 2).map((c) => (
                  <div
                    key={c.id || c.credential_id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="text-xs font-semibold text-slate-900 line-clamp-1">{c.title}</div>
                      <Badge variant="success" className="text-[10px]">Valid</Badge>
                    </div>
                    <div className="text-[11px] font-mono text-indigo-600 mb-2">{c.credential_id}</div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-xs">
                      <button
                        onClick={() => setSelectedQR(c)}
                        className="text-slate-600 hover:text-slate-900 flex items-center gap-1 text-[11px]"
                      >
                        <QrCode className="w-3.5 h-3.5 text-indigo-600" /> Show QR
                      </button>
                      <Link
                        to={`/verify/${c.credential_id}`}
                        className="text-indigo-600 hover:text-indigo-700 text-[11px] font-semibold"
                      >
                        Verify Signatures
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 space-y-1">
                  <div className="font-semibold text-slate-700">No credentials earned yet</div>
                  <div>Upload your resume or take coding assessments to earn verifiable Ed25519 certificates.</div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 mt-4">
            <Link to="/skill-gap">
              <div className="p-3 rounded-2xl bg-indigo-50/50 border border-indigo-200 flex items-center gap-3 hover:bg-indigo-50 transition-colors">
                <Sparkles className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                <div className="text-left">
                  <div className="text-xs font-semibold text-indigo-900">AI Skill Gap Analysis</div>
                  <div className="text-[10px] text-slate-600">Match skills against target roles</div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* QR Modal when clicked */}
      {selectedQR && (
        <QRModal credential={selectedQR} onClose={() => setSelectedQR(null)} />
      )}
    </div>
  );
}
