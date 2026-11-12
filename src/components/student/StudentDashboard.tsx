import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/apiClient.js';
import { StudentStats, AttendanceRecord } from '../../types/index.js';
import { CircularProgress } from '../common/CircularProgress.js';
import {
  QrCode,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  Calendar,
  Download,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface StudentDashboardProps {
  onOpenScanner: () => void;
  onNavigateHistory: () => void;
  onNavigateShortages: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onOpenScanner,
  onNavigateHistory,
  onNavigateShortages,
}) => {
  const { currentUser, allDemoUsers, login } = useAuth();
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [recentRecords, setRecentRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const studentId = currentUser?.id || 'std-1';

  const loadData = async () => {
    try {
      setLoading(true);
      const [summaryRes, recordsRes] = await Promise.all([
        api.getStudentSummary(studentId),
        api.getStudentRecords(studentId),
      ]);
      setStats(summaryRes.summary);
      setRecentRecords(recordsRes.records.slice(0, 5));
    } catch (err) {
      console.error('Failed to load student dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [studentId]);

  const otherStudents = allDemoUsers.filter(
    (u) => u.role === 'student' && u.id !== currentUser?.id
  );

  const downloadCSVReport = () => {
    if (!stats) return;
    const headers = ['Subject Code', 'Subject Name', 'Faculty', 'Attended', 'Total Classes', 'Percentage', 'Status'];
    const rows = stats.subjectStats.map((s) => [
      `"${s.subjectCode}"`,
      `"${s.subjectName}"`,
      `"${s.facultyName}"`,
      s.attended,
      s.total,
      `${s.percentage}%`,
      s.shortageWarning ? 'SHORTAGE (<75%)' : 'ELIGIBLE',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SmartAttend_Report_${currentUser?.studentId || 'Student'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !stats) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading student attendance profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner & Quick Action */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 p-6 md:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Semester {currentUser?.semester || 5} • {currentUser?.departmentName || 'Computer Science'}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Welcome back, {currentUser?.name}!
            </h1>
            <p className="text-slate-400 text-sm max-w-xl">
              Roll No: <span className="font-mono text-slate-200">{currentUser?.studentId || 'CS2023048'}</span> • Scan classroom dynamic QR codes to record attendance in real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenScanner}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <QrCode className="w-5 h-5" />
              <span>Scan Dynamic QR</span>
            </button>
            <button
              onClick={downloadCSVReport}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm border border-slate-700 transition-colors"
            >
              <Download className="w-4 h-4 text-slate-400" />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {/* Ambient subtle glow */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Critical Shortage Warning Banner (if overall or any subject < 75%) */}
      {stats?.shortageWarning && (
        <div className="rounded-2xl bg-rose-950/40 border border-rose-500/30 p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-rose-200 flex items-center gap-2">
                <span>Attendance Shortage Advisory</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono">
                  {stats.shortageCount} Subject{stats.shortageCount > 1 ? 's' : ''} Below 75%
                </span>
              </h3>
              <p className="text-xs text-rose-300/80 mt-1 max-w-2xl leading-relaxed">
                University academic regulation mandates a minimum of 75% attendance to appear in end-semester examinations. You are currently in critical shortage for one or more registered courses.
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateShortages}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs whitespace-nowrap self-start md:self-center transition-colors shadow-md shadow-rose-600/20"
          >
            View Recovery Plan
          </button>
        </div>
      )}

      {/* Main Grid: Prominent Circular Gauge + Quick Metric Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Prominent Circular Gauge Card */}
        <div className="lg:col-span-5 rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden">
          <div className="w-full flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Attendance Standing
            </h2>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              Verified by SmartAttend
            </span>
          </div>

          <div className="my-2">
            <CircularProgress
              percentage={stats?.percentage || 0}
              size={190}
              strokeWidth={14}
              sublabel="Cumulative Rate"
            />
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80 w-full grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-xl bg-slate-950/60">
              <span className="text-slate-400 text-[11px] block">Attended</span>
              <span className="text-emerald-400 font-bold text-base">{stats?.attendedClasses || 0}</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/60">
              <span className="text-slate-400 text-[11px] block">Missed</span>
              <span className="text-rose-400 font-bold text-base">{stats?.missedClasses || 0}</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/60">
              <span className="text-slate-400 text-[11px] block">Total</span>
              <span className="text-white font-bold text-base">{stats?.totalClasses || 0}</span>
            </div>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Lectures</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-white">{stats?.totalClasses || 0}</span>
              <p className="text-xs text-slate-400 mt-1">Conducted across 4 subjects</p>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Current Academic Term 2024-2025</span>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Present & Verified</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-emerald-400">{stats?.attendedClasses || 0}</span>
              <p className="text-xs text-slate-400 mt-1">Successfully recorded via Dynamic QR</p>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-emerald-400/90 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% cryptographic validation</span>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Classes Missed</span>
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <XCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-rose-400">{stats?.missedClasses || 0}</span>
              <p className="text-xs text-slate-400 mt-1">Absences recorded</p>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Impacts exam hall-ticket eligibility</span>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Exam Status</span>
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className={`text-2xl font-extrabold ${stats?.percentage && stats.percentage >= 75 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {stats?.percentage && stats.percentage >= 75 ? 'Eligible' : 'At Risk'}
              </span>
              <p className="text-xs text-slate-400 mt-1">
                {stats?.percentage && stats.percentage >= 75 ? 'Allowed for Final Exams' : 'Requires Medical / Dean Exemption'}
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Required: 75%</span>
              <span className="font-semibold text-slate-200">Current: {stats?.percentage}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subject-Wise Attendance Breakdown */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Subject-Wise Attendance Breakdown</h2>
            <p className="text-xs text-slate-400">Course-level tracking with 75% compliance indicator</p>
          </div>
          <button
            onClick={onNavigateShortages}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
          >
            <span>Detailed Calculation</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats?.subjectStats.map((sub) => {
            const isShortage = sub.percentage < 75;
            const progressColor = isShortage ? 'bg-rose-500' : sub.percentage < 85 ? 'bg-amber-500' : 'bg-emerald-500';

            return (
              <div
                key={sub.subjectId}
                className={`p-4 rounded-xl border transition-all ${
                  isShortage
                    ? 'bg-rose-950/20 border-rose-500/30'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {sub.subjectCode}
                      </span>
                      <h4 className="text-sm font-semibold text-white truncate max-w-[200px]">
                        {sub.subjectName}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Instructor: {sub.facultyName}</p>
                  </div>

                  <div className="text-right">
                    <span className={`text-lg font-extrabold ${isShortage ? 'text-rose-400' : 'text-slate-100'}`}>
                      {sub.percentage}%
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      {sub.attended}/{sub.total} classes
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3 w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${progressColor}`}
                    style={{ width: `${Math.min(100, sub.percentage)}%` }}
                  />
                </div>

                {/* Shortage Recovery Tip */}
                <div className="mt-2.5 flex items-center justify-between text-[11px]">
                  {isShortage ? (
                    <span className="text-rose-400 font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Need {sub.classesNeededFor75} consecutive class{sub.classesNeededFor75 > 1 ? 'es' : ''} for 75%
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Eligible for semester exams
                    </span>
                  )}
                  <span className="text-slate-400">Target: 75%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Attendance Activity & Test Profile Switcher */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Activity Table */}
        <div className="lg:col-span-8 rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Recent Attendance Logs</h2>
            <button
              onClick={onNavigateHistory}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              <span>View All History</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium">
                  <th className="pb-3">Subject</th>
                  <th className="pb-3">Date & Time</th>
                  <th className="pb-3">Method</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentRecords.length > 0 ? (
                  recentRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3">
                        <span className="font-semibold text-white block">{r.subjectCode}</span>
                        <span className="text-[10px] text-slate-400">LH-101</span>
                      </td>
                      <td className="py-3 text-slate-300">
                        {new Date(r.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })} at{' '}
                        {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 border border-slate-700">
                          <QrCode className="w-2.5 h-2.5 text-cyan-400" />
                          {r.verificationMethod}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3 h-3" />
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      No attendance records found yet. Scan an active QR code to record attendance.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Student Accounts & New Registration Card */}
        <div className="lg:col-span-4 rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-lg space-y-4">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white">Student Profile Control</h2>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Registered students in the database. You can register new student accounts or switch between existing profiles.
          </p>

          <div className="space-y-2">
            {otherStudents.length > 0 ? (
              otherStudents.map((s) => (
                <button
                  key={s.id}
                  onClick={() => login(s.id)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-left transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <img src={s.avatar} alt={s.name} className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-700" />
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block">{s.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{s.studentId}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                    Switch
                  </span>
                </button>
              ))
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center text-xs text-slate-400">
                You are currently viewing the active registered student profile.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
