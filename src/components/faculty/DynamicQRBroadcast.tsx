import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/apiClient.js';
import { AttendanceSession, AttendanceRecord } from '../../types/index.js';
import {
  Radio,
  Clock,
  Users,
  ShieldCheck,
  Pause,
  Play,
  StopCircle,
  FileCheck2,
  RefreshCw,
  Sparkles,
  Volume2,
  VolumeX,
  ExternalLink,
  ChevronRight,
  Maximize2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface DynamicQRBroadcastProps {
  session: AttendanceSession;
  onCloseSession: () => void;
  onOpenManualReview: (session: AttendanceSession) => void;
}

export const DynamicQRBroadcast: React.FC<DynamicQRBroadcastProps> = ({
  session,
  onCloseSession,
  onOpenManualReview,
}) => {
  const { currentUser } = useAuth();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [currentToken, setCurrentToken] = useState<string>('');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(20);
  const [refreshInterval, setRefreshInterval] = useState<number>(20);
  const [attendees, setAttendees] = useState<AttendanceRecord[]>([]);
  const [totalPresent, setTotalPresent] = useState<number>(session.totalPresent || 0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [lastRotatedAt, setLastRotatedAt] = useState<number>(Date.now());

  const previousCountRef = useRef<number>(session.totalPresent || 0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Sound chime synthesizer
  const playScanChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.12); // G5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  };

  // Fetch or regenerate dynamic QR code from server
  const fetchQR = async () => {
    if (isPaused) return;
    try {
      const res = await api.getSessionQR(session.id);
      setCurrentToken(res.token);
      setRefreshInterval(res.refreshIntervalSeconds || 20);
      setSecondsRemaining(res.remainingSeconds || res.refreshIntervalSeconds || 20);
      setTotalPresent(res.totalPresent);
      setLastRotatedAt(Date.now());

      // Check if new attendees scanned
      if (res.totalPresent > previousCountRef.current) {
        playScanChime();
        previousCountRef.current = res.totalPresent;
      }
      setAttendees(res.attendees || []);

      // Generate visual QR Code data URL
      const dataUrl = await QRCode.toDataURL(res.token, {
        width: 440,
        margin: 2,
        color: {
          dark: '#0f172a', // deep navy
          light: '#ffffff', // crisp white
        },
        errorCorrectionLevel: 'H',
      });
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error('Failed to fetch dynamic QR token:', err);
    }
  };

  // Initial fetch and regular polling loop
  useEffect(() => {
    fetchQR();
    const interval = setInterval(() => {
      fetchQR();
    }, 4000); // Poll server every 4s to detect new attendee scans

    return () => clearInterval(interval);
  }, [session.id, isPaused]);

  // Local seconds countdown timer
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          fetchQR(); // Fetch fresh QR when timer hits 0
          return refreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, refreshInterval]);

  // Toggle fullscreen for lecture hall projector
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullScreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullScreen(false);
    }
  };

  const attendancePercentage = session.totalEnrolled
    ? Math.round((totalPresent / session.totalEnrolled) * 100)
    : 0;

  return (
    <div
      ref={containerRef}
      className={`space-y-6 ${isFullScreen ? 'p-8 bg-slate-950 min-h-screen' : ''}`}
    >
      {/* Session Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Live Dynamic Attendance Session
            </span>
            <span className="text-xs font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-800">
              {session.sessionType}
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-3">
            <span>{session.subjectCode} – {session.subjectName}</span>
          </h2>
          <p className="text-xs text-slate-400">
            Venue: <strong className="text-slate-200">{session.classroomName}</strong> • Instructor: <strong className="text-slate-200">{session.facultyName}</strong> • Topic: <span className="text-indigo-300">{session.topic}</span>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border text-xs font-medium transition-colors ${
              soundEnabled
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
            title={soundEnabled ? 'Mute scan chimes' : 'Enable scan chimes'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={toggleFullScreen}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-colors"
            title="Toggle Projector Mode"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-colors ${
              isPaused
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? 'Resume QR' : 'Freeze QR'}</span>
          </button>

          <button
            onClick={() => onOpenManualReview(session)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Manual Review</span>
          </button>

          <button
            onClick={onCloseSession}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/20 transition-colors"
          >
            <StopCircle className="w-3.5 h-3.5" />
            <span>End Session</span>
          </button>
        </div>
      </div>

      {/* Main Screen: Left = Dynamic QR Projector Box, Right = Real-Time Attendees */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Dynamic QR Display Card (Projector View) */}
        <div className="lg:col-span-7 rounded-3xl bg-slate-900 border-2 border-indigo-500/30 p-6 md:p-8 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden">
          {/* Top Info Bar inside projector */}
          <div className="w-full flex items-center justify-between mb-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="font-mono text-slate-300">
                ROTATES EVERY {refreshInterval}s
              </span>
            </div>
            <div className="flex items-center gap-1 text-slate-400 font-mono">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>{new Date().toLocaleTimeString()}</span>
            </div>
          </div>

          {/* QR Container with High Contrast & Anti-Screenshot Watermark */}
          <div className="relative p-4 md:p-6 bg-white rounded-3xl shadow-2xl border-4 border-slate-800">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Dynamic Classroom Attendance QR Code"
                className="w-64 h-64 md:w-80 md:h-80 object-contain mx-auto select-none pointer-events-none"
              />
            ) : (
              <div className="w-64 h-64 md:w-80 md:h-80 flex items-center justify-center bg-slate-100 rounded-2xl">
                <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin" />
              </div>
            )}

            {/* Anti-Proxy Dynamic Watermark overlay */}
            <div className="absolute top-2 left-4 right-4 flex items-center justify-between text-[10px] font-mono font-bold text-slate-600 uppercase select-none opacity-80 pointer-events-none">
              <span>SmartAttend Dynamic</span>
              <span>{session.classroomName}</span>
            </div>
            <div className="absolute bottom-2 left-4 right-4 flex items-center justify-between text-[9px] font-mono text-slate-500 select-none opacity-70 pointer-events-none">
              <span>Token: {currentToken.slice(-12)}</span>
              <span>Exp: {secondsRemaining}s</span>
            </div>
          </div>

          {/* Countdown Progress Bar & Visual Seconds */}
          <div className="w-full max-w-sm mt-6 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${!isPaused ? 'animate-spin' : ''}`} />
                Next QR Refresh in
              </span>
              <span className="font-mono font-black text-lg text-cyan-400">
                {secondsRemaining}s
              </span>
            </div>

            {/* Animated countdown bar */}
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-1000 ease-linear"
                style={{
                  width: `${(secondsRemaining / refreshInterval) * 100}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Screenshots expire automatically. Students must scan the live code on this screen.
            </p>
          </div>
        </div>

        {/* Live Attendee Stream & Real-Time Counter */}
        <div className="lg:col-span-5 rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-5">
          {/* Header Stats */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                Attendance Recorded
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-white">{totalPresent}</span>
                <span className="text-sm font-semibold text-slate-400">/ {session.totalEnrolled} enrolled</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-2xl font-black text-emerald-400">{attendancePercentage}%</span>
              <span className="block text-[10px] text-slate-400 font-semibold uppercase">Present Rate</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${attendancePercentage}%` }}
            />
          </div>

          {/* Live attendee feed list */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>Live Feed ({attendees.length})</span>
              </h4>
              <span className="text-[10px] text-slate-400">Auto-updates in real time</span>
            </div>

            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {attendees.length > 0 ? (
                attendees.map((a, idx) => (
                  <div
                    key={a.id}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 flex items-center justify-between transition-all animate-in fade-in slide-in-from-right-4 duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300 text-xs">
                        {idx + 1}
                      </div>
                      <div>
                        <span className="font-semibold text-xs text-white block">
                          {a.studentName}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {a.studentRollNumber} • {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {a.isFlaggedProxy ? (
                        <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-semibold flex items-center gap-1" title={a.proxyReason}>
                          <AlertCircle className="w-3 h-3" />
                          Location Flag
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <Clock className="w-8 h-8 mx-auto text-slate-600 mb-2 animate-pulse" />
                  <p>Awaiting student scans...</p>
                  <p className="text-[11px] text-slate-500 mt-1">Students will appear here as they scan the live QR code.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
