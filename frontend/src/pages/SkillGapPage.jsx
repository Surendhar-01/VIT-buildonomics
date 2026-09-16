import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  Sparkles,
  Target,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  BookOpen,
  Zap,
} from 'lucide-react';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

export default function SkillGapPage() {
  const [targetRole, setTargetRole] = useState('Full Stack Engineer');
  const [currentSkills, setCurrentSkills] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadSkills() {
      try {
        const prof = await api.getMyProfile();
        if (prof?.skills) {
          setCurrentSkills(prof.skills.map((s) => s.skill_name || s.name));
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadSkills();
  }, []);

  const handleAnalyze = async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const res = await api.analyzeSkillGap({
        targetRole,
        currentSkills: currentSkills.length > 0 ? currentSkills : ['React.js', 'Node.js'],
      });
      setAnalysis(res);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Sparkles className="w-7 h-7 text-indigo-600" />
          AI Skill Gap Analysis & Roadmap
        </h1>
        <p className="text-xs text-slate-600">
          Compare your verified skills against target industry roles and generate a tailored engineering roadmap.
        </p>
      </div>

      {/* Role Selection Box */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-xl">
        <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
          Select Your Target Career Goal
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            'Full Stack Engineer',
            'Backend Systems Architect',
            'Frontend UI/UX Specialist',
            'AI & Machine Learning Engineer',
          ].map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setTargetRole(role)}
              className={`p-3.5 rounded-2xl border text-xs font-semibold text-left transition-all ${
                targetRole === role
                  ? 'bg-indigo-600/20 border-indigo-500 text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {role}
            </button>
          ))}
        </div>

        <div className="pt-2 flex items-center justify-between">
          <div className="text-xs text-slate-600">
            Analyzing with your verified skills:{' '}
            <strong className="text-slate-800">{currentSkills.slice(0, 4).join(', ') || 'React, TypeScript'}</strong>
          </div>
          <Button onClick={handleAnalyze} variant="primary" size="sm" loading={loading} icon={Zap}>
            Analyze Gap
          </Button>
        </div>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6 animate-in fade-in">
          {/* Match Meter */}
          <div className="p-6 rounded-3xl bg-white border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-md border border-slate-200">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">
                Target Role Match: {analysis.targetRole}
              </h3>
              <p className="text-xs text-slate-600">
                Calculated by evaluating your current evidence-backed profile competencies.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-3xl font-extrabold text-indigo-600">
                  {analysis.matchPercentage}%
                </div>
                <span className="text-[11px] text-emerald-600 font-medium">Competency Index</span>
              </div>
            </div>
          </div>

          {/* Missing Skills Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-3xl bg-white border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Verified Skills Present
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {analysis.verifiedSkillsPresent?.map((s, i) => (
                  <Badge key={i} variant="success" className="text-xs">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> Recommended Growth Areas
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {analysis.missingCriticalSkills?.map((s, i) => (
                  <Badge key={i} variant="warning" className="text-xs">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Step-by-Step Learning Roadmap */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-700" /> Tailored Learning Roadmap
            </h3>

            <div className="space-y-3">
              {analysis.recommendedRoadmap?.map((step) => (
                <div
                  key={step.step}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    {step.step}
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-900">{step.skill}</div>
                    <p className="text-xs text-slate-600">{step.action}</p>
                    <span className="text-[10px] text-slate-500 block pt-0.5">
                      Estimated investment: ~{step.estimatedHours} hours
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <Link to="/assessments">
                <Button variant="primary" size="sm" icon={ArrowRight}>
                  Explore Recommended Assessments
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
