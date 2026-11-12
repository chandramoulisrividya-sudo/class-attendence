import React, { useState, useEffect } from 'react';
import { api } from '../../services/apiClient.js';
import { User, StudentStats, AuditLog } from '../../types/index.js';
import {
  Sliders,
  Users,
  GraduationCap,
  Building2,
  Radio,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Download,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigateStudents: () => void;
  onNavigateShortages: () => void;
  onNavigateAudit: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateStudents,
  onNavigateShortages,
  onNavigateAudit,
}) => {
  const [stats, setStats] = useState<{
    totalStudents: number;
    totalFaculty: number;
    totalDepartments: number;
    activeSessions: number;
    overallAttendancePercentage: number;
    shortageStudentsCount: number;
    shortageStudents: { student: User; summary: StudentStats }[];
    departmentStats: {
      departmentId: string;
      departmentCode: string;
      departmentName: string;
      studentCount: number;
      averageAttendance: number;
    }[];
    recentAuditLogs: AuditLog[];
  } | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const res = await api.getAdminStats();
        setStats(res);
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Executive Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-slate-800 p-6 md:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold">
            <Sliders className="w-3.5 h-3.5 text-purple-400" />
            <span>Campus Executive Dashboard • Dean of Academic Affairs</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            SmartAttend University Administration
          </h1>
          <p className="text-slate-400 text-sm max-w-xl">
            Real-time campus-wide attendance telemetry, anti-proxy verification metrics, and department compliance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateShortages}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-lg shadow-rose-600/20 transition-all"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>{stats.shortageStudentsCount} Shortage Cases</span>
          </button>
        </div>
      </div>

      {/* 5 High-Impact Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Enrolled Students</span>
            <GraduationCap className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-white">{stats.totalStudents}</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Active roll accounts</span>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Faculty Members</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-white">{stats.totalFaculty}</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Instructors & Professors</span>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Departments</span>
            <Building2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-white">{stats.totalDepartments}</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">CSE, ECE, IT, ME</span>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active QR Sessions</span>
            <Radio className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-emerald-400">{stats.activeSessions}</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Broadcasting right now</span>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">College Average</span>
            <TrendingUp className="w-4 h-4 text-teal-400" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-teal-300">{stats.overallAttendancePercentage}%</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Institutional Turnout</span>
          </div>
        </div>
      </div>

      {/* Department-Wise Attendance Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Department-Wise Attendance Performance</h3>
              <p className="text-xs text-slate-400">Average turnout by academic branch</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Benchmark: 75%
            </span>
          </div>

          <div className="space-y-4 pt-2">
            {stats.departmentStats.map((dept) => {
              const color = dept.averageAttendance >= 80 ? 'bg-emerald-500' : 'bg-amber-500';
              return (
                <div key={dept.departmentId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">
                      {dept.departmentName} ({dept.departmentCode})
                    </span>
                    <span className="font-mono font-bold text-slate-200">
                      {dept.averageAttendance}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${color}`}
                      style={{ width: `${dept.averageAttendance}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Shortage Risk Quick Center */}
        <div className="lg:col-span-5 rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-lg space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <h3 className="text-base font-bold text-white">High Shortage Alerts</h3>
              </div>
              <button
                onClick={onNavigateShortages}
                className="text-xs text-rose-400 hover:text-rose-300 font-medium"
              >
                View All
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1">Students with attendance deficit below 75% threshold</p>

            <div className="mt-4 space-y-2.5">
              {stats.shortageStudents.slice(0, 4).map(({ student, summary }) => (
                <div
                  key={student.id}
                  className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 flex items-center justify-between"
                >
                  <div>
                    <span className="font-semibold text-xs text-white block">{student.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {student.studentId} • {student.departmentName}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-rose-400">{summary.percentage}%</span>
                    <span className="block text-[10px] text-rose-300/80">
                      {summary.shortageCount} course{summary.shortageCount > 1 ? 's' : ''} short
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onNavigateShortages}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center justify-center gap-2 transition-colors mt-4"
          >
            <span>Generate Official Shortage Notices</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Real-Time Security Audit Log Preview */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-base font-bold text-white">System Security & Audit Trail</h3>
              <p className="text-xs text-slate-400">Immutable ledger of session creation, QR token validation, and manual overrides</p>
            </div>
          </div>
          <button
            onClick={onNavigateAudit}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
          >
            <span>Full Audit Trail</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400 font-medium">
              <tr>
                <th className="pb-3">Time</th>
                <th className="pb-3">Actor</th>
                <th className="pb-3">Action Type</th>
                <th className="pb-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {stats.recentAuditLogs.slice(0, 6).map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 text-slate-400 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="py-3 font-semibold text-white">
                    {log.actorName} <span className="text-[10px] text-slate-400 font-normal">({log.actorRole})</span>
                  </td>
                  <td className="py-3">
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 text-slate-300 max-w-md truncate">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
