import React, { useEffect, useRef, useState } from 'react';
import { Camera, Mic, AlertTriangle, ShieldCheck, VideoOff, Volume2 } from 'lucide-react';

const SPEECH_THRESHOLD = 22; // Percent volume to consider speech (above ambient noise)
const SUSTAINED_SPEECH_MS = 1500; // 1.5 seconds of sustained speech triggers violation

export default function ProctorMonitor({ onViolation, isLocked = false }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const checkIntervalRef = useRef(null);
  const sustainedVoiceTimeRef = useRef(0);

  const [hasPermission, setHasPermission] = useState(null); // null = requesting, true = granted, false = denied
  const [errorMessage, setErrorMessage] = useState('');
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const startProctoring = async () => {
    setErrorMessage('');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam and Microphone API not supported on this browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 320 },
          height: { ideal: 240 },
          facingMode: 'user',
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: false, // keep natural audio so speech isn't zeroed out
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Initialize Web Audio API
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioCtx();
      audioContextRef.current = audioContext;

      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.3;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      // Analyze sound level every 100ms
      checkIntervalRef.current = setInterval(() => {
        if (isLocked) return;

        analyser.getByteTimeDomainData(dataArray);

        // Compute Root-Mean-Square (RMS) amplitude
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          const val = (dataArray[i] - 128) / 128;
          sum += val * val;
        }
        const rms = Math.sqrt(sum / bufferLength);
        const volume = Math.min(100, Math.round(rms * 280));
        setVolumeLevel(volume);

        if (volume >= SPEECH_THRESHOLD) {
          sustainedVoiceTimeRef.current += 100;
          setIsSpeaking(true);

          if (sustainedVoiceTimeRef.current >= SUSTAINED_SPEECH_MS) {
            sustainedVoiceTimeRef.current = 0;
            if (onViolation) {
              onViolation(
                'VOICE_DETECTED',
                'Speech or vocal audio detected in the assessment environment for > 1.5s',
              );
            }
          }
        } else {
          sustainedVoiceTimeRef.current = Math.max(0, sustainedVoiceTimeRef.current - 100);
          if (sustainedVoiceTimeRef.current === 0) {
            setIsSpeaking(false);
          }
        }
      }, 100);

      // Listen for hardware disconnects
      stream.getVideoTracks().forEach((track) => {
        track.onended = () => {
          if (onViolation) {
            onViolation('WEBCAM_DISCONNECTED', 'Webcam video stream was terminated or disconnected');
          }
        };
      });

      stream.getAudioTracks().forEach((track) => {
        track.onended = () => {
          if (onViolation) {
            onViolation('MIC_DISCONNECTED', 'Microphone audio stream was terminated or disconnected');
          }
        };
      });

      setHasPermission(true);
    } catch (err) {
      console.error('Proctoring camera/audio error:', err);
      setHasPermission(false);
      setErrorMessage(err.message || 'Camera and Microphone access is mandatory.');
      if (onViolation) {
        onViolation('HARDWARE_ACCESS_DENIED', 'Camera or microphone permission was denied or unavailable');
      }
    }
  };

  const stopProctoring = () => {
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
  };

  useEffect(() => {
    startProctoring();
    return () => {
      stopProctoring();
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end pointer-events-none select-none">
      <div className="pointer-events-auto bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl p-2.5 w-64 space-y-2 transition-all">
        {/* Header Indicator */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
              Live Proctoring Active
            </span>
          </div>
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
        </div>

        {/* Video Preview Container */}
        <div className="relative w-full h-36 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
          {hasPermission === true && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror scale-x-[-1]"
            />
          )}

          {hasPermission === false && (
            <div className="text-center p-3 space-y-1.5 text-rose-400">
              <VideoOff className="w-6 h-6 mx-auto opacity-80" />
              <div className="text-[11px] font-bold">Camera Blocked</div>
              <p className="text-[9px] text-slate-400 leading-tight">
                {errorMessage || 'Allow camera & mic access to continue.'}
              </p>
              <button
                onClick={startProctoring}
                className="mt-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-md text-[10px] font-semibold"
              >
                Retry Access
              </button>
            </div>
          )}

          {hasPermission === null && (
            <div className="text-center space-y-1 text-slate-400">
              <Camera className="w-5 h-5 mx-auto animate-pulse text-indigo-400" />
              <div className="text-[10px]">Initializing hardware...</div>
            </div>
          )}

          {/* Real-time speech alert badge overlay */}
          {isSpeaking && (
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-amber-500/90 text-slate-950 font-bold text-[9px] flex items-center gap-1 shadow-xs animate-bounce">
              <Mic className="w-3 h-3" />
              <span>Voice Detected</span>
            </div>
          )}
        </div>

        {/* Audio Meter Strip */}
        <div className="space-y-1 px-0.5">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-400 flex items-center gap-1">
              <Volume2 className="w-3 h-3" /> Audio Level
            </span>
            <span
              className={`font-mono text-[9px] font-bold ${
                volumeLevel >= SPEECH_THRESHOLD ? 'text-amber-400' : 'text-slate-400'
              }`}
            >
              {volumeLevel}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-75 ${
                volumeLevel >= SPEECH_THRESHOLD
                  ? 'bg-gradient-to-r from-amber-400 to-rose-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, volumeLevel * 1.5)}%` }}
            />
          </div>
        </div>

        {/* Security Rule Footer */}
        <div className="text-[9px] text-slate-400 leading-tight border-t border-slate-800 pt-1.5 flex items-center justify-between">
          <span>Tab switches & speech strictly prohibited</span>
          <span className="font-mono text-slate-400">Strict mode</span>
        </div>
      </div>
    </div>
  );
}
