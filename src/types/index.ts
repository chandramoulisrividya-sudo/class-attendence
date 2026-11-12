export type UserRole = 'student' | 'faculty' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  departmentId: string;
  departmentName?: string;
  // Student-specific
  studentId?: string; // Roll number e.g. "CS2023048"
  semester?: number;
  batch?: string; // e.g. "2023-2027"
  // Faculty-specific
  facultyId?: string; // e.g. "FAC-082"
  designation?: string;
  // Admin-specific
  adminRole?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  headOfDepartment: string;
  totalStudents: number;
  totalFaculty: number;
}

export interface Subject {
  id: string;
  name: string;
  code: string; // e.g. "CS301"
  departmentId: string;
  semester: number;
  credits: number;
  facultyId: string;
  facultyName?: string;
  totalClassesScheduled: number;
}

export interface Classroom {
  id: string;
  name: string; // e.g. "LH-101"
  building: string;
  capacity: number;
  latitude: number;
  longitude: number;
  geofenceRadiusMeters: number; // e.g. 50m
  hasBeacon: boolean;
}

export interface Enrollment {
  id: string;
  studentId: string;
  subjectId: string;
  academicYear: string;
  semester: number;
}

export interface AttendanceSession {
  id: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  facultyId: string;
  facultyName: string;
  classroomId: string;
  classroomName: string;
  sessionType: 'Lecture' | 'Lab' | 'Tutorial';
  topic: string;
  startTime: number; // unix ms
  endTime: number; // unix ms
  durationMinutes: number;
  status: 'active' | 'completed' | 'cancelled';
  secretKey: string; // cryptographic secret for HMAC
  qrRefreshIntervalSeconds: number; // usually 15-30s
  currentToken?: string;
  tokenExpiresAt?: number;
  totalEnrolled: number;
  totalPresent: number;
}

export type VerificationMethod = 'DYNAMIC_QR' | 'MANUAL_FACULTY' | 'EXCUSED' | 'LOCATION_VERIFIED_QR';

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  studentName: string;
  studentRollNumber: string;
  subjectId: string;
  subjectCode: string;
  facultyId: string;
  classroomId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  timestamp: number; // server timestamp
  verificationMethod: VerificationMethod;
  ipAddress?: string;
  deviceFingerprint?: string;
  locationVerified?: boolean;
  notes?: string;
  isFlaggedProxy?: boolean;
  proxyReason?: string;
}

export interface AuditLog {
  id: string;
  timestamp: number;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: 'SESSION_CREATED' | 'SESSION_CLOSED' | 'ATTENDANCE_MARKED' | 'ATTENDANCE_OVERRIDDEN' | 'STUDENT_ENROLLED' | 'STUDENT_CREATED' | 'PROXY_FLAGGED';
  targetType: 'SESSION' | 'ATTENDANCE' | 'STUDENT' | 'FACULTY';
  targetId: string;
  details: string;
  metadata?: Record<string, any>;
}

export interface QRPayload {
  v: number; // version
  sId: string; // sessionId
  t: number; // token generation timestamp
  exp: number; // expiration timestamp
  sig: string; // HMAC-SHA256 signature
}

export interface StudentStats {
  totalClasses: number;
  attendedClasses: number;
  missedClasses: number;
  percentage: number;
  shortageWarning: boolean;
  shortageCount: number;
  subjectStats: {
    subjectId: string;
    subjectCode: string;
    subjectName: string;
    facultyName: string;
    total: number;
    attended: number;
    percentage: number;
    shortageWarning: boolean;
    classesNeededFor75: number;
  }[];
}
