import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/apiClient.js';
import { AttendanceSession, AttendanceRecord, User } from '../../types/index.js';
import {
  FileCheck2,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Search,
} from 'lucide-react';

interface ManualReviewModalProps {
  session: AttendanceSession;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export const ManualReviewModal: React.FC<ManualReviewModalProps> = ({
  session,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const { currentUser } = useAuth();
  const [attendees, setAttendees] = useState<AttendanceRecord[]>([]);
  const [allStudents, setAllStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [overrideStatus, setOverrideStatus] = useState<AttendanceRecord['status']>('PRESENT');
  const [overrideReason, setOverrideReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, session.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sessionRes, studentsRes] = await Promise.all([
        api.getSession(session.id),
        api.getAdminStudents(),
      ]);
      setAttendees(sessionRes.attendees);
      setAllStudents(studentsRes.students);
    } catch (err) {
      console.error('Failed to load session review data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOverride = async (studentId: string) => {
    if (!overrideReason.trim()) {
      alert('An audit explanation reason is required for manual attendance corrections.');
      return;
    }

    setSubmitting(true);
    try {
      await api.overrideAttendance({
        sessionId: session.id,
        studentId,
        status: overrideStatus,
        notes: overrideReason,
        facultyId: currentUser?.id || session.facultyId,
      });

      setEditingStudentId(null);
      setOverrideReason('');
      await loadData();
      onUpdated();
    } catch (err: any) {
      alert(err.message || 'Failed to update attendance');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Merge enrolled students with attendance records
  const studentRows = allStudents.map((std) => {
    const record = attendees.find((a) => a.studentId === std.id);
    return {
      student: std,
      record,
      status: record ? record.status : 'ABSENT',
      timestamp: record ? record.timestamp : null,
      method: record ? record.verificationMethod : 'UNMARKED',
      isFlagged: record?.isFlaggedProxy,
    };
  });

  const filtered = studentRows.filter(
    (row) =>
      row.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (row.student.studentId && row.student.studentId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Manual Attendance Review & Audit Correction</h3>
              <p className="text-xs text-slate-400">
                {session.subjectCode} • {session.classroomName} • Every manual edit is logged in the immutable audit trail
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student by name or roll number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Content Table */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 font-semibold">
                <tr>
                  <th className="pb-3">Student Name</th>
                  <th className="pb-3">Roll Number</th>
                  <th className="pb-3">Scan Time</th>
                  <th className="pb-3">Verification</th>
                  <th className="pb-3">Current Status</th>
                  <th className="pb-3 text-right">Faculty Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map(({ student, record, status, timestamp, method, isFlagged }) => (
                  <React.Fragment key={student.id}>
                    <tr className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5">
                        <span className="font-semibold text-white block">{student.name}</span>
                        <span className="text-[10px] text-slate-400">{student.email}</span>
                      </td>
                      <td className="py-3.5 font-mono text-slate-300">{student.studentId}</td>
                      <td className="py-3.5 text-slate-400 font-mono">
                        {timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="py-3.5">
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-300">
                          {isFlagged ? (
                            <span className="text-rose-400 flex items-center gap-1 font-semibold" title={record?.proxyReason}>
                              <AlertTriangle className="w-3.5 h-3.5" /> Flagged
                            </span>
                          ) : (
                            <span className="text-slate-400">{method}</span>
                          )}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            status === 'PRESENT'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : status === 'LATE'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : status === 'EXCUSED'
                              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => {
                            setEditingStudentId(editingStudentId === student.id ? null : student.id);
                            setOverrideStatus(status as any);
                            setOverrideReason(record?.notes || '');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700"
                        >
                          {editingStudentId === student.id ? 'Cancel' : 'Change Status'}
                        </button>
                      </td>
                    </tr>

                    {/* Inline Correction Form */}
                    {editingStudentId === student.id && (
                      <tr className="bg-slate-950/70 border-b border-indigo-500/30">
                        <td colSpan={6} className="p-4">
                          <div className="space-y-3 max-w-2xl">
                            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                              Manual Override for {student.name} ({student.studentId})
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[11px] text-slate-400 mb-1">New Status</label>
                                <select
                                  value={overrideStatus}
                                  onChange={(e) => setOverrideStatus(e.target.value as any)}
                                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                                >
                                  <option value="PRESENT">Present</option>
                                  <option value="LATE">Late</option>
                                  <option value="EXCUSED">Excused (Medical / Official)</option>
                                  <option value="ABSENT">Absent</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[11px] text-slate-400 mb-1">Audit Justification (Required)</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Device camera malfunction verified in person"
                                  value={overrideReason}
                                  onChange={(e) => setOverrideReason(e.target.value)}
                                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                                  required
                                />
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-1">
                              <button
                                onClick={() => setEditingStudentId(null)}
                                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveOverride(student.id)}
                                disabled={submitting}
                                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md shadow-cyan-600/20"
                              >
                                {submitting ? 'Updating...' : 'Save & Record in Audit Log'}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
