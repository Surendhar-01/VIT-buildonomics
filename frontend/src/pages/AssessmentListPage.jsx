import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  Code2,
  Clock,
  Award,
  ArrowRight,
  Filter,
  CheckCircle2,
  Terminal,
  Lock,
  Sparkles,
  FileUp,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

export default function AssessmentListPage() {
  const [assessments, setAssessments] = useState([]);
  const [problems, setProblems] = useState([]);
  const [candidateSkills, setCandidateSkills] = useState([]);
  const [unlocked, setUnlocked] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const recData = await api.getRecommendedAssessments();
        if (recData && recData.unlocked) {
          setAssessments(recData.assessments || []);
          setProblems(recData.problems || []);
          setCandidateSkills(recData.candidateSkills || []);
          setUnlocked(true);
        } else {
          setUnlocked(false);
          setAssessments([]);
          setProblems([]);
        }
      } catch (err) {
        console.error('Error loading assessments:', err);
        setUnlocked(false);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredProblems = problems.filter((p) => {
    if (selectedDifficulty === 'all') return true;
    return p.difficulty === selectedDifficulty;
  });

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-20 text-center space-y-4">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500">Checking your resume-verified skills & tailored benchmarks...</p>
      </div>
    );
  }

  // If user has NOT uploaded or applied a resume yet:
  if (!unlocked) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 space-y-8 animate-in fade-in">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
            <Lock className="w-8 h-8" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Resume Analysis Required
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Problem-Solving Assessments Locked
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            SkillProof AI tailors coding benchmarks to your actual verified technical background. To unlock problem-solving assessments matching your specific tech stack, please upload your resume first.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6 text-center">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center text-xs font-bold">
                1
              </div>
              <h4 className="text-xs font-bold text-slate-900">Upload Resume</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Upload your PDF or text resume in your profile.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center text-xs font-bold">
                2
              </div>
              <h4 className="text-xs font-bold text-slate-900">AI Stack Extraction</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Gemini 3.6 Flash identifies your skills and experience.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center text-xs font-bold">
                3
              </div>
              <h4 className="text-xs font-bold text-slate-900">Assessments Unlocked</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Benchmarks (SQL, Frontend, Backend) appear automatically.
              </p>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/profile">
              <Button variant="primary" size="md" icon={FileUp}>
                Go to Profile & Upload Resume
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="secondary" size="md" icon={ArrowRight}>
                Open Student Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If user HAS uploaded a resume:
  return (
    <div className="w-full space-y-8 animate-in fade-in pb-12">
      {/* Resume Tailoring Header & Detected Skills */}
      <div className="rounded-3xl bg-white border border-indigo-100 p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Tailored to Your Verified Resume
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Problem-Solving Assessments Tailored to Your Stack
            </h1>
            <p className="text-xs text-slate-600">
              Only showing assessments and coding challenges matched to your verified skills.
            </p>
          </div>

          <Link to="/profile">
            <Button variant="secondary" size="sm" icon={FileUp}>
              Update Resume
            </Button>
          </Link>
        </div>

        {candidateSkills.length > 0 && (
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Skills Detected from Your Resume:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {candidateSkills.map((s, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-semibold"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filter and Assessment Suites */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" /> Tailored Assessment Suites ({assessments.length})
          </h2>

          <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200">
            {['all', 'easy', 'medium', 'hard'].map((diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                  selectedDifficulty === diff
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assessments.map((a) => (
            <div
              key={a.id}
              className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-indigo-400 transition-all flex flex-col justify-between space-y-4 shadow-xs"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-slate-900">{a.title}</h3>
                  <Badge variant="brand" className="text-[10px]">
                    {Math.round((a.duration_seconds || 3600) / 60)} mins
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{a.description}</p>
                
                {a.matchedSkills && a.matchedSkills.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 pt-1">
                    <span className="text-[11px] font-semibold text-emerald-700">Matched from Resume:</span>
                    {a.matchedSkills.map((s, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                  <span className="capitalize text-indigo-700 font-medium">{a.difficulty}</span>
                  <span>•</span>
                  <span>{a.category}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
                  <Award className="w-3.5 h-3.5" /> Credential Eligible
                </div>
                <Link to={`/assessments/${a.id}`}>
                  <Button variant="primary" size="sm" icon={ArrowRight}>
                    Start Benchmark
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Matched Individual Problems */}
      {filteredProblems.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-purple-600" /> Matched Problem Challenges ({filteredProblems.length})
          </h2>

          <div className="space-y-3">
            {filteredProblems.map((p) => {
              const diffColors = {
                easy: 'success',
                medium: 'warning',
                hard: 'danger',
              };

              return (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-sm font-semibold text-slate-900">{p.title}</span>
                      <Badge variant={diffColors[p.difficulty] || 'default'} className="text-[10px] capitalize">
                        {p.difficulty}
                      </Badge>
                      <span className="text-xs text-slate-500 font-mono">[{p.category}]</span>
                      {p.matchedSkills && p.matchedSkills.length > 0 && (
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                          Resume Matched: {p.matchedSkills.join(', ')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-1">{p.description}</p>
                  </div>

                  <Link to={`/problems/${p.id}`}>
                    <Button variant="secondary" size="sm" icon={Code2}>
                      Solve in Editor
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
