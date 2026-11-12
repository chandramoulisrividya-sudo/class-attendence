import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useAuth } from '../../context/AuthContext.js';
import { UserRole } from '../../types/index.js';
import {
  QrCode,
  ShieldCheck,
  Zap,
  GraduationCap,
  Briefcase,
  Sliders,
  CheckCircle2,
  Clock,
  MapPin,
  Lock,
  ArrowRight,
  Sparkles,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';

interface LandingPageProps {
  onEnterDashboard: () => void;
  onOpenRegister: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterDashboard,
  onOpenRegister,
}) => {
  const { loginAsRole, login, allDemoUsers } = useAuth();
  const [demoQr, setDemoQr] = useState<string>('');
  const [secondsLeft, setSecondsLeft] = useState<number>(20);

  // Generate a live demo rotating QR code on landing hero
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const updateDemoQr = () => {
      const demoToken = `SMARTATTEND:demo-cse301:${Date.now()}:${Date.now() + 20000}:sig78f0b12`;
      QRCode.toDataURL(demoToken, {
        width: 240,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' },
      }).then(setDemoQr).catch(() => {});
      setSecondsLeft(20);
    };

    updateDemoQr();
    interval = setInterval(updateDemoQr, 20000);

    const timer = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 20 : s - 1));
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, []);

  const handleLaunchRole = async (role: UserRole, specificUserId?: string) => {
    if (specificUserId) {
      await login(specificUserId);
    } else {
      await loginAsRole(role);
    }
    onEnterDashboard();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <nav className="h-16 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <QrCode className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            SmartAttend
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenRegister}
            className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 transition-colors"
          >
            Student Register
          </button>
          <button
            onClick={() => handleLaunchRole('student')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all"
          >
            Launch System Demo
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden py-16 md:py-24 px-6 max-w-7xl mx-auto w-full flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headlines & 1-Click Launchers */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Next-Gen College Attendance Management</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
              Digitize Classroom Attendance with{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-teal-300 bg-clip-text text-transparent">
                Dynamic QR Codes
              </span>
            </h1>

            <p className="text-base text-slate-300 leading-relaxed max-w-2xl">
              Replace slow manual roll calls with short-lived, digitally signed QR codes that rotate every 20 seconds. Built with anti-proxy geofencing, real-time live attendance dashboards, and automated 75% shortage compliance.
            </p>

            {/* 1-Click Role Exploration Box */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Instant Interactive Demo — Select a Perspective:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  onClick={() => {
                    handleLaunchRole('student');
                  }}
                  className="p-3.5 rounded-xl bg-slate-950/80 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/40 text-left transition-all group"
                >
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs mb-1">
                    <GraduationCap className="w-4 h-4" />
                    <span>Student Portal</span>
                  </div>
                  <span className="text-xs font-semibold text-white block">Create Student Account</span>
                  <span className="text-[10px] text-cyan-300 font-medium">Register & Scan Live QR</span>
                </button>

                <button
                  onClick={() => handleLaunchRole('faculty', 'fac-1')}
                  className="p-3.5 rounded-xl bg-slate-950/80 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/40 text-left transition-all group"
                >
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs mb-1">
                    <Briefcase className="w-4 h-4" />
                    <span>Registered Teachers</span>
                  </div>
                  <span className="text-xs font-semibold text-white block">Dr. Sarah Jenkins</span>
                  <span className="text-[10px] text-cyan-300 font-medium">CSE Dept • Live Session</span>
                </button>

                <button
                  onClick={() => handleLaunchRole('admin')}
                  className="p-3.5 rounded-xl bg-slate-950/80 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/40 text-left transition-all group"
                >
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-xs mb-1">
                    <Sliders className="w-4 h-4" />
                    <span>Dean Admin</span>
                  </div>
                  <span className="text-xs font-semibold text-white block">Dr. Marcus Vance</span>
                  <span className="text-[10px] text-purple-300 font-medium">Campus Governance</span>
                </button>
              </div>

              <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
                <span>Also test:</span>
                <button
                  onClick={() => handleLaunchRole('student', 'std-3')}
                  className="text-rose-400 hover:text-rose-300 underline font-medium"
                >
                  David Kim (At-Risk Student with 58% Shortage Warning)
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Mock Dynamic QR Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-sm rounded-3xl bg-slate-900 border-2 border-indigo-500/30 p-6 shadow-2xl relative text-center space-y-4">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="font-mono text-slate-300 font-bold">DYNAMIC QR LIVE</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400">
                  CS301 • LH-101
                </span>
              </div>

              {/* Dynamic QR Code */}
              <div className="p-4 bg-white rounded-2xl shadow-xl inline-block relative border-2 border-slate-800">
                {demoQr ? (
                  <img src={demoQr} alt="Live Dynamic QR Sample" className="w-56 h-56 mx-auto" />
                ) : (
                  <div className="w-56 h-56 bg-slate-100 flex items-center justify-center">
                    <QrCode className="w-12 h-12 text-slate-400 animate-pulse" />
                  </div>
                )}
                <div className="absolute bottom-1 left-2 right-2 flex justify-between text-[8px] font-mono text-slate-500 uppercase select-none">
                  <span>SmartAttend</span>
                  <span>Expires in {secondsLeft}s</span>
                </div>
              </div>

              {/* Countdown bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-300">
                  <span className="text-slate-400">Cryptographic Rotation:</span>
                  <span className="font-mono font-bold text-cyan-400">{secondsLeft}s remaining</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-1000"
                    style={{ width: `${(secondsLeft / 20) * 100}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Anti-Screenshot & HMAC Protected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-20 pt-12 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Dynamic 20-Second Refresh</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every token is cryptographically bound to the lecture session and expires rapidly, stopping students from forwarding WhatsApp screenshots.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Classroom Geofencing</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Optional location validation cross-references classroom GPS coordinates with student device sensors to flag suspicious off-campus scans.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Immutable Audit Trail</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every session creation, student scan, and faculty manual override is permanently logged with timestamps for university accreditation compliance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
