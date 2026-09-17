import React, { useEffect, useRef, useState } from 'react';
import { Camera, Mic, AlertTriangle, ShieldCheck, Eye, EyeOff, Volume2, Lock } from 'lucide-react';

/**
 * ProctorWidget: Reusable PiP webcam monitor with real-time face-absence and voice detection
 *
 * @param {Function} onViolation - callback when a strikeable violation occurs (type, message)
 * @param {Function} onFaceWarning - callback when candidate's face is missing (boolean)
 * @param {boolean} isLocked - whether candidate is disqualified/test concluded
 */
export default function ProctorWidget({ onViolation, onFaceWarning, isLocked = false }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);

  const [hasPermission, setHasPermission] = useState(false);
  const [permError, setPermError] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [voiceDetected, setVoiceDetected] = useState(false);
  const [faceDetected, setFaceDetected] = useState(true);
  const [faceWarningActive, setFaceWarningActive] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Absence tracking refs
  const absentTimeRef = useRef(0);
  const sustainedSpeechMsRef = useRef(0);
  const violationCooldownRef = useRef(0);

  // Initialize camera and microphone hardware
  useEffect(() => {
    let isMounted = true;

    async function initHardware() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' },
          audio: true,
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }

        // Setup Web Audio API RMS volume analyser
        try {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            audioContextRef.current = ctx;
            if (ctx.state === 'suspended') {
              ctx.resume().catch(() => {});
            }

            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 512;
            analyser.smoothingTimeConstant = 0.3;
            source.connect(analyser);
            analyserRef.current = analyser;
          }
        } catch (audioErr) {
          console.warn('ProctorWidget AudioContext setup warning:', audioErr);
        }

        setHasPermission(true);
      } catch (err) {
        if (!isMounted) return;
        console.error('Proctor hardware permission error:', err);
        setPermError('Camera / Microphone access denied. Monitoring required for verification.');
        if (onViolation) {
          onViolation('HARDWARE_DENIED', 'Candidate denied webcam or microphone access permissions');
        }
      }
    }

    initHardware();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Continuous Audio & Face Monitoring Loop
  useEffect(() => {
    if (!hasPermission || isLocked) return;

    let detector = null;
    if ('FaceDetector' in window) {
      try {
        detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 2 });
      } catch (e) {
        detector = null;
      }
    }

    const interval = setInterval(async () => {
      // Decrement violation cooldown timer
      if (violationCooldownRef.current > 0) {
        violationCooldownRef.current -= 500;
      }

      // 1. Audio RMS & Speech Detection
      if (analyserRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteTimeDomainData(dataArray);

        let sumSquares = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const normalized = (dataArray[i] - 128) / 128;
          sumSquares += normalized * normalized;
        }
        const rms = Math.sqrt(sumSquares / dataArray.length);
        const volumePercent = Math.min(100, Math.round(rms * 280));
        setAudioLevel(volumePercent);

        const SPEECH_THRESHOLD = 20; // percent
        if (volumePercent >= SPEECH_THRESHOLD) {
          sustainedSpeechMsRef.current += 500;
          setVoiceDetected(true);

          if (sustainedSpeechMsRef.current >= 1500) {
            sustainedSpeechMsRef.current = 0;
            if (violationCooldownRef.current <= 0 && onViolation) {
              violationCooldownRef.current = 8000;
              onViolation('VOICE_DETECTED', 'Sustained speaking or background voice detected');
            }
          }
        } else {
          sustainedSpeechMsRef.current = Math.max(0, sustainedSpeechMsRef.current - 250);
          if (sustainedSpeechMsRef.current === 0) {
            setVoiceDetected(false);
          }
        }
      }

      // 2. Face Detection & Absence Analysis
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || video.readyState < 2 || !canvas) return;

      let hasFace = false;

      // Primary: Native Shape Detection API if supported
      if (detector) {
        try {
          const faces = await detector.detect(video);
          hasFace = faces && faces.length > 0;
        } catch {
          hasFace = false;
        }
      }

      // Fallback: Color/Luminance Frame Sampling on offscreen canvas
      if (!detector) {
        try {
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          canvas.width = 160;
          canvas.height = 120;
          ctx.drawImage(video, 0, 0, 160, 120);

          // Sample center 70% of the frame
          const startX = 24;
          const startY = 18;
          const width = 112;
          const height = 84;
          const imgData = ctx.getImageData(startX, startY, width, height);
          const data = imgData.data;

          let skinPixels = 0;
          let totalSampled = 0;
          let totalLuminance = 0;

          for (let i = 0; i < data.length; i += 8) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            totalSampled++;

            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            totalLuminance += lum;

            // Skin Chrominance Boundary Check
            if (
              r > 75 &&
              g > 35 &&
              b > 20 &&
              Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
              Math.abs(r - g) > 15 &&
              r > g &&
              r > b
            ) {
              skinPixels++;
            }
          }

          const avgLuminance = totalLuminance / totalSampled;
          const skinRatio = skinPixels / totalSampled;

          // Camera not blacked out & skin tone present in center of frame
          hasFace = skinRatio >= 0.035 && avgLuminance >= 20 && avgLuminance <= 240;
        } catch (canvasErr) {
          hasFace = true; // Assume present on canvas read error to avoid false positives
        }
      }

      setFaceDetected(hasFace);

      // 3. Absence Time Tracking
      if (!hasFace) {
        absentTimeRef.current += 0.5;

        // Face missing for > 3.0 seconds -> Urgent Warning Banner
        if (absentTimeRef.current >= 3.0) {
          setFaceWarningActive(true);
          if (onFaceWarning) onFaceWarning(true);
        }

        // Face missing for > 10.0 seconds -> Strike Violation
        if (absentTimeRef.current >= 10.0) {
          absentTimeRef.current = 0;
          if (violationCooldownRef.current <= 0 && onViolation) {
            violationCooldownRef.current = 10000;
            onViolation('FACE_ABSENT', 'Candidate left the camera frame');
          }
        }
      } else {
        // Face returned
        if (absentTimeRef.current > 0) {
          absentTimeRef.current = 0;
        }
        if (faceWarningActive) {
          setFaceWarningActive(false);
          if (onFaceWarning) onFaceWarning(false);
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [hasPermission, isLocked, faceWarningActive, onViolation, onFaceWarning]);

  // Clean hardware on lockout
  useEffect(() => {
    if (isLocked && streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
  }, [isLocked]);

  if (permError) {
    return (
      <div className="fixed bottom-4 right-4 z-40 p-4 rounded-2xl bg-rose-950 border-2 border-rose-500 text-white max-w-xs shadow-2xl space-y-2 animate-in fade-in">
        <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
          <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
          <span>PROCTORING BLOCKED</span>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">{permError}</p>
      </div>
    );
  }

  return (
    <>
      {/* Off-screen canvas for pixel processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Floating Picture-in-Picture Webcam Feed */}
      <div
        className={`fixed bottom-4 right-4 z-40 transition-all duration-200 select-none ${
          isMinimized ? 'w-48' : 'w-60 sm:w-64'
        }`}
      >
        <div
          className={`rounded-2xl border-2 overflow-hidden shadow-2xl backdrop-blur-md bg-slate-900/95 transition-all ${
            !faceDetected && faceWarningActive
              ? 'border-amber-500 ring-4 ring-amber-500/30'
              : voiceDetected
              ? 'border-rose-500 ring-4 ring-rose-500/30'
              : 'border-slate-800'
          }`}
        >
          {/* Header Bar */}
          <div className="px-3 py-1.5 bg-slate-950 flex items-center justify-between border-b border-slate-800 text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-bold text-slate-200 tracking-wider uppercase font-mono">
                LIVE PROCTORING
              </span>
            </div>

            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-slate-400 hover:text-white text-[10px] px-1.5 py-0.5 rounded hover:bg-slate-800 transition-colors"
            >
              {isMinimized ? 'Expand' : 'Collapse'}
            </button>
          </div>

          {!isMinimized && (
            <>
              {/* Live Video Preview Frame */}
              <div className="relative aspect-4/3 bg-black overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover transform -scale-x-100 ${
                    isLocked ? 'filter grayscale brightness-50' : ''
                  }`}
                />

                {/* Face Absence Overlay */}
                {!faceDetected && (
                  <div className="absolute inset-0 bg-amber-950/70 backdrop-blur-xs flex flex-col items-center justify-center p-2 text-center text-amber-200 animate-in fade-in">
                    <EyeOff className="w-7 h-7 text-amber-400 animate-pulse mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Face Not Detected
                    </span>
                    <span className="text-[9px] text-amber-300/80">Stay centered in frame</span>
                  </div>
                )}

                {/* Locked overlay */}
                {isLocked && (
                  <div className="absolute inset-0 bg-rose-950/80 flex flex-col items-center justify-center p-2 text-rose-300">
                    <Lock className="w-8 h-8 text-rose-500 mb-1" />
                    <span className="text-xs font-bold uppercase">FEED LOCKED</span>
                  </div>
                )}

                {/* Live Mic Meter Bar in Video Overlay */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-[10px] text-white">
                  <Mic className={`w-3 h-3 ${voiceDetected ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
                  <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-75 ${
                        voiceDetected ? 'bg-rose-500' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${Math.min(100, audioLevel * 1.5)}%` }}
                    />
                  </div>
                  <span className="font-mono text-[9px] text-slate-300">{audioLevel}%</span>
                </div>
              </div>

              {/* Status Footer */}
              <div className="px-3 py-1.5 bg-slate-950/80 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/60">
                <div className="flex items-center gap-1">
                  {faceDetected ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-medium">
                      <Eye className="w-3 h-3" /> Face Tracked
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1 font-bold animate-pulse">
                      <AlertTriangle className="w-3 h-3" /> Face Absent
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {voiceDetected ? (
                    <span className="text-rose-400 flex items-center gap-1 font-bold">
                      <Volume2 className="w-3 h-3 animate-ping" /> Voice Detected
                    </span>
                  ) : (
                    <span className="text-slate-400 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-indigo-400" /> Proctor Active
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
