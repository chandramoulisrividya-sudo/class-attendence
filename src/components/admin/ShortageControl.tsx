import React, { useState, useEffect } from 'react';
import { api } from '../../services/apiClient.js';
import { User, StudentStats } from '../../types/index.js';
import {
  AlertTriangle,
  Download,
  Printer,
  Mail,
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  FileText,
} from 'lucide-react';

export const ShortageControl: React.FC = () => {
  const [shortageItems, setShortageItems] = useState<{ student: User; summary: StudentStats }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterThreshold, setFilterThreshold] = useState<number>(75);
  const [selectedNoticeStudent, setSelectedNoticeStudent] = useState<{ student: User; summary: StudentStats } | null>(null);

  useEffect(() => {
    async function loadShortages() {
      try {
        setLoading(true);
        const res = await api.getAdminStats();
        setShortageItems(res.shortageStudents || []);
      } catch (err) {
        console.error('Failed to load shortages:', err);
      } finally {
        setLoading(false);
      }
    }
    loadShortages();
  }, []);

  const filtered = shortageItems.filter((item) => item.summary.percentage < filterThreshold);

  const exportShortageCSV = () => {
    const headers = ['Student ID', 'Student Name', 'Department', 'Semester', 'Overall Attendance %', 'Shortage Subjects Count'];
    const rows = filtered.map(({ student, summary }) => [
      `"${student.studentId}"`,
      `"${student.name}"`,
      `"${student.departmentName}"`,
      student.semester,
      `${summary.percentage}%`,
      summary.shortageCount,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SmartAttend_Critical_Shortage_List_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <AlertTriangle className="w-6 h-6 text-rose-400" />
            <span>Attendance Shortage Control & Notice Center</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated compliance enforcement for students below the mandatory 75% university eligibility threshold.
          </p>
        </div>

        <button
          onClick={exportShortageCSV}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md shadow-rose-600/20 transition-all self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export Shortage Register (CSV)</span>
        </button>
      </div>

      {/* Threshold Selector Filter */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex items-center gap-4">
        <span className="text-xs font-semibold text-slate-300">Filter Severity Threshold:</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterThreshold(75)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterThreshold === 75
                ? 'bg-rose-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Below 75% (Mandatory Council Cutoff)
          </button>
          <button
            onClick={() => setFilterThreshold(65)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterThreshold === 65
                ? 'bg-rose-700 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Below 65% (Critical Condonation Barred)
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold">
              <tr>
                <th className="py-3.5 px-6">Roll Number</th>
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-4">Department & Sem</th>
                <th className="py-3.5 px-4">Cumulative Attendance</th>
                <th className="py-3.5 px-4">Shortage Courses</th>
                <th className="py-3.5 px-6 text-right">Official Notice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length > 0 ? (
                filtered.map(({ student, summary }) => (
                  <tr key={student.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-slate-200">
                      {student.studentId}
                    </td>
                    <td className="py-4 px-4 font-semibold text-white">
                      {student.name}
                      <span className="block text-[11px] text-slate-400 font-normal">{student.email}</span>
                    </td>
                    <td className="py-4 px-4 text-slate-300">
                      {student.departmentName} (Sem {student.semester})
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-black text-sm text-rose-400">{summary.percentage}%</span>
                      <span className="block text-[10px] text-slate-400">{summary.attendedClasses}/{summary.totalClasses} classes</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 font-semibold text-[11px]">
                        {summary.shortageCount} course{summary.shortageCount > 1 ? 's' : ''} affected
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setSelectedNoticeStudent({ student, summary })}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-medium border border-rose-500/30 flex items-center gap-1.5 ml-auto transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Preview Notice</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    <span>No students found below the {filterThreshold}% threshold in this cohort.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Notice Preview Modal */}
      {selectedNoticeStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-xl rounded-2xl bg-white text-slate-900 shadow-2xl p-8 space-y-6">
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                  SmartAttend Office of Academic Dean
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  OFFICIAL ATTENDANCE SHORTAGE ADVISORY
                </h3>
              </div>
              <button
                onClick={() => setSelectedNoticeStudent(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <p>
                <strong>Date:</strong> {new Date().toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
              <p>
                <strong>Student Name:</strong> {selectedNoticeStudent.student.name} &nbsp;|&nbsp; <strong>Roll Number:</strong> {selectedNoticeStudent.student.studentId}
              </p>
              <p>
                <strong>Department:</strong> {selectedNoticeStudent.student.departmentName} (Semester {selectedNoticeStudent.student.semester})
              </p>

              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
                <span className="font-bold block">Current Cumulative Attendance: {selectedNoticeStudent.summary.percentage}%</span>
                <span>Minimum Required: 75.00%</span>
              </div>

              <p>
                This notice formally alerts you that your logged attendance records (captured via campus Dynamic QR sessions)
                reflect a deficit below university statutory requirements. Failure to regularize your attendance will result
                in withholding of the Semester Examination Hall Ticket.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setSelectedNoticeStudent(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
              >
                <Printer className="w-4 h-4" />
                <span>Print Notice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
