import React from 'react';
import { useAuth } from '../../context/AuthContext.js';
import {
  LayoutDashboard,
  QrCode,
  History,
  AlertTriangle,
  Radio,
  FileCheck2,
  FileSpreadsheet,
  Users,
  GraduationCap,
  BookOpen,
  Building2,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export type NavigationTab =
  // Student
  | 'student_dashboard'
  | 'student_scanner'
  | 'student_history'
  | 'student_shortages'
  // Faculty
  | 'faculty_dashboard'
  | 'faculty_qr_live'
  | 'faculty_review'
  | 'faculty_reports'
  // Admin
  | 'admin_dashboard'
  | 'admin_students'
  | 'admin_faculty'
  | 'admin_subjects'
  | 'admin_shortages'
  | 'admin_audit';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onResetDb?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  onResetDb,
}) => {
  const { currentUser, switchRole } = useAuth();
  const role = currentUser?.role;

  const handleNav = (tab: NavigationTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const studentNavItems = [
    { id: 'student_dashboard' as NavigationTab, label: 'Overview', icon: LayoutDashboard },
    { id: 'student_scanner' as NavigationTab, label: 'Scan QR Attendance', icon: QrCode, highlight: true },
    { id: 'student_history' as NavigationTab, label: 'Attendance History', icon: History },
    { id: 'student_shortages' as NavigationTab, label: 'Shortage Warnings', icon: AlertTriangle },
  ];

  const facultyNavItems = [
    { id: 'faculty_dashboard' as NavigationTab, label: 'Classes & Overview', icon: LayoutDashboard },
    { id: 'faculty_qr_live' as NavigationTab, label: 'Dynamic QR Session', icon: Radio, highlight: true },
    { id: 'faculty_review' as NavigationTab, label: 'Attendance Review', icon: FileCheck2 },
    { id: 'faculty_reports' as NavigationTab, label: 'Attendance Reports', icon: FileSpreadsheet },
  ];

  const adminNavItems = [
    { id: 'admin_dashboard' as NavigationTab, label: 'Executive Overview', icon: LayoutDashboard },
    { id: 'admin_students' as NavigationTab, label: 'Student Directory', icon: GraduationCap },
    { id: 'admin_faculty' as NavigationTab, label: 'Faculty Directory', icon: Users },
    { id: 'admin_subjects' as NavigationTab, label: 'Subjects & Classrooms', icon: BookOpen },
    { id: 'admin_shortages' as NavigationTab, label: 'Shortage Control', icon: AlertTriangle },
    { id: 'admin_audit' as NavigationTab, label: 'Audit Log & Security', icon: ShieldCheck },
  ];

  let items = studentNavItems;
  if (role === 'faculty') items = facultyNavItems;
  if (role === 'admin') items = adminNavItems;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-900 border-r border-slate-800 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header inside sidebar */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-white text-sm shadow-md shadow-indigo-500/20">
              SA
            </div>
            <div>
              <span className="font-bold text-slate-100 text-sm">SmartAttend</span>
              <span className="block text-[10px] text-slate-400 font-medium capitalize">
                {role} Portal
              </span>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1 text-slate-400 hover:text-white"
            aria-label="Close navigation"
          >
            ✕
          </button>
        </div>

        {/* User Card Mini */}
        <div className="p-4 mx-3 my-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-3">
          <img
            src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
            alt={currentUser?.name}
            className="w-10 h-10 rounded-lg object-cover ring-1 ring-slate-700"
          />
          <div className="overflow-hidden">
            <h4 className="text-xs font-bold text-white truncate">{currentUser?.name}</h4>
            <p className="text-[11px] text-slate-400 truncate">
              {currentUser?.studentId || currentUser?.facultyId || currentUser?.adminRole}
            </p>
            <p className="text-[10px] text-indigo-400 truncate mt-0.5">
              {currentUser?.departmentName || 'Computer Science'}
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 px-3 py-2 overflow-y-auto">
          <div className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {role === 'student' ? 'Student Workspace' : role === 'faculty' ? 'Faculty Tools' : 'Campus Administration'}
          </div>

          {items.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/20 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                } ${item.highlight && !isActive ? 'border border-indigo-500/20 bg-indigo-500/5' : ''}`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.highlight ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.highlight && !isActive && (
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Security & System Info Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-2.5">
          <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-800/40 border border-slate-700/50 text-[11px] text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white block">Anti-Proxy Active</span>
              <span className="text-[10px] text-slate-400 leading-tight block">
                Dynamic 20s cryptographic token & geofence verification
              </span>
            </div>
          </div>

          {onResetDb && (
            <button
              onClick={onResetDb}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
              title="Reset data to initial demonstration state"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo Data</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
