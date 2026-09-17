import React, { useEffect, useState, useRef } from 'react';
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
  ShieldAlert,
  Maximize,
  Minimize,
  AlertOctagon,
  Ban,
  ShieldCheck,
  Video,
} from 'lucide-react';
import CodeEditor from '../components/CodeEditor';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import ProctorMonitor from '../components/ProctorMonitor';

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

  // Proctoring & Anti-Cheat State
  const [attemptId, setAttemptId] = useState(null);
  const [violationsCount, setViolationsCount] = useState(0);
  const [violationsLog, setViolationsLog] = useState([]);
  const [warningModal, setWarningModal] = useState(null);
  const [isDisqualified, setIsDisqualified] = useState(false);
  const [disqualificationReason, setDisqualificationReason] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasStartedProctoring, setHasStartedProctoring] = useState(false);

  // Sound synthesized with Web Audio API
  const playWarningChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  };

  const playDisqualificationSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(240, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(120, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch {}
  };

  // Fullscreen helper
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  // Violation Engine
  const handleViolation = async (type, reason) => {
    if (isDisqualified) return;

    const violationRecord = {
      type,
      reason,
      timestamp: new Date().toLocaleTimeString(),
    };

    setViolationsLog((prev) => {
      const updatedLog = [...prev, violationRecord];
      const newCount = prev.length + 1;
      setViolationsCount(newCount);

      if (newCount === 1) {
        // Strike 1: Warning Modal
        playWarningChime();
        setWarningModal({
          strike: 1,
          maxStrikes: 2,
          type,
          reason,
        });
      } else if (newCount >= 2) {
        // Strike 2: Immediate Disqualification
        playDisqualificationSound();
        setIsDisqualified(true);
        setDisqualificationReason(reason);
        setWarningModal(null);

        // Notify backend disqualification endpoint
        api.disqualifyAssessment(id, attemptId, reason, updatedLog).catch((e) => {
          console.error('Failed to sync disqualification with backend:', e);
        });
      }

      return updatedLog;
    });
  };

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
        } catch {}

        // 2. Start assessment attempt in backend to track attemptId
        try {
          const startRes = await api.startAssessment(id);
          if (startRes?.id) setAttemptId(startRes.id);
        } catch {}

        // 3. If it is an assessment with problems
        if (loadedAssess && loadedProblems.length > 0) {
          setAssessment(loadedAssess);
          setProblemsList(loadedProblems);

          const firstProb = loadedProblems[0];
          try {
            const detailed = await api.getProblem(firstProb.id || firstProb.slug);
            initialProblem = detailed || firstProb;
          } catch {
            initialProblem = firstProb;
          }
        } else if (!loadedAssess) {
          // 4. Fallback: load as a standalone Problem
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
        // Delay boundary listeners slightly so initial hardware setup doesn't false-trigger
        setTimeout(() => setHasStartedProctoring(true), 2500);
      }
    }
    loadData();
  }, [id]);

  // Tab-Switch, Blur & Fullscreen Listeners
  useEffect(() => {
    if (loading || isDisqualified || !hasStartedProctoring) return;

    // 1. Tab switch listener
    const handleVisibilityChange = () => {
      if (document.hidden && !isDisqualified) {
        handleViolation('TAB_SWITCH', 'Candidate switched tabs away from the assessment workspace');
      }
    };

    // 2. Window blur listener (clicking outside)
    const handleWindowBlur = () => {
      if (!isDisqualified) {
        handleViolation('WINDOW_BLUR', 'Candidate navigated or clicked outside the exam window');
      }
    };

    // 3. Fullscreen exit listener
    const handleFullscreenChange = () => {
      const inFull = !!document.fullscreenElement;
      setIsFullscreen(inFull);
      if (!inFull && !isDisqualified && hasStartedProctoring) {
        handleViolation('FULLSCREEN_EXIT', 'Candidate exited full-screen proctored examination mode');
      }
    };

    // 4. Page reload / navigation block
    const handleBeforeUnload = (e) => {
      if (!isDisqualified) {
        e.preventDefault();
        e.returnValue = 'Assessment in progress. Leaving will immediately disqualify your attempt.';
        return e.returnValue;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [loading, isDisqualified, hasStartedProctoring]);

  // Switch between problems in the assessment suite
  const handleSelectProblem = async (index) => {
    if (index === activeProblemIndex || !problemsList[index] || isDisqualified) return;

    if (problem) {
      setCodeMap((prev) => ({ ...prev, [problem.id]: code }));
    }

    const targetProbSummary = problemsList[index];
    setActiveProblemIndex(index);
    setExecutionResult(null);

    try {
      let fullProb = targetProbSummary;
      try {
        const detailed = await api.getProblem(targetProbSummary.id || targetProbSummary.slug);
        if (detailed) fullProb = detailed;
      } catch (e) {
        console.warn('Using summary problem data:', e);
      }

      setProblem(fullProb);
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
    if (isDisqualified) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isDisqualified]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleLanguageChange = (newLang) => {
    if (isDisqualified) return;
    setLanguage(newLang);
    if (problem?.starter_code?.[newLang]) {
      const langStarter = problem.starter_code[newLang];
      setCode(langStarter);
      setCodeMap((prev) => ({ ...prev, [problem.id]: langStarter }));
    }
  };

  const handleRunSampleTests = async () => {
    if (!problem?.id || isDisqualified) return;
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
    if (!problem?.id || isDisqualified) return;
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
          Initializing proctoring security sandbox & verified test suites...
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
    <div className="space-y-4 animate-in fade-in pb-12 relative">
      {/* Proctoring Status & Strike Counter Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-center gap-2 text-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-bold text-emerald-400 font-mono tracking-wide">
            PROCTORING ACTIVE
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300 hidden sm:inline text-[11px]">
            Live Webcam & RMS Speech Detection
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Strikes Badge */}
          <div
            className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
              violationsCount === 0
                ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                : violationsCount === 1
                ? 'bg-amber-950 text-amber-300 border border-amber-500 animate-pulse'
                : 'bg-rose-950 text-rose-300 border border-rose-500 font-extrabold'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Violations: {violationsCount}/2 Strikes</span>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
            title="Toggle fullscreen examination mode"
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
          </button>
        </div>
      </div>

      {/* Top Assessment Navigation & Controls Bar */}
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
              <span>Standard I/O Automated Sandbox</span>
              <span>•</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Proctoring Monitored
              </span>
            </div>
          </div>
        </div>

        {/* Timer & Execution Controls */}
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
            disabled={isDisqualified}
            icon={Play}
          >
            Run Tests
          </Button>

          <Button
            onClick={handleSubmitSolution}
            variant="primary"
            size="sm"
            loading={submitting}
            disabled={isDisqualified}
            icon={Send}
          >
            Submit Assessment
          </Button>
        </div>
      </div>

      {/* Multi-Problem Switcher Bar */}
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
                  disabled={isDisqualified}
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
            readOnly={isDisqualified}
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

      {/* Floating Picture-in-Picture Webcam & Audio Monitor */}
      <ProctorMonitor onViolation={handleViolation} isLocked={isDisqualified} />

      {/* STRIKE 1: URGENT WARNING MODAL */}
      {warningModal && !isDisqualified && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white border-2 border-amber-500 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 border-2 border-amber-300 text-amber-600 flex items-center justify-center mx-auto animate-bounce">
              <ShieldAlert className="w-9 h-9" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider mb-2">
                Warning Strike 1/2
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Prohibited Action Detected
              </h2>
              <p className="text-xs font-semibold text-rose-600 mt-1 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                {warningModal.reason}
              </p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Academic integrity guidelines strictly prohibit talking, leaving fullscreen, switching tabs, or clicking outside the assessment window. <strong>One more violation will immediately disqualify you and revoke all digital credentials.</strong>
            </p>

            <button
              onClick={() => {
                setWarningModal(null);
                toggleFullscreen();
              }}
              className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-all shadow-md shadow-amber-600/30 cursor-pointer"
            >
              I Understand — Resume Assessment in Fullscreen
            </button>
          </div>
        </div>
      )}

      {/* STRIKE 2: IMMEDIATE CANDIDATE DISQUALIFICATION SCREEN */}
      {isDisqualified && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-lg animate-in zoom-in-95">
          <div className="bg-slate-900 border-2 border-rose-600 rounded-3xl max-w-xl w-full p-8 shadow-2xl space-y-6 text-center text-white relative overflow-hidden">
            {/* Top Red Alert Stripe */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-rose-600 animate-pulse" />

            <div className="w-20 h-20 rounded-3xl bg-rose-950 border-2 border-rose-500 text-rose-500 flex items-center justify-center mx-auto shadow-lg shadow-rose-900/50">
              <Ban className="w-11 h-11" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-900/80 border border-rose-500/40 text-rose-300 text-xs font-bold uppercase tracking-wider">
                <AlertOctagon className="w-3.5 h-3.5" /> Assessment Terminated
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-rose-500 tracking-tight">
                CANDIDATE DISQUALIFIED
              </h1>
              <p className="text-xs text-slate-300">
                Your assessment has been automatically locked due to repeated anti-cheat proctoring violations.
              </p>
            </div>

            {/* Violation Details Box */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-rose-900/50 text-left space-y-2 text-xs">
              <div className="text-rose-400 font-bold uppercase tracking-wider text-[10px]">
                Disqualification Reason:
              </div>
              <div className="text-slate-200 font-semibold">
                {disqualificationReason || 'Exceeded maximum permitted proctoring violation strikes.'}
              </div>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div>• Assessment score recorded as: <strong className="text-rose-400 font-mono">0 / 100 (0%)</strong></div>
                <div>• Verifiable Credential generation (Ed25519): <strong className="text-rose-400 font-mono">REVOKED</strong></div>
                <div>• Total Proctoring Strikes: <strong className="text-rose-400 font-mono">2 / 2</strong></div>
              </div>
            </div>

            {/* Violations Log */}
            {violationsLog.length > 0 && (
              <div className="text-left space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Logged Incident Timeline:
                </span>
                <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                  {violationsLog.map((v, i) => (
                    <div key={i} className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] flex items-center justify-between text-slate-300">
                      <span>Strike #{i + 1}: {v.reason}</span>
                      <span className="font-mono text-[10px] text-slate-500">{v.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-lg shadow-rose-600/40 cursor-pointer"
            >
              Acknowledge Disqualification & Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
