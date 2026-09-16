import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  Clock,
  Play,
  Send,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Code2,
  Terminal,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import CodeEditor from '../components/CodeEditor';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

export default function AssessmentTakePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [problem, setProblem] = useState(null);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(3600); // 60 mins
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProblem() {
      try {
        // If 'id' is an assessment id or problem id, load it
        let probData = null;
        if (id.startsWith('assess-')) {
          const assess = await api.getAssessment(id);
          if (assess.problems && assess.problems.length > 0) {
            probData = await api.getProblem(assess.problems[0].id || 'two-sum-problem');
          }
        } else {
          probData = await api.getProblem(id);
        }

        if (probData) {
          setProblem(probData);
          const defaultLang = 'javascript';
          setLanguage(defaultLang);
          setCode(probData.starter_code?.[defaultLang] || '// Write your solution here\n');
        }
      } catch (err) {
        console.error('Error loading problem:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProblem();
  }, [id]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    if (problem?.starter_code?.[newLang]) {
      setCode(problem.starter_code[newLang]);
    }
  };

  const handleRunSampleTests = async () => {
    setRunning(true);
    setExecutionResult(null);
    try {
      const res = await api.runSampleTests(problem.id, language, code);
      setExecutionResult(res);
    } catch (err) {
      setExecutionResult({
        overallStatus: 'runtime_error',
        results: [{ actualOutput: err.message, status: 'runtime_error', passed: false }],
      });
    } finally {
      setRunning(false);
    }
  };

  const handleSubmitSolution = async () => {
    setSubmitting(true);
    try {
      const res = await api.submitSolution(problem.id, language, code);
      // Navigate to results page with state
      navigate(`/assessments/result/${res.submissionId || 'sub-1'}`, {
        state: { result: res },
      });
    } catch (err) {
      alert(`Submission error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-slate-600 text-xs">
        Loading isolated assessment environment...
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white border border-slate-200 rounded-2xl">
        <div className="flex items-center gap-3">
          <Link
            to="/assessments"
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-slate-900">
                {problem?.title || 'Algorithmic Assessment'}
              </h1>
              <Badge variant="cyan" className="text-[10px] capitalize">
                {problem?.difficulty || 'easy'}
              </Badge>
            </div>
            <span className="text-[11px] text-slate-600">
              Evaluation: Automated Standard I/O Test Runner
            </span>
          </div>
        </div>

        {/* Timer & Submit controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono">
            <Clock className={`w-3.5 h-3.5 ${timeLeft < 300 ? 'text-rose-600 animate-pulse' : 'text-amber-800'}`} />
            <span className={timeLeft < 300 ? 'text-rose-600 font-bold' : 'text-slate-800'}>
              {formatTime(timeLeft)}
            </span>
          </div>

          <Button
            onClick={handleRunSampleTests}
            variant="secondary"
            size="sm"
            loading={running}
            icon={Play}
          >
            Run Sample Tests
          </Button>

          <Button
            onClick={handleSubmitSolution}
            variant="primary"
            size="sm"
            loading={submitting}
            icon={Send}
          >
            Submit Assessment
          </Button>
        </div>
      </div>

      {/* Main Split-Pane Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Pane: Problem Details & Constraints (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 space-y-6 overflow-y-auto max-h-[750px]">
          <div>
            <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Problem Description
            </h2>
            <div className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">
              {problem?.description}
            </div>
          </div>

          {problem?.constraints && (
            <div>
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Constraints
              </h3>
              <pre className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 font-mono leading-relaxed">
                {problem.constraints}
              </pre>
            </div>
          )}

          {/* Sample Test Cases */}
          {problem?.sampleTestCases && (
            <div>
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Public Sample Test Cases
              </h3>
              <div className="space-y-3">
                {problem.sampleTestCases.map((tc, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                    <div className="text-slate-600 font-semibold">Test Case #{idx + 1}</div>
                    <div className="font-mono text-slate-700">Input: <span className="text-indigo-700">{tc.input_data}</span></div>
                    <div className="font-mono text-slate-700">Expected: <span className="text-emerald-600">{tc.expected_output}</span></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Pane: Code Editor and Terminal (7 Cols) */}
        <div className="lg:col-span-7 space-y-4 flex flex-col">
          <CodeEditor
            value={code}
            onChange={setCode}
            language={language}
            onLanguageChange={handleLanguageChange}
            onReset={() => setCode(problem?.starter_code?.[language] || '')}
            height="440px"
          />

          {/* Execution Output Console */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs space-y-3 min-h-[160px]">
            <div className="flex items-center justify-between text-slate-600 border-b border-slate-900 pb-2">
              <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                <Terminal className="w-3.5 h-3.5 text-indigo-600" />
                Execution Console & Test Output
              </span>
              {executionResult && (
                <span className="text-[11px] text-slate-500">
                  Total Time: {executionResult.totalTimeMs || 0}ms
                </span>
              )}
            </div>

            {executionResult ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs">Overall:</span>
                  {executionResult.overallStatus === 'passed' ? (
                    <Badge variant="success">All Sample Tests Passed (100%)</Badge>
                  ) : (
                    <Badge variant="danger">Tests Failed or Runtime Error</Badge>
                  )}
                </div>

                {/* Individual test case results */}
                <div className="space-y-1.5 pt-2">
                  {executionResult.results?.map((res, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded-lg text-[11px] flex items-center justify-between border ${
                        res.passed
                          ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-700'
                          : 'bg-rose-950/20 border-rose-900/40 text-rose-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {res.passed ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        )}
                        <span>Test Case {res.testCaseIndex}: {res.status}</span>
                      </div>
                      <span className="font-mono text-slate-600">{res.executionTimeMs}ms</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-slate-600 text-[11px] py-4">
                Click "Run Sample Tests" to execute your solution in the sandbox runner.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
