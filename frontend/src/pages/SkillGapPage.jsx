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
  Layers,
  Server,
  Palette,
  Cloud,
  ShieldCheck,
  Database,
  Smartphone,
  Boxes,
  Activity,
  Check,
} from 'lucide-react';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

const CAREER_GOALS = [
  {
    id: 'full-stack',
    name: 'Full Stack Engineer',
    category: 'Full Stack Web',
    icon: Layers,
    desc: 'End-to-end web apps, REST APIs & scalable architecture',
  },
  {
    id: 'backend',
    name: 'Backend Systems Architect',
    category: 'Distributed Systems',
    icon: Server,
    desc: 'Microservices, message queues, databases & caching',
  },
  {
    id: 'frontend',
    name: 'Frontend UI/UX Specialist',
    category: 'Client & Experience',
    icon: Palette,
    desc: 'Modern web frameworks, design systems & performance',
  },
  {
    id: 'ai-ml',
    name: 'AI & Machine Learning Engineer',
    category: 'Artificial Intelligence',
    icon: Sparkles,
    desc: 'LLMs, PyTorch, vector search & intelligent agents',
  },
  {
    id: 'devops',
    name: 'DevOps & Cloud Platform Engineer',
    category: 'Cloud Infrastructure',
    icon: Cloud,
    desc: 'Kubernetes, Docker, CI/CD pipelines & Terraform',
  },
  {
    id: 'cybersecurity',
    name: 'Cybersecurity & Ethical Hacker',
    category: 'Information Security',
    icon: ShieldCheck,
    desc: 'OWASP defense, pen testing & cryptographic protocols',
  },
  {
    id: 'data',
    name: 'Data Engineer & Analytics Architect',
    category: 'Big Data & Pipelines',
    icon: Database,
    desc: 'Apache Spark, streaming pipelines, SQL & data warehouses',
  },
  {
    id: 'mobile',
    name: 'Mobile App Developer',
    category: 'iOS & Android',
    icon: Smartphone,
    desc: 'React Native, Flutter, native APIs & offline state',
  },
  {
    id: 'blockchain',
    name: 'Blockchain & Web3 Engineer',
    category: 'Decentralized Tech',
    icon: Boxes,
    desc: 'Solidity, EVM smart contracts & cryptographic verification',
  },
  {
    id: 'sre',
    name: 'Site Reliability Engineer (SRE)',
    category: 'Resilience & Scale',
    icon: Activity,
    desc: 'Distributed tracing, high concurrency in Go & zero downtime',
  },
];

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
    <div className="w-full space-y-8 animate-in fade-in pb-12">
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
      <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-600" />
            Select Your Target Career Goal ({CAREER_GOALS.length} Industry Tracks)
          </h2>
          <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
            Selected: {targetRole}
          </span>
        </div>

        {/* 10 Career Goals Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {CAREER_GOALS.map((goal) => {
            const Icon = goal.icon;
            const isSelected = targetRole === goal.name;
            return (
              <button
                key={goal.id}
                type="button"
                onClick={() => {
                  setTargetRole(goal.name);
                  if (analysis) setAnalysis(null);
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer group ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20 ring-2 ring-indigo-500/40'
                    : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-white border border-slate-200 text-indigo-600 group-hover:border-indigo-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-white text-indigo-600 flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  <div>
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider mb-1 ${
                        isSelected
                          ? 'bg-indigo-700/60 text-indigo-100 border border-indigo-400/30'
                          : 'bg-slate-200/80 text-slate-600'
                      }`}
                    >
                      {goal.category}
                    </span>
                    <h3
                      className={`text-xs font-bold leading-tight ${
                        isSelected ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {goal.name}
                    </h3>
                  </div>
                </div>

                <p
                  className={`text-[10px] leading-snug mt-2 line-clamp-2 ${
                    isSelected ? 'text-indigo-100' : 'text-slate-500'
                  }`}
                >
                  {goal.desc}
                </p>
              </button>
            );
          })}
        </div>

        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-600">
            Analyzing with your verified skills:{' '}
            <strong className="text-slate-800 font-semibold">
              {currentSkills.slice(0, 5).join(', ') || 'JavaScript, TypeScript, Python, React'}
            </strong>
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
