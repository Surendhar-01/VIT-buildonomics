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
  Layers,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import CodeEditor from '../components/CodeEditor';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

export default function AssessmentTakePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState(null);
  const [problemsList, setProblemsList] = useState([]);
  const [activeProblemIndex, setActiveProblemIndex] = useState(0);
  const [problem, setProblem] = useState(null);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [codeMap, setCodeMap] = useState({}); // { [problemId]: code }
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(3600); // default 60 mins
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Initial load
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setLoadError('');
      try {
        let loadedAssess = null;
        let loadedProblems = [];
        let initialProblem = null;

        // 1. Try loading as an Assessment suite first
        try {
          const assessData = await api.getAssessment(id);
          if (assessData && (assessData.id || assessData.title)) {
            loadedAssess = assessData;
            loadedProblems = assessData.problems || [];
            if (assessData.duration_seconds) {
              setTimeLeft(assessData.duration_seconds);
            }
          }
        } catch {
          // Not an assessment suite, will try as a problem
        }

        // 2. If it is an assessment with problems
        if (loadedAssess && loadedProblems.length > 0) {
          setAssessment(loadedAssess);
          setProblemsList(loadedProblems);

          const firstProb = loadedProblems[0];
          // Try fetching full details (with sampleTestCases) for first problem
          try {
            const detailed = await api.getProblem(firstProb.id || firstProb.slug);
            initialProblem = detailed || firstProb;
          } catch {
            initialProblem = firstProb;
          }
        } else if (!loadedAssess) {
          // 3. Fallback: load as a standalone Problem
          const probData = await api.getProblem(id);
          if (probData) {
            initialProblem = probData;
            setProblemsList([probData]);
          }
        }

        if (initialProblem) {
          setProblem(initialProblem);
          const defaultLang = 'javascript';
          setLanguage(defaultLang);
          const starter = initialProblem.starter_code?.[defaultLang] || '// Write your solution here\n';
          setCode(starter);
          setCodeMap({ [initialProblem.id]: starter });
        } else {
          setLoadError('No problem data found for this assessment benchmark.');
        }
      } catch (err) {
        console.error('Error loading assessment environment:', err);
        setLoadError(err.message || 'Failed to load assessment environment.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  // Switch between problems in the assessment suite
  const handleSelectProblem = async (index) => {
    if (index === activeProblemIndex || !problemsList[index]) return;

    // Save current code
    if (problem) {
      setCodeMap((prev) => ({ ...prev, [problem.id]: code }));
    }

    const targetProbSummary = problemsList[index];
    setActiveProblemIndex(index);
    setExecutionResult(null);

    // Fetch full problem details with test cases
    try {
      let fullProb = targetProbSummary;
      try {
        const detailed = await api.getProblem(targetProbSummary.id || targetProbSummary.slug);
        if (detailed) fullProb = detailed;
      } catch (e) {
        console.warn('Using summary problem data:', e);
      }

      setProblem(fullProb);
      // Retrieve saved code or starter code
      const savedCode = codeMap[fullProb.id];
      if (savedCode) {
        setCode(savedCode);
      } else {
        const newCode = fullProb.starter_code?.[language] || '// Write your solution here\n';
        setCode(newCode);
        setCodeMap((prev) => ({ ...prev, [fullProb.id]: newCode }));
      }
    } catch (err) {
      console.error('Error switching problem:', err);
    }
  };

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
      const langStarter = problem.starter_code[newLang];
      setCode(langStarter);
      setCodeMap((prev) => ({ ...prev, [problem.id]: langStarter }));
    }
  };

  const handleRunSampleTests = async () => {
    if (!problem?.id) return;
    setRunning(true);
    setExecutionResult(null);
    try {
      const res = await api.runSampleTests(problem.id, language, code);
      setExecutionResult(res);
    } catch (err) {
      setExecutionResult({
        overallStatus: 'runtime_error',
        results: [
          {
            testCaseIndex: 1,
            actualOutput: err.message || 'Execution failed',
            status: 'runtime_error',
            passed: false,
          },
        ],
      });
    } finally {
      setRunning(false);
    }
  };

  const handleSubmitSolution = async () => {
    if (!problem?.id) return;
    setSubmitting(true);
    try {
      const res = await api.submitSolution(problem.id, language, code);
      navigate(`/assessments/result/${res.submissionId || 'sub-1'}`, {
        state: { result: res, assessmentTitle: assessment?.title || problem?.title },
      });
    } catch (err) {
      alert(`Submission error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium">
          Loading isolated assessment environment & verified test suites...
        </p>
      </div>
    );
  }

  if (loadError || !problem) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Unable to Load Assessment</h2>
        <p className="text-xs text-slate-600">{loadError || 'Problem details could not be retrieved.'}</p>
        <Link to="/assessments">
          <Button variant="secondary" size="sm" icon={ArrowLeft}>
            Back to Assessments
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            to="/assessments"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200"
            title="Back to assessments"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-slate-900">
                {assessment?.title || problem?.title || 'Algorithmic Assessment'}
              </h1>
              <Badge variant="cyan" className="text-[10px] capitalize">
                {assessment?.difficulty || problem?.difficulty || 'intermediate'}
              </Badge>
              <Badge variant="brand" className="text-[10px]">
                {assessment?.category || problem?.category || 'Algorithms'}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
              <span>Automated Standard I/O Test Runner</span>
              <span>•</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Matched to Your Resume Stack
              </span>
            </div>
          </div>
        </div>

        {/* Timer & Submit controls */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono">
            <Clock className={`w-3.5 h-3.5 ${timeLeft < 300 ? 'text-rose-600 animate-pulse' : 'text-indigo-600'}`} />
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
            Run Tests
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

      {/* Multi-Problem Switcher Bar (when assessment contains multiple challenges) */}
      {problemsList.length > 1 && (
        <div className="p-2.5 bg-white border border-slate-200 rounded-2xl flex flex-wrap items-center gap-2 shadow-xs">
          <div className="flex items-center gap-1.5 px-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Benchmark Problems ({problemsList.length}):</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {problemsList.map((p, idx) => {
              const isActive = idx === activeProblemIndex;
              return (
                <button
                  key={p.id || idx}
                  onClick={() => handleSelectProblem(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer border ${
                    isActive
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isActive ? 'bg-white text-indigo-600' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {idx + 1}
                  </span>
                  <span>{p.title}</span>
                  {p.points && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      isActive ? 'bg-indigo-700/50 text-indigo-100' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {p.points} pts
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Split-Pane Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Pane: Problem Details & Constraints (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 space-y-6 overflow-y-auto max-h-[750px] shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Problem Description
              </span>
              <Badge variant="cyan" className="text-[10px] capitalize">
                {problem?.difficulty || 'easy'}
              </Badge>
            </div>
            <h2 className="text-base font-bold text-slate-900 mb-3">
              {problem?.title}
            </h2>
            <div className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line space-y-2">
              {problem?.description}
            </div>
          </div>

          {problem?.constraints && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Constraints & Bounds
              </h3>
              <pre className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 font-mono leading-relaxed whitespace-pre-wrap">
                {problem.constraints}
              </pre>
            </div>
          )}

          {/* Sample Test Cases */}
          {problem?.sampleTestCases && problem.sampleTestCases.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Public Sample Test Cases ({problem.sampleTestCases.length})
              </h3>
              <div className="space-y-3">
                {problem.sampleTestCases.map((tc, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                    <div className="text-slate-700 font-bold flex items-center justify-between">
                      <span>Sample Case #{idx + 1}</span>
                      <span className="text-[10px] text-slate-500 font-mono">Weight: {tc.weight || 1}</span>
                    </div>
                    <div className="font-mono text-slate-700 bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-slate-500 text-[10px] block uppercase font-sans font-semibold">Input:</span>
                      <span className="text-indigo-700 font-semibold">{tc.input_data}</span>
                    </div>
                    <div className="font-mono text-slate-700 bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-slate-500 text-[10px] block uppercase font-sans font-semibold">Expected Output:</span>
                      <span className="text-emerald-700 font-semibold">{tc.expected_output}</span>
                    </div>
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
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs space-y-3 min-h-[180px] shadow-xs">
            <div className="flex items-center justify-between text-slate-600 border-b border-slate-200 pb-2">
              <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                <Terminal className="w-3.5 h-3.5 text-indigo-600" />
                Execution Console & Test Output
              </span>
              {executionResult && (
                <span className="text-[11px] text-slate-500">
                  Execution Time: {executionResult.totalTimeMs || 0}ms
                </span>
              )}
            </div>

            {executionResult ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-700">Test Outcome:</span>
                  {executionResult.overallStatus === 'passed' ? (
                    <Badge variant="success">All Tests Passed (100%)</Badge>
                  ) : (
                    <Badge variant="danger">Tests Failed or Runtime Error</Badge>
                  )}
                </div>

                {/* Individual test case results */}
                <div className="space-y-2 pt-1">
                  {executionResult.results?.map((res, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-xl text-xs space-y-1.5 border transition-all ${
                        res.passed
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : 'bg-rose-50 border-rose-200 text-rose-900'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <div className="flex items-center gap-1.5">
                          {res.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                          )}
                          <span>Test Case #{res.testCaseIndex || i + 1}: {res.status}</span>
                        </div>
                        <span className="font-mono text-[11px] text-slate-600 font-normal">
                          {res.executionTimeMs || 0}ms
                        </span>
                      </div>

                      {!res.passed && (
                        <div className="pt-1.5 border-t border-rose-200/60 font-mono text-[11px] space-y-1">
                          {res.input && (
                            <div>
                              <span className="text-rose-700 font-semibold font-sans">Input: </span>
                              <span>{res.input}</span>
                            </div>
                          )}
                          {res.expectedOutput && (
                            <div>
                              <span className="text-emerald-700 font-semibold font-sans">Expected: </span>
                              <span>{res.expectedOutput}</span>
                            </div>
                          )}
                          {res.actualOutput && (
                            <div>
                              <span className="text-rose-700 font-semibold font-sans">Your Output / Error: </span>
                              <span className="font-bold text-rose-800">{res.actualOutput}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-xs py-4 flex items-center gap-2">
                <Play className="w-3.5 h-3.5 text-slate-400" />
                <span>Click <strong>"Run Tests"</strong> to verify your solution against standard sample test cases.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
