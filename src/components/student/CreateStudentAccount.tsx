import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import {
  GraduationCap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  BookOpen,
  User,
  Mail,
  QrCode,
} from 'lucide-react';

interface CreateStudentAccountProps {
  onAccountCreated?: () => void;
}

export const CreateStudentAccount: React.FC<CreateStudentAccountProps> = ({
  onAccountCreated,
}) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [departmentId, setDepartmentId] = useState('dept-cse');
  const [semester, setSemester] = useState('5');
  const [batch, setBatch] = useState('2024-2028');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !studentId.trim()) {
      setError('Please provide your name, college email, and student roll number.');
      return;
    }

    setSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        studentId: studentId.trim().toUpperCase(),
        departmentId,
        semester: Number(semester),
        batch,
      });
      if (onAccountCreated) {
        onAccountCreated();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create student account');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick preset button for instant 1-click test fill
  const handleQuickFill = (presetName: string, presetRoll: string, presetEmail: string) => {
    setName(presetName);
    setStudentId(presetRoll);
    setEmail(presetEmail);
  };

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6 animate-in fade-in duration-300">
      {/* Welcome Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-slate-800 p-8 shadow-2xl text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto shadow-inner">
          <GraduationCap className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight text-white">
            Create Your Student Account
          </h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            All previous student data has been cleared. Register your student profile to access dynamic QR attendance and curriculum tracking.
          </p>
        </div>

        {/* Ambient glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Main Registration Card */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 md:p-8 shadow-xl space-y-6">
        {/* Quick Demo Pre-fill Pills */}
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Instant Demo Fill (Click to populate):</span>
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('Jordan Taylor', 'CS2024001', 'jordan.taylor@smartattend.edu')}
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
            >
              Jordan Taylor (CS2024001)
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('Maya Lin', 'CS2024042', 'maya.lin@smartattend.edu')}
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
            >
              Maya Lin (CS2024042)
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('Aryan Khan', 'CS2024088', 'aryan.khan@smartattend.edu')}
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
            >
              Aryan Khan (CS2024088)
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Full Student Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. Jordan Taylor"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Roll / Student ID</label>
              <input
                type="text"
                placeholder="e.g. CS2024001"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono uppercase placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">College Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                placeholder="student@smartattend.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Department</label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="dept-cse">Computer Science & Engineering (CSE)</option>
                <option value="dept-ece">Electronics & Communication (ECE)</option>
                <option value="dept-it">Information Technology (IT)</option>
                <option value="dept-me">Mechanical Engineering (ME)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Semester & Year</label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s} (Year {Math.ceil(s / 2)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>{submitting ? 'Creating Student Profile...' : 'Create Account & Open Student Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-400 text-[11px]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Automatic course enrollment based on semester</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Cryptographic single-attendance validation</span>
          </div>
        </div>
      </div>
    </div>
  );
};
