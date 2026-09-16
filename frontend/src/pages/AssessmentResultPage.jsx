import React, { useEffect } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Award,
  Sparkles,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Code2,
  BookOpen,
} from 'lucide-react';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

export default function AssessmentResultPage() {
  const { id } = useParams();
  const location = useLocation();
  const resultData = location.state?.result;

  useEffect(() => {
    // Confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
  }, []);

  const execution = resultData?.execution || {
    passedCount: 4,
    totalCount: 4,
    percentage: 100,
    totalTimeMs: 140,
    overallStatus: 'passed',
  };

  const aiFeedback = resultData?.aiFeedback || {
    codeQualityScore: 95,
    complexityAnalysis: {
      timeComplexity: 'O(N)',
      spaceComplexity: 'O(N)',
      explanation: 'Optimal linear lookup using hash map auxiliary storage.',
    },
    strengths: [
      'Clean syntax adhering to modern JavaScript standards.',
      'Optimal single-pass lookup avoiding O(N²) nested iteration.',
    ],
    improvementRecommendations: [
      'Include boundary assertions for empty array input streams.',
      'Explicitly declare return type signatures for higher maintainability.',
    ],
    suggestedPracticeTopics: [
      'Two-pointer array partitioning',
      'Sliding window algorithms',
    ],
  };

  const isPassed = execution.passedCount === execution.totalCount;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in pb-12">
      {/* Result Hero Card */}
      <div className="text-center p-8 rounded-3xl bg-white border border-slate-200 shadow-md border border-slate-200 relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          Assessment Completed Successfully!
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
          Your solution was verified across all public and hidden test cases in the sandbox runner.
        </p>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 max-w-md mx-auto mt-6 pt-6 border-t border-slate-200">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-xs text-slate-500 mb-1">Pass Rate</div>
            <div className="text-xl font-extrabold text-emerald-600">{execution.percentage}%</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-xs text-slate-500 mb-1">Test Cases</div>
            <div className="text-xl font-extrabold text-slate-900">
              {execution.passedCount}/{execution.totalCount}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-xs text-slate-500 mb-1">Exec Duration</div>
            <div className="text-xl font-extrabold text-cyan-700">{execution.totalTimeMs}ms</div>
          </div>
        </div>

        {/* Claim Credential CTA */}
        {isPassed && (
          <div className="mt-8">
            <Link to="/wallet">
              <Button variant="primary" size="md" icon={Award}>
                View Issued Credential in Wallet
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* AI Code Review & Feedback */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-indigo-200 space-y-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">AI Solution Review & Feedback</h2>
          </div>
          <Badge variant="brand" className="text-xs">
            Quality Score: {aiFeedback.codeQualityScore}/100
          </Badge>
        </div>

        {/* Complexity Analysis */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="text-xs font-semibold text-slate-700 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-800" /> Algorithmic Complexity Analysis
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-indigo-700">
            <span>Time Complexity: <strong>{aiFeedback.complexityAnalysis?.timeComplexity}</strong></span>
            <span>Space Complexity: <strong>{aiFeedback.complexityAnalysis?.spaceComplexity}</strong></span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed pt-1">
            {aiFeedback.complexityAnalysis?.explanation}
          </p>
        </div>

        {/* Strengths */}
        {aiFeedback.strengths && (
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Demonstrated Strengths
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-700">
              {aiFeedback.strengths.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {aiFeedback.improvementRecommendations && (
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Engineering Recommendations
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-600">
              {aiFeedback.improvementRecommendations.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0 mt-1.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Next Topics */}
        {aiFeedback.suggestedPracticeTopics && (
          <div className="pt-4 border-t border-slate-200">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-cyan-700" /> Recommended Next Practice Topics
            </h3>
            <div className="flex flex-wrap gap-2">
              {aiFeedback.suggestedPracticeTopics.map((topic, i) => (
                <Badge key={i} variant="default" className="text-xs">
                  {topic}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center gap-3">
        <Link to="/assessments">
          <Button variant="secondary" size="sm">
            ← Explore More Challenges
          </Button>
        </Link>
        <Link to="/dashboard">
          <Button variant="ghost" size="sm">
            Go to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
