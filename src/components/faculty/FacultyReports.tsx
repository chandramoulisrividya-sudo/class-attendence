import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/apiClient.js';
import { Subject, AttendanceSession, AttendanceRecord, User } from '../../types/index.js';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  BookOpen,
  Filter,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const FacultyReports: React.FC = () => {
  const { currentUser } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const facultyId = currentUser?.id || 'fac-1';

  useEffect(() => {
    async function loadReportsData() {
      try {
        setLoading(true);
        const [subsRes, sessRes, stdsRes] = await Promise.all([
          api.getSubjects({ facultyId }),
          api.getSessions({ facultyId }),
          api.getAdminStudents(),
        ]);
        setSubjects(subsRes.subjects);
        setSessions(sessRes.sessions);
        setStudents(stdsRes.students);
        if (subsRes.subjects.length > 0) {
          setSelectedSubjectId(subsRes.subjects[0].id);
        }
      } catch (err) {
        console.error('Failed to load faculty reports:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReportsData();
  }, [facultyId]);

  const activeSubject = subjects.find((s) => s.id === selectedSubjectId);
  const subjectSessions = sessions.filter((s) => s.subjectId === selectedSubjectId);

  const handleExportCSV = () => {
    if (!activeSubject) return;
    const headers = ['Roll Number', 'Student Name', 'Total Sessions', 'Attended', 'Attendance %', 'Exam Status'];
    const rows = students.map((std) => [
      `"${std.studentId}"`,
      `"${std.name}"`,
      activeSubject.totalClassesScheduled || 26,
      std.attendedClasses || 20,
      `${std.attendancePercentage || 85}%`,
      std.attendancePercentage >= 75 ? 'ELIGIBLE' : 'SHORTAGE (<75%)',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SmartAttend_Report_${activeSubject.code}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <FileSpreadsheet className="w-6 h-6 text-cyan-400" />
            <span>Course Attendance Analytics & Reports</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Export academic reports and official attendance registers for administrative submission.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Download CSV</span>
          </button>
          <button
            onClick={handlePrintPDF}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-semibold text-xs shadow-md shadow-indigo-500/20"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Register (PDF)</span>
          </button>
        </div>
      </div>

      {/* Subject Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex items-center gap-4">
        <label className="text-xs font-semibold text-slate-300">Select Course:</label>
        <select
          value={selectedSubjectId}
          onChange={(e) => setSelectedSubjectId(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
        >
          {subjects.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.code} - {sub.name}
            </option>
          ))}
        </select>
      </div>

      {/* Report Summary Card */}
      {activeSubject && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-lg space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {activeSubject.code}
                </span>
                <h3 className="text-lg font-bold text-white">{activeSubject.name}</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Semester {activeSubject.semester} • Total Classes Conducted: <strong className="text-white">{activeSubject.totalClassesScheduled}</strong>
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div>
                <span className="text-[11px] uppercase font-bold text-slate-400 block">Total Students</span>
                <span className="text-2xl font-black text-white">{students.length}</span>
              </div>
              <div>
                <span className="text-[11px] uppercase font-bold text-slate-400 block">Shortage (&lt;75%)</span>
                <span className="text-2xl font-black text-rose-400">
                  {students.filter((s) => s.attendancePercentage < 75).length}
                </span>
              </div>
            </div>
          </div>

          {/* Student Roster Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 font-medium">
                <tr>
                  <th className="pb-3">Roll Number</th>
                  <th className="pb-3">Student Name</th>
                  <th className="pb-3">Classes Attended</th>
                  <th className="pb-3">Total Classes</th>
                  <th className="pb-3">Attendance %</th>
                  <th className="pb-3 text-right">Hall Ticket Eligibility</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {students.map((std) => {
                  const isShortage = std.attendancePercentage < 75;
                  return (
                    <tr key={std.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 font-mono text-slate-300">{std.studentId}</td>
                      <td className="py-3.5 font-semibold text-white">{std.name}</td>
                      <td className="py-3.5 text-slate-300">{std.attendedClasses || 22}</td>
                      <td className="py-3.5 text-slate-400">{activeSubject.totalClassesScheduled || 26}</td>
                      <td className="py-3.5">
                        <span className={`font-black text-sm ${isShortage ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {std.attendancePercentage}%
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            isShortage
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}
                        >
                          {isShortage ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                          {isShortage ? 'Shortage Warning' : 'Eligible for Exams'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
