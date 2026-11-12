import {
  User,
  Department,
  Subject,
  Classroom,
  AttendanceSession,
  AttendanceRecord,
  AuditLog,
  StudentStats,
} from '../types/index.js';

const API_BASE = '/api';

export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

export const api = {
  // Auth
  login: (credentials: { email?: string; role?: string; userId?: string }) =>
    fetchJson<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  registerStudent: (data: {
    name: string;
    email: string;
    studentId: string;
    departmentId: string;
    semester: number;
    batch?: string;
  }) =>
    fetchJson<{ message: string; user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getDemoUsers: () => fetchJson<{ users: User[] }>('/auth/users'),

  // Departments & Subjects
  getDepartments: () => fetchJson<{ departments: Department[] }>('/departments'),
  getSubjects: (params?: { facultyId?: string; departmentId?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return fetchJson<{ subjects: Subject[] }>(`/subjects${q ? `?${q}` : ''}`);
  },
  createSubject: (data: Partial<Subject>) =>
    fetchJson<{ subject: Subject }>('/subjects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Classrooms
  getClassrooms: () => fetchJson<{ classrooms: Classroom[] }>('/classrooms'),
  createClassroom: (data: Partial<Classroom>) =>
    fetchJson<{ classroom: Classroom }>('/classrooms', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Sessions
  getSessions: (params?: { facultyId?: string; status?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return fetchJson<{ sessions: AttendanceSession[] }>(`/sessions${q ? `?${q}` : ''}`);
  },
  getSession: (id: string) =>
    fetchJson<{ session: AttendanceSession; attendees: AttendanceRecord[] }>(`/sessions/${id}`),
  createSession: (data: {
    subjectId: string;
    classroomId: string;
    facultyId: string;
    sessionType: string;
    topic: string;
    durationMinutes: number;
  }) =>
    fetchJson<{ session: AttendanceSession }>('/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  closeSession: (id: string, actorId: string) =>
    fetchJson<{ session: AttendanceSession; message: string }>(`/sessions/${id}/close`, {
      method: 'POST',
      body: JSON.stringify({ actorId }),
    }),
  getSessionQR: (sessionId: string) =>
    fetchJson<{
      sessionId: string;
      token: string;
      payload: any;
      expiresAt: number;
      refreshIntervalSeconds: number;
      remainingSeconds: number;
      totalEnrolled: number;
      totalPresent: number;
      attendees: AttendanceRecord[];
    }>(`/sessions/${sessionId}/qr`),

  // Attendance Scanning & Recording
  scanAttendance: (data: {
    qrString: string;
    studentId: string;
    latitude?: number;
    longitude?: number;
    deviceFingerprint?: string;
  }) =>
    fetchJson<{
      success: boolean;
      message: string;
      record: AttendanceRecord;
      sessionSummary: {
        subjectCode: string;
        subjectName: string;
        classroomName: string;
        timestamp: number;
      };
    }>('/attendance/scan', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  overrideAttendance: (data: {
    sessionId: string;
    studentId: string;
    status: AttendanceRecord['status'];
    notes: string;
    facultyId: string;
  }) =>
    fetchJson<{ record: AttendanceRecord; message: string }>('/attendance/override', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Student Stats & History
  getStudentSummary: (studentId: string) =>
    fetchJson<{ summary: StudentStats }>(`/student/${studentId}/summary`),
  getStudentRecords: (studentId: string, params?: { subjectId?: string; status?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return fetchJson<{ records: AttendanceRecord[] }>(`/student/${studentId}/records${q ? `?${q}` : ''}`);
  },

  // Admin Management
  getAdminStats: () =>
    fetchJson<{
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
    }>('/admin/stats'),

  getAdminStudents: () =>
    fetchJson<{
      students: (User & {
        attendancePercentage: number;
        totalClasses: number;
        attendedClasses: number;
        shortageWarning: boolean;
      })[];
    }>('/admin/students'),

  createStudent: (data: Partial<User>) =>
    fetchJson<{ student: User }>('/admin/students', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteStudent: (id: string) =>
    fetchJson<{ message: string }>(`/admin/students/${id}`, {
      method: 'DELETE',
    }),

  getAuditLogs: () => fetchJson<{ logs: AuditLog[] }>('/admin/audit-logs'),

  resetDatabase: () =>
    fetchJson<{ message: string }>('/admin/reset', {
      method: 'POST',
    }),
};
