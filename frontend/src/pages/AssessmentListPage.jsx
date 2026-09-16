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
} from 'lucide-react';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

export default function AssessmentListPage() {
  const [assessments, setAssessments] = useState([]);
  const [problems, setProblems] = useState([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [assessData, probData] = await Promise.all([
          api.getAssessments(),
          api.getProblems(),
        ]);
        setAssessments(assessData || []);
        setProblems(probData || []);
      } catch (err) {
        console.error('Error loading assessments:', err);
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

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Automated Coding Benchmarks
          </h1>
          <p className="text-xs text-slate-600">
            Isolated sandbox execution evaluating correctness, time complexity, and memory boundaries.
          </p>
        </div>

        {/* Difficulty Filter */}
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

      {/* Featured Timed Assessments */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-600" /> Full Assessment Suites
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assessments.map((a) => (
            <div
              key={a.id}
              className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-slate-900">{a.title}</h3>
                  <Badge variant="brand" className="text-[10px]">
                    {Math.round(a.duration_seconds / 60)} mins
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{a.description}</p>
                <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                  <span className="capitalize text-indigo-700 font-medium">
                    {a.difficulty}
                  </span>
                  <span>•</span>
                  <span>{a.category}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div className="text-[11px] text-emerald-600 flex items-center gap-1">
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

      {/* Standalone Algorithmic Problems Catalog */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-purple-600" /> Individual Problem Challenges
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
                className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-semibold text-slate-900">{p.title}</span>
                    <Badge variant={diffColors[p.difficulty] || 'default'} className="text-[10px] capitalize">
                      {p.difficulty}
                    </Badge>
                    <span className="text-xs text-slate-500 font-mono">[{p.category}]</span>
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
    </div>
  );
}
