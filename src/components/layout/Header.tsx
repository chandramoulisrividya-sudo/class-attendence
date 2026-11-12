import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import {
  QrCode,
  ShieldCheck,
  User as UserIcon,
  GraduationCap,
  Briefcase,
  Sliders,
  LogOut,
  Menu,
  ChevronDown,
  UserPlus,
  Sparkles,
} from 'lucide-react';
import { UserRole } from '../../types/index.js';

interface HeaderProps {
  onToggleMobileSidebar: () => void;
  onOpenQRScanner?: () => void;
  activeSessionCount?: number;
  onOpenRegisterModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileSidebar,
  onOpenQRScanner,
  activeSessionCount = 1,
  onOpenRegisterModal,
}) => {
  const { currentUser, activeRole, switchRole, logout, allTeachers, allStudents, login, switchTeacher } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);

  const getRoleBadge = (role?: UserRole) => {
    switch (role) {
      case 'student':
        return {
          icon: <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />,
          label: 'Student',
          classes: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
        };
      case 'faculty':
        return {
          icon: <Briefcase className="w-3.5 h-3.5 text-cyan-400" />,
          label: 'Faculty',
          classes: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
        };
      case 'admin':
        return {
          icon: <Sliders className="w-3.5 h-3.5 text-purple-400" />,
          label: 'Dean Admin',
          classes: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
        };
      default:
        return {
          icon: <UserIcon className="w-3.5 h-3.5 text-slate-400" />,
          label: 'New Account',
          classes: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
        };
    }
  };

  const badge = getRoleBadge(currentUser?.role || activeRole);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-slate-900/95 backdrop-blur px-4 sm:px-6">
      {/* Left side: Mobile Toggle & Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          aria-label="Toggle navigation menu"
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-white/10">
            <QrCode className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                SmartAttend
              </span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hidden sm:inline-block">
                Dynamic QR
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Campus Attendance Management</p>
          </div>
        </div>
      </div>

      {/* Center: Active Live Broadcast Indicator & Teacher Selector if Faculty */}
      <div className="hidden md:flex items-center gap-3">
        {activeRole === 'faculty' && allTeachers.length > 0 ? (
          <div className="relative">
            <button
              onClick={() => setShowTeacherDropdown(!showTeacherDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-cyan-500/30 hover:border-cyan-500/50 text-xs text-slate-200 transition-colors"
            >
              <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
              <span>Teacher: <strong className="text-white">{currentUser?.name || allTeachers[0].name}</strong></span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showTeacherDropdown && (
              <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 block">
                  Select Registered Teacher:
                </span>
                {allTeachers.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      switchTeacher(t.id);
                      setShowTeacherDropdown(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                      currentUser?.id === t.id
                        ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30'
                        : 'text-slate-300 hover:bg-slate-800/80'
                    }`}
                  >
                    <div>
                      <span className="block">{t.name}</span>
                      <span className="text-[10px] text-slate-400">{t.designation} • {t.departmentName?.split(' ')[0]}</span>
                    </div>
                    {currentUser?.id === t.id && (
                      <span className="text-[10px] font-bold text-cyan-400">Active</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300 font-medium">
              {activeSessionCount > 0 ? `${activeSessionCount} Active QR Session Online` : 'Campus Sessions Active'}
            </span>
          </div>
        )}
      </div>

      {/* Right side: Role Switcher & User Profile */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Role Switcher Tabs */}
        <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs font-medium">
          <button
            onClick={() => switchRole('student')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeRole === 'student'
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Student</span>
          </button>
          <button
            onClick={() => switchRole('faculty')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeRole === 'faculty'
                ? 'bg-cyan-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Faculty</span>
          </button>
          <button
            onClick={() => switchRole('admin')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeRole === 'admin'
                ? 'bg-purple-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        </div>

        {/* Student Scanner Action if student logged in */}
        {activeRole === 'student' && currentUser && onOpenQRScanner && (
          <button
            onClick={onOpenQRScanner}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-medium text-xs shadow-md shadow-indigo-500/20 transition-all active:scale-95"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Scan QR</span>
          </button>
        )}

        {/* User Account / Profile Menu */}
        {currentUser ? (
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors text-left"
              aria-expanded={showUserDropdown}
              aria-label="User profile options"
            >
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                alt={currentUser?.name || 'User Avatar'}
                className="w-8 h-8 rounded-lg object-cover ring-2 ring-slate-700"
              />
              <div className="hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-100 leading-tight">
                    {currentUser?.name}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className={`text-[10px] px-1.5 py-0.2 rounded border font-medium flex items-center gap-1 ${badge.classes}`}>
                    {badge.icon}
                    {badge.label}
                  </span>
                </div>
              </div>
            </button>

            {/* Dropdown Menu */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-2 border-b border-slate-800 mb-1">
                  <p className="text-xs font-semibold text-white">{currentUser?.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{currentUser?.email}</p>
                  <p className="text-[10px] text-indigo-400 mt-0.5 font-mono">
                    {currentUser?.studentId ? `Roll: ${currentUser.studentId}` : currentUser?.facultyId || currentUser?.adminRole}
                  </p>
                </div>

                {/* If multiple teachers registered, allow switching */}
                {currentUser?.role === 'faculty' && allTeachers.length > 1 && (
                  <div className="py-1 border-b border-slate-800 mb-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                      Switch Registered Teacher
                    </p>
                    {allTeachers.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          switchTeacher(t.id);
                          setShowUserDropdown(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                          currentUser?.id === t.id ? 'bg-slate-800 text-cyan-400 font-semibold' : 'text-slate-300 hover:bg-slate-800/60'
                        }`}
                      >
                        <span className="truncate">{t.name}</span>
                        {currentUser?.id === t.id && <span className="text-[10px] text-cyan-400">Current</span>}
                      </button>
                    ))}
                  </div>
                )}

                {/* If students exist, show switch */}
                {allStudents.length > 0 && (
                  <div className="py-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                      Registered Students ({allStudents.length})
                    </p>
                    {allStudents.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          login(s.id);
                          setShowUserDropdown(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                          currentUser?.id === s.id ? 'bg-slate-800 text-indigo-400 font-semibold' : 'text-slate-300 hover:bg-slate-800/60'
                        }`}
                      >
                        <span className="truncate">{s.name} ({s.studentId})</span>
                        {currentUser?.id === s.id && <span className="text-[10px] text-emerald-400">Active</span>}
                      </button>
                    ))}
                  </div>
                )}

                <div className="border-t border-slate-800 pt-1 mt-1">
                  <button
                    onClick={() => {
                      logout();
                      setShowUserDropdown(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          onOpenRegisterModal && (
            <button
              onClick={onOpenRegisterModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          )
        )}
      </div>
    </header>
  );
};
