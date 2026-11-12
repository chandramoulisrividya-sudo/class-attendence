import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/apiClient.js';
import { StudentStats } from '../../types/index.js';
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  FileText,
  ShieldAlert,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const ShortageWarnings: React.FC = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);

  const studentId = currentUser?.id || 'std-1';

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const res = await api.getStudentSummary(studentId);
        setStats(res.summary);
      } catch (err) {
        console.error('Failed to load shortage stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [studentId]);

  if (loading || !stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const shortageSubjects = stats.subjectStats.filter((s) => s.shortageWarning);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <AlertTriangle className="w-6 h-6 text-amber-400" />
          <span>Attendance Shortage & Eligibility Center</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Real-time deficit calculations and recovery paths to meet the mandatory 75% university examination criteria.
        </p>
      </div>

      {/* Regulation Policy Callout */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-lg flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-white">University Academic Council Attendance By-Law §14.2</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every candidate is expected to attend 100% of the lectures, practicals, and tutorials. However, a student
            who secures <strong>not less than 75% of attendance</strong> in each subject shall be eligible to appear for
            the Semester End Examinations. Condonation up to 10% (i.e. between 65% and 74.9%) requires medical committee certification.
          </p>
        </div>
      </div>

      {/* Overall Status Banner */}
      <div
        className={`p-6 rounded-2xl border shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6 ${
          stats.shortageWarning
            ? 'bg-rose-950/20 border-rose-500/30'
            : 'bg-emerald-950/20 border-emerald-500/30'
        }`}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                stats.shortageWarning
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {stats.shortageWarning ? 'Shortage Detected' : 'All Clear • Exam Ready'}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Cumulative: {stats.percentage}%
            </span>
          </div>
          <h3 className="text-lg font-bold text-white">
            {stats.shortageWarning
              ? `You have ${shortageSubjects.length} subject${shortageSubjects.length > 1 ? 's' : ''} currently below the 75% threshold.`
              : 'You are currently meeting or exceeding attendance regulations in all registered subjects!'}
          </h3>
          <p className="text-xs text-slate-400 max-w-xl">
            {stats.shortageWarning
              ? 'Review the consecutive attendance requirements below to restore good standing before the term deadline.'
              : 'Keep attending regularly via dynamic QR code to maintain your honor standing.'}
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-900/80 p-4 rounded-xl border border-slate-800 shrink-0">
          <div className="text-center">
            <span className="block text-2xl font-black text-white">{stats.attendedClasses}</span>
            <span className="text-[10px] uppercase text-slate-400">Attended</span>
          </div>
          <div className="w-px h-8 bg-slate-800" />
          <div className="text-center">
            <span className="block text-2xl font-black text-rose-400">{stats.missedClasses}</span>
            <span className="text-[10px] uppercase text-slate-400">Missed</span>
          </div>
          <div className="w-px h-8 bg-slate-800" />
          <div className="text-center">
            <span className="block text-2xl font-black text-indigo-400">{stats.totalClasses}</span>
            <span className="text-[10px] uppercase text-slate-400">Total</span>
          </div>
        </div>
      </div>

      {/* Subject Recovery Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-lg overflow-hidden space-y-4 p-6">
        <div>
          <h3 className="text-base font-bold text-white">Subject-by-Subject Recovery Analysis</h3>
          <p className="text-xs text-slate-400">Formula: <code className="text-indigo-300 font-mono">x = ⌈(0.75 * Total - Attended) / 0.25⌉</code></p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.subjectStats.map((sub) => {
            const isShort = sub.shortageWarning;
            return (
              <div
                key={sub.subjectId}
                className={`p-5 rounded-2xl border ${
                  isShort ? 'bg-rose-950/20 border-rose-500/30' : 'bg-slate-950/40 border-slate-800'
                } space-y-3`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {sub.subjectCode}
                    </span>
                    <h4 className="text-sm font-semibold text-white mt-1.5">{sub.subjectName}</h4>
                    <p className="text-xs text-slate-400">Faculty: {sub.facultyName}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xl font-extrabold ${isShort ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {sub.percentage}%
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      {sub.attended}/{sub.total} Classes
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isShort ? 'bg-rose-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, sub.percentage)}%` }}
                  />
                </div>

                {/* Actionable recovery box */}
                <div className={`p-3 rounded-xl text-xs flex items-center justify-between ${
                  isShort ? 'bg-rose-900/30 text-rose-300 border border-rose-500/20' : 'bg-emerald-900/20 text-emerald-300 border border-emerald-500/20'
                }`}>
                  <div className="flex items-center gap-2">
                    {isShort ? <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" /> : <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />}
                    <span>
                      {isShort
                        ? `Attend next ${sub.classesNeededFor75} lecture${sub.classesNeededFor75 > 1 ? 's' : ''} without absence`
                        : 'Currently meeting eligibility criteria'}
                    </span>
                  </div>
                  <span className="font-mono font-bold">Target 75%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
