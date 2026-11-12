import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/apiClient.js';
import { AttendanceSession, Subject, Classroom } from '../../types/index.js';
import {
  Radio,
  Plus,
  Play,
  FileSpreadsheet,
  FileCheck2,
  BookOpen,
  Building2,
  Clock,
  Users,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Sparkles,
  X,
} from 'lucide-react';

interface FacultyDashboardProps {
  onStartSession: (session: AttendanceSession) => void;
  onOpenLiveSession: (session: AttendanceSession) => void;
  onOpenManualReview: (session: AttendanceSession) => void;
  onNavigateReports: () => void;
}

export const FacultyDashboard: React.FC<FacultyDashboardProps> = ({
  onStartSession,
  onOpenLiveSession,
  onOpenManualReview,
  onNavigateReports,
}) => {
  const { currentUser } = useAuth();
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);

  // New session modal state
  const [showNewModal, setShowNewModal] = useState(false);
  const [newSubjectId, setNewSubjectId] = useState('');
  const [newClassroomId, setNewClassroomId] = useState('');
  const [newSessionType, setNewSessionType] = useState('Lecture');
  const [newTopic, setNewTopic] = useState('');
  const [newDuration, setNewDuration] = useState('45');
  const [isCreating, setIsCreating] = useState(false);

  const facultyId = currentUser?.id || 'fac-1';

  const loadFacultyData = async () => {
    try {
      setLoading(true);
      const [sessionsRes, subjectsRes, classroomsRes] = await Promise.all([
        api.getSessions({ facultyId }),
        api.getSubjects({ facultyId }),
        api.getClassrooms(),
      ]);
      setSessions(sessionsRes.sessions);
      setSubjects(subjectsRes.subjects);
      setClassrooms(classroomsRes.classrooms);

      if (subjectsRes.subjects.length > 0) {
        setNewSubjectId(subjectsRes.subjects[0].id);
      }
      if (classroomsRes.classrooms.length > 0) {
        setNewClassroomId(classroomsRes.classrooms[0].id);
      }
    } catch (err) {
      console.error('Failed to load faculty dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFacultyData();
  }, [facultyId]);

  const activeSession = sessions.find((s) => s.status === 'active');
  const pastSessions = sessions.filter((s) => s.status !== 'active');

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectId || !newClassroomId) return;

    setIsCreating(true);
    try {
      const res = await api.createSession({
        subjectId: newSubjectId,
        classroomId: newClassroomId,
        facultyId,
        sessionType: newSessionType,
        topic: newTopic || 'Regular Curriculum Lecture',
        durationMinutes: Number(newDuration) || 45,
      });

      setShowNewModal(false);
      setNewTopic('');
      await loadFacultyData();
      onStartSession(res.session);
    } catch (err: any) {
      alert(err.message || 'Failed to start attendance session');
    } finally {
      setIsCreating(false);
    }
  };

  // Stats
  const totalClasses = sessions.length;
  const totalPresentSum = sessions.reduce((sum, s) => sum + (s.totalPresent || 0), 0);
  const totalEnrolledSum = sessions.reduce((sum, s) => sum + (s.totalEnrolled || 1), 0);
  const avgAttendance = totalEnrolledSum > 0 ? Math.round((totalPresentSum / totalEnrolledSum) * 100) : 85;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-slate-800 p-6 md:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>Faculty Command Center • {currentUser?.designation || 'Professor'}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Welcome, {currentUser?.name}
          </h1>
          <p className="text-slate-400 text-sm max-w-xl">
            {currentUser?.departmentName || 'Computer Science & Engineering'} • Launch dynamic, anti-proxy QR codes on classroom projectors.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-semibold text-sm shadow-lg shadow-cyan-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 self-start md:self-auto"
        >
          <Plus className="w-5 h-5" />
          <span>Start Attendance Session</span>
        </button>
      </div>

      {/* Active Session Highlight Banner (if any is active) */}
      {activeSession ? (
        <div className="rounded-2xl bg-gradient-to-r from-emerald-950/50 via-slate-900 to-indigo-950/40 border-2 border-emerald-500/40 p-6 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Active Session In Progress
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {activeSession.classroomName}
              </span>
            </div>
            <h3 className="text-xl font-bold text-white">
              {activeSession.subjectCode}: {activeSession.subjectName}
            </h3>
            <p className="text-xs text-slate-300">
              Topic: <strong className="text-white">{activeSession.topic}</strong> • Total Present: <strong className="text-emerald-400">{activeSession.totalPresent || 0}</strong> / {activeSession.totalEnrolled} enrolled
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onOpenLiveSession(activeSession)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all"
            >
              <Radio className="w-4 h-4" />
              <span>Open Dynamic QR Projector</span>
            </button>
            <button
              onClick={() => onOpenManualReview(activeSession)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-colors"
            >
              <FileCheck2 className="w-4 h-4 text-cyan-400" />
              <span>Review Attendees</span>
            </button>
          </div>
        </div>
      ) : null}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Assigned Subjects</span>
            <span className="text-3xl font-extrabold text-white block mt-1">{subjects.length}</span>
            <span className="text-[11px] text-slate-400 mt-1 block">Active curriculum courses</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sessions Conducted</span>
            <span className="text-3xl font-extrabold text-white block mt-1">{totalClasses}</span>
            <span className="text-[11px] text-slate-400 mt-1 block">Lectures with Dynamic QR</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Radio className="w-6 h-6" />
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Turnout</span>
            <span className="text-3xl font-extrabold text-emerald-400 block mt-1">{avgAttendance}%</span>
            <span className="text-[11px] text-slate-400 mt-1 block">Verified attendance rate</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Assigned Subjects Grid */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Your Assigned Courses</h3>
            <p className="text-xs text-slate-400">Select any course to quickly generate a dynamic attendance session</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjects.map((sub) => (
            <div
              key={sub.id}
              className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {sub.code}
                  </span>
                  <h4 className="text-base font-bold text-white mt-2">{sub.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Semester {sub.semester} • {sub.credits} Credits</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {sub.totalClassesScheduled} lectures logged
                </span>
                <button
                  onClick={() => {
                    setNewSubjectId(sub.id);
                    setShowNewModal(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Start QR</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Past Sessions Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Attendance Sessions History</h3>
            <p className="text-xs text-slate-400">Past lectures and verified student records</p>
          </div>
          <button
            onClick={onNavigateReports}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Detailed Reports & Export</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400 font-medium">
              <tr>
                <th className="pb-3">Subject</th>
                <th className="pb-3">Classroom</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">Turnout</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {pastSessions.map((sess) => (
                <tr key={sess.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5">
                    <span className="font-semibold text-white block">{sess.subjectCode}</span>
                    <span className="text-[10px] text-slate-400">{sess.topic}</span>
                  </td>
                  <td className="py-3.5 text-slate-300 font-medium">{sess.classroomName}</td>
                  <td className="py-3.5 text-slate-400">
                    {new Date(sess.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })} at{' '}
                    {new Date(sess.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3.5">
                    <span className="font-bold text-emerald-400">{sess.totalPresent || 0}</span>
                    <span className="text-slate-400"> / {sess.totalEnrolled} present</span>
                  </td>
                  <td className="py-3.5 text-right">
                    <button
                      onClick={() => onOpenManualReview(sess)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700"
                    >
                      Audit / Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Start New Session Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Radio className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">Start Attendance Session</h3>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Subject</label>
                <select
                  value={newSubjectId}
                  onChange={(e) => setNewSubjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Classroom / Venue</label>
                <select
                  value={newClassroomId}
                  onChange={(e) => setNewClassroomId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                >
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Cap: {c.capacity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Session Type</label>
                  <select
                    value={newSessionType}
                    onChange={(e) => setNewSessionType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Lecture">Lecture</option>
                    <option value="Lab">Practical Lab</option>
                    <option value="Tutorial">Tutorial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Duration</label>
                  <select
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="15">15 Minutes</option>
                    <option value="30">30 Minutes</option>
                    <option value="45">45 Minutes</option>
                    <option value="60">60 Minutes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Topic / Syllabus Module</label>
                <input
                  type="text"
                  placeholder="e.g. Distributed Database Transactions"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-semibold text-xs shadow-md shadow-indigo-500/20"
                >
                  {isCreating ? 'Initializing...' : 'Launch Dynamic QR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
