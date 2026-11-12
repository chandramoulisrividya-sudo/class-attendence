import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Header } from './components/layout/Header.js';
import { Sidebar, NavigationTab } from './components/layout/Sidebar.js';
import { LandingPage } from './components/landing/LandingPage.js';
import { AuthModal } from './components/auth/AuthModal.js';
import { CreateStudentAccount } from './components/student/CreateStudentAccount.js';
import { StudentDashboard } from './components/student/StudentDashboard.js';
import { QRScannerModal } from './components/student/QRScannerModal.js';
import { AttendanceHistory } from './components/student/AttendanceHistory.js';
import { ShortageWarnings } from './components/student/ShortageWarnings.js';
import { FacultyDashboard } from './components/faculty/FacultyDashboard.js';
import { DynamicQRBroadcast } from './components/faculty/DynamicQRBroadcast.js';
import { ManualReviewModal } from './components/faculty/ManualReviewModal.js';
import { FacultyReports } from './components/faculty/FacultyReports.js';
import { AdminDashboard } from './components/admin/AdminDashboard.js';
import { StudentManagement } from './components/admin/StudentManagement.js';
import { FacultyManagement } from './components/admin/FacultyManagement.js';
import { SubjectManagement } from './components/admin/SubjectManagement.js';
import { ShortageControl } from './components/admin/ShortageControl.js';
import { AuditLogsViewer } from './components/admin/AuditLogsViewer.js';
import { AttendanceSession } from './types/index.js';
import { api } from './services/apiClient.js';

function MainApp() {
  const { currentUser, activeRole, isLoading } = useAuth();
  const [showLanding, setShowLanding] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [currentTab, setCurrentTab] = useState<NavigationTab>('student_dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);
  const [reviewSession, setReviewSession] = useState<AttendanceSession | null>(null);
  const [activeSessionCount, setActiveSessionCount] = useState(1);

  // Sync default tab when active role changes
  useEffect(() => {
    if (activeRole === 'student') {
      setCurrentTab('student_dashboard');
    } else if (activeRole === 'faculty') {
      setCurrentTab('faculty_dashboard');
    } else if (activeRole === 'admin') {
      setCurrentTab('admin_dashboard');
    }
  }, [activeRole]);

  // Load active session for faculty or student
  useEffect(() => {
    api.getSessions({ status: 'active' })
      .then((res) => {
        setActiveSessionCount(res.sessions.length);
        if (res.sessions.length > 0) {
          setActiveSession(res.sessions[0]);
        }
      })
      .catch(() => {});
  }, [currentUser, activeRole]);

  const handleResetDb = async () => {
    if (confirm('Reset demo database to fresh initial campus state?')) {
      await api.resetDatabase();
      window.location.reload();
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold tracking-wide text-slate-300">
            Initializing SmartAttend System...
          </p>
        </div>
      </div>
    );
  }

  // If explicitly viewing landing page
  if (showLanding) {
    return (
      <>
        <LandingPage
          onEnterDashboard={() => setShowLanding(false)}
          onOpenRegister={() => setShowRegisterModal(true)}
        />
        <AuthModal
          isOpen={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
          onSuccess={() => {
            setShowLanding(false);
            setCurrentTab('student_dashboard');
          }}
        />
      </>
    );
  }

  const role = currentUser?.role || activeRole;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Header
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        onOpenQRScanner={() => setIsScannerOpen(true)}
        activeSessionCount={activeSessionCount}
        onOpenRegisterModal={() => setShowRegisterModal(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Responsive Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            if (tab === 'student_scanner') {
              setIsScannerOpen(true);
            }
          }}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          onResetDb={handleResetDb}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {/* Quick Landing View Return Link */}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <button
              onClick={() => setShowLanding(true)}
              className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 font-medium self-start"
            >
              <span>← View Landing Page & Product Overview</span>
            </button>
            <span className="text-[11px] text-slate-400 font-mono self-start sm:self-auto">
              {currentUser ? (
                <>
                  Signed in as <strong className="text-slate-300">{currentUser.name}</strong> ({currentUser.role.toUpperCase()})
                </>
              ) : (
                <>
                  Portal: <strong className="text-indigo-400">Student Account Registration</strong>
                </>
              )}
            </span>
          </div>

          {/* STUDENT VIEWS */}
          {activeRole === 'student' && (
            currentUser ? (
              <>
                {currentTab === 'student_dashboard' && (
                  <StudentDashboard
                    onOpenScanner={() => setIsScannerOpen(true)}
                    onNavigateHistory={() => setCurrentTab('student_history')}
                    onNavigateShortages={() => setCurrentTab('student_shortages')}
                  />
                )}
                {currentTab === 'student_scanner' && (
                  <StudentDashboard
                    onOpenScanner={() => setIsScannerOpen(true)}
                    onNavigateHistory={() => setCurrentTab('student_history')}
                    onNavigateShortages={() => setCurrentTab('student_shortages')}
                  />
                )}
                {currentTab === 'student_history' && <AttendanceHistory />}
                {currentTab === 'student_shortages' && <ShortageWarnings />}
              </>
            ) : (
              <CreateStudentAccount onAccountCreated={() => setCurrentTab('student_dashboard')} />
            )
          )}

          {/* FACULTY VIEWS */}
          {activeRole === 'faculty' && (
            <>
              {currentTab === 'faculty_dashboard' && (
                <FacultyDashboard
                  onStartSession={(sess) => {
                    setActiveSession(sess);
                    setCurrentTab('faculty_qr_live');
                  }}
                  onOpenLiveSession={(sess) => {
                    setActiveSession(sess);
                    setCurrentTab('faculty_qr_live');
                  }}
                  onOpenManualReview={(sess) => setReviewSession(sess)}
                  onNavigateReports={() => setCurrentTab('faculty_reports')}
                />
              )}
              {currentTab === 'faculty_qr_live' && (
                activeSession ? (
                  <DynamicQRBroadcast
                    session={activeSession}
                    onCloseSession={async () => {
                      if (currentUser) {
                        await api.closeSession(activeSession.id, currentUser.id);
                      }
                      setActiveSession(null);
                      setCurrentTab('faculty_dashboard');
                    }}
                    onOpenManualReview={(sess) => setReviewSession(sess)}
                  />
                ) : (
                  <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
                    <p className="text-slate-300 text-sm">No dynamic attendance session is currently active.</p>
                    <button
                      onClick={() => setCurrentTab('faculty_dashboard')}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
                    >
                      Return to Faculty Dashboard & Start Session
                    </button>
                  </div>
                )
              )}
              {currentTab === 'faculty_review' && (
                <FacultyDashboard
                  onStartSession={(sess) => {
                    setActiveSession(sess);
                    setCurrentTab('faculty_qr_live');
                  }}
                  onOpenLiveSession={(sess) => {
                    setActiveSession(sess);
                    setCurrentTab('faculty_qr_live');
                  }}
                  onOpenManualReview={(sess) => setReviewSession(sess)}
                  onNavigateReports={() => setCurrentTab('faculty_reports')}
                />
              )}
              {currentTab === 'faculty_reports' && <FacultyReports />}
            </>
          )}

          {/* ADMIN VIEWS */}
          {activeRole === 'admin' && (
            <>
              {currentTab === 'admin_dashboard' && (
                <AdminDashboard
                  onNavigateStudents={() => setCurrentTab('admin_students')}
                  onNavigateShortages={() => setCurrentTab('admin_shortages')}
                  onNavigateAudit={() => setCurrentTab('admin_audit')}
                />
              )}
              {currentTab === 'admin_students' && <StudentManagement />}
              {currentTab === 'admin_faculty' && <FacultyManagement />}
              {currentTab === 'admin_subjects' && <SubjectManagement />}
              {currentTab === 'admin_shortages' && <ShortageControl />}
              {currentTab === 'admin_audit' && <AuditLogsViewer />}
            </>
          )}
        </main>
      </div>

      {/* Global QR Scanner Modal for Student */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSuccess={(_rec) => {}}
      />

      {/* Manual Review Modal for Faculty */}
      {reviewSession && (
        <ManualReviewModal
          session={reviewSession}
          isOpen={Boolean(reviewSession)}
          onClose={() => setReviewSession(null)}
          onUpdated={() => {}}
        />
      )}

      {/* Student Registration Modal */}
      <AuthModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSuccess={() => {
          setShowLanding(false);
          setCurrentTab('student_dashboard');
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
