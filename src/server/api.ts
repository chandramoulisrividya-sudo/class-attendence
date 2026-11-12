import { Router, Request, Response } from 'express';
import { db } from './db.js';
import {
  createQRPayload,
  parseAndValidateQR,
  calculateDistanceMeters,
} from '../utils/security.js';
import { computeStudentAttendanceSummary } from '../utils/attendanceCalculations.js';
import {
  AttendanceRecord,
  AttendanceSession,
  AuditLog,
  User,
  Subject,
  Classroom,
  Enrollment,
} from '../types/index.js';

export const apiRouter = Router();

// Helper to log audit events
function logAudit(
  actor: { id: string; name: string; role: any },
  action: AuditLog['action'],
  targetType: AuditLog['targetType'],
  targetId: string,
  details: string,
  metadata?: Record<string, any>
) {
  const state = db.getState();
  const log: AuditLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: Date.now(),
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action,
    targetType,
    targetId,
    details,
    metadata,
  };
  state.auditLogs.unshift(log);
  if (state.auditLogs.length > 500) {
    state.auditLogs.pop();
  }
  db.save();
}

/* ==========================================================================
   AUTHENTICATION & USER ROUTES
   ========================================================================== */

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, role, userId } = req.body;
  const state = db.getState();

  let user: User | undefined;
  if (userId) {
    user = state.users.find((u) => u.id === userId);
  } else if (email) {
    user = state.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  } else if (role) {
    user = state.users.find((u) => u.role === role);
  }

  if (!user) {
    return res.status(401).json({ error: 'User not found. Please check your credentials or select a demo profile.' });
  }

  return res.json({
    token: `token-${user.id}-${Date.now()}`,
    user,
  });
});

apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { name, email, studentId, departmentId, semester, batch } = req.body;

  if (!name || !email || !studentId || !departmentId) {
    return res.status(400).json({ error: 'Name, email, student ID and department are required.' });
  }

  const state = db.getState();
  const existing = state.users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() || (u.studentId && u.studentId.toUpperCase() === studentId.toUpperCase())
  );

  if (existing) {
    return res.status(409).json({ error: 'A student with this email or Roll Number already exists.' });
  }

  const dept = state.departments.find((d) => d.id === departmentId);
  const newStudent: User = {
    id: `std-${Date.now()}`,
    name,
    email,
    role: 'student',
    studentId: studentId.toUpperCase(),
    departmentId,
    departmentName: dept ? dept.name : 'Computer Science & Engineering',
    semester: Number(semester) || 1,
    batch: batch || '2024-2028',
    avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
  };

  state.users.push(newStudent);

  // Automatically enroll student into subjects for their department and semester
  const relevantSubjects = state.subjects.filter(
    (s) => s.departmentId === departmentId && (s.semester === newStudent.semester || !s.semester)
  );

  relevantSubjects.forEach((sub) => {
    state.enrollments.push({
      id: `enr-${newStudent.id}-${sub.id}`,
      studentId: newStudent.id,
      subjectId: sub.id,
      academicYear: '2024-2025',
      semester: newStudent.semester || 1,
    });
  });

  logAudit(
    newStudent,
    'STUDENT_CREATED',
    'STUDENT',
    newStudent.id,
    `New student self-registered: ${newStudent.name} (${newStudent.studentId}) in ${newStudent.departmentName}`
  );

  db.save();

  return res.status(201).json({
    message: 'Registration successful! You may now sign in and scan attendance.',
    user: newStudent,
    token: `token-${newStudent.id}-${Date.now()}`,
  });
});

apiRouter.get('/auth/users', (req: Request, res: Response) => {
  const state = db.getState();
  const demoUsers = state.users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    departmentName: u.departmentName,
    studentId: u.studentId,
    facultyId: u.facultyId,
    designation: u.designation,
    avatar: u.avatar,
  }));
  return res.json({ users: demoUsers });
});

/* ==========================================================================
   METADATA & COLLEGE CONFIGURATION ROUTES
   ========================================================================== */

apiRouter.get('/departments', (_req: Request, res: Response) => {
  const state = db.getState();
  return res.json({ departments: state.departments });
});

apiRouter.get('/subjects', (req: Request, res: Response) => {
  const { facultyId, departmentId } = req.query;
  const state = db.getState();
  let subjects = state.subjects;

  if (facultyId) {
    subjects = subjects.filter((s) => s.facultyId === facultyId);
  }
  if (departmentId) {
    subjects = subjects.filter((s) => s.departmentId === departmentId);
  }

  return res.json({ subjects });
});

apiRouter.post('/subjects', (req: Request, res: Response) => {
  const { name, code, departmentId, semester, credits, facultyId } = req.body;
  if (!name || !code || !departmentId || !facultyId) {
    return res.status(400).json({ error: 'Subject name, code, department, and faculty are required.' });
  }

  const state = db.getState();
  const faculty = state.users.find((u) => u.id === facultyId);
  const newSubject: Subject = {
    id: `sub-${Date.now()}`,
    name,
    code: code.toUpperCase(),
    departmentId,
    semester: Number(semester) || 1,
    credits: Number(credits) || 3,
    facultyId,
    facultyName: faculty ? faculty.name : 'Assigned Faculty',
    totalClassesScheduled: 0,
  };

  state.subjects.push(newSubject);
  db.save();

  return res.status(201).json({ subject: newSubject });
});

apiRouter.get('/classrooms', (_req: Request, res: Response) => {
  const state = db.getState();
  return res.json({ classrooms: state.classrooms });
});

apiRouter.post('/classrooms', (req: Request, res: Response) => {
  const { name, building, capacity, latitude, longitude, geofenceRadiusMeters, hasBeacon } = req.body;
  if (!name || !building || !capacity) {
    return res.status(400).json({ error: 'Classroom name, building, and capacity are required.' });
  }

  const state = db.getState();
  const newClassroom: Classroom = {
    id: `cr-${Date.now()}`,
    name,
    building,
    capacity: Number(capacity) || 60,
    latitude: Number(latitude) || 12.9716,
    longitude: Number(longitude) || 77.5946,
    geofenceRadiusMeters: Number(geofenceRadiusMeters) || 50,
    hasBeacon: Boolean(hasBeacon),
  };

  state.classrooms.push(newClassroom);
  db.save();

  return res.status(201).json({ classroom: newClassroom });
});

/* ==========================================================================
   ATTENDANCE SESSION ROUTES (FACULTY & QR)
   ========================================================================== */

apiRouter.get('/sessions', (req: Request, res: Response) => {
  const { facultyId, status } = req.query;
  const state = db.getState();
  let sessions = state.sessions;

  if (facultyId) {
    sessions = sessions.filter((s) => s.facultyId === facultyId);
  }
  if (status) {
    sessions = sessions.filter((s) => s.status === status);
  }

  // Sort latest first
  sessions = [...sessions].sort((a, b) => b.startTime - a.startTime);
  return res.json({ sessions });
});

apiRouter.get('/sessions/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const state = db.getState();
  const session = state.sessions.find((s) => s.id === id);

  if (!session) {
    return res.status(404).json({ error: 'Attendance session not found.' });
  }

  const attendees = state.records.filter((r) => r.sessionId === id);
  return res.json({ session, attendees });
});

apiRouter.post('/sessions', (req: Request, res: Response) => {
  const { subjectId, classroomId, facultyId, sessionType, topic, durationMinutes } = req.body;

  if (!subjectId || !classroomId || !facultyId) {
    return res.status(400).json({ error: 'Subject, Classroom, and Faculty are required.' });
  }

  const state = db.getState();
  const subject = state.subjects.find((s) => s.id === subjectId);
  const classroom = state.classrooms.find((c) => c.id === classroomId);
  const faculty = state.users.find((u) => u.id === facultyId);

  if (!subject || !classroom || !faculty) {
    return res.status(404).json({ error: 'Subject, classroom, or faculty record not found.' });
  }

  // Calculate enrolled count for this subject
  const enrolledCount = state.enrollments.filter((e) => e.subjectId === subjectId).length;

  const now = Date.now();
  const duration = Number(durationMinutes) || 45;
  const secretKey = `sec-${subject.code}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const newSession: AttendanceSession = {
    id: `sess-${Date.now()}`,
    subjectId: subject.id,
    subjectCode: subject.code,
    subjectName: subject.name,
    facultyId: faculty.id,
    facultyName: faculty.name,
    classroomId: classroom.id,
    classroomName: classroom.name,
    sessionType: sessionType || 'Lecture',
    topic: topic || `${subject.code} Regular Session`,
    startTime: now,
    endTime: now + duration * 60 * 1000,
    durationMinutes: duration,
    status: 'active',
    secretKey,
    qrRefreshIntervalSeconds: 20, // 20s dynamic rotation
    totalEnrolled: enrolledCount || 8,
    totalPresent: 0,
  };

  // Increment total classes scheduled for subject
  subject.totalClassesScheduled = (subject.totalClassesScheduled || 0) + 1;

  state.sessions.unshift(newSession);

  logAudit(
    faculty,
    'SESSION_CREATED',
    'SESSION',
    newSession.id,
    `Started attendance session for ${subject.code} in ${classroom.name} (Duration: ${duration} mins)`
  );

  db.save();
  return res.status(201).json({ session: newSession });
});

apiRouter.post('/sessions/:id/close', (req: Request, res: Response) => {
  const { id } = req.params;
  const { actorId } = req.body;
  const state = db.getState();
  const session = state.sessions.find((s) => s.id === id);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  session.status = 'completed';
  session.endTime = Date.now();

  const actor = state.users.find((u) => u.id === actorId) || {
    id: session.facultyId,
    name: session.facultyName,
    role: 'faculty',
  };

  logAudit(
    actor,
    'SESSION_CLOSED',
    'SESSION',
    session.id,
    `Session finalized with ${session.totalPresent}/${session.totalEnrolled} students present.`
  );

  db.save();
  return res.json({ session, message: 'Session closed successfully.' });
});

/**
 * Dynamic QR generation endpoint.
 * Returns signed rotating token and real-time live attendees.
 */
apiRouter.get('/sessions/:id/qr', (req: Request, res: Response) => {
  const { id } = req.params;
  const state = db.getState();
  const session = state.sessions.find((s) => s.id === id);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  if (session.status !== 'active') {
    return res.status(400).json({ error: 'Attendance session is not active.' });
  }

  const refreshInterval = session.qrRefreshIntervalSeconds || 20;
  const { payload, encoded } = createQRPayload(session.id, session.secretKey, refreshInterval);

  session.currentToken = encoded;
  session.tokenExpiresAt = payload.exp;

  const attendees = state.records
    .filter((r) => r.sessionId === id)
    .sort((a, b) => b.timestamp - a.timestamp);

  session.totalPresent = attendees.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;

  return res.json({
    sessionId: session.id,
    token: encoded,
    payload,
    expiresAt: payload.exp,
    refreshIntervalSeconds: refreshInterval,
    remainingSeconds: Math.max(0, Math.round((payload.exp - Date.now()) / 1000)),
    totalEnrolled: session.totalEnrolled,
    totalPresent: session.totalPresent,
    attendees: attendees.slice(0, 30),
  });
});

/* ==========================================================================
   ATTENDANCE RECORDING & ANTI-PROXY VALIDATION
   ========================================================================== */

apiRouter.post('/attendance/scan', (req: Request, res: Response) => {
  const { qrString, studentId, latitude, longitude, deviceFingerprint } = req.body;

  if (!qrString || !studentId) {
    return res.status(400).json({ error: 'QR Code string and student ID are required.' });
  }

  const state = db.getState();
  const student = state.users.find((u) => u.id === studentId);

  if (!student || student.role !== 'student') {
    return res.status(401).json({ error: 'Student account not found or unauthorized.' });
  }

  // 1. Validate QR Token Signature & Expiration
  const keyMap = (sId: string) => {
    const s = state.sessions.find((sess) => sess.id === sId);
    return s ? s.secretKey : undefined;
  };

  const validation = parseAndValidateQR(qrString, keyMap);

  if (!validation.valid || !validation.sessionId) {
    return res.status(400).json({
      error: validation.error || 'Invalid or expired QR code.',
      code: validation.code,
    });
  }

  // 2. Validate Session Exists and is Active
  const session = state.sessions.find((s) => s.id === validation.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'The attendance session does not exist.' });
  }

  if (session.status !== 'active') {
    return res.status(400).json({ error: 'This attendance session has ended and is closed for new entries.' });
  }

  // 3. Verify Student Enrollment in Subject
  const isEnrolled = state.enrollments.some(
    (e) => e.studentId === student.id && e.subjectId === session.subjectId
  );

  if (!isEnrolled) {
    return res.status(403).json({
      error: `You are not enrolled in ${session.subjectCode} (${session.subjectName}). Attendance denied.`,
      code: 'NOT_ENROLLED',
    });
  }

  // 4. Anti-Proxy Protection: One attendance record per student per session
  const alreadyMarked = state.records.find(
    (r) => r.sessionId === session.id && r.studentId === student.id
  );

  if (alreadyMarked) {
    return res.status(409).json({
      error: `You have already marked your attendance for this session at ${new Date(alreadyMarked.timestamp).toLocaleTimeString()}.`,
      code: 'DUPLICATE_ATTENDANCE',
      record: alreadyMarked,
    });
  }

  // 5. Classroom Location Verification (Anti-Proxy if student provided location)
  let locationVerified = false;
  let isFlaggedProxy = false;
  let proxyReason = '';

  const classroom = state.classrooms.find((c) => c.id === session.classroomId);
  if (classroom && latitude !== undefined && longitude !== undefined) {
    const distanceMeters = calculateDistanceMeters(
      classroom.latitude,
      classroom.longitude,
      Number(latitude),
      Number(longitude)
    );

    // If outside geofence radius + margin (e.g. 150m)
    if (distanceMeters > classroom.geofenceRadiusMeters + 100) {
      isFlaggedProxy = true;
      proxyReason = `Scanned from ~${Math.round(distanceMeters)}m away from ${classroom.name} (Geofence: ${classroom.geofenceRadiusMeters}m). Flagged for faculty review.`;
    } else {
      locationVerified = true;
    }
  }

  // 6. Record Attendance
  const now = Date.now();
  const record: AttendanceRecord = {
    id: `rec-${session.id}-${student.id}`,
    sessionId: session.id,
    studentId: student.id,
    studentName: student.name,
    studentRollNumber: student.studentId || '',
    subjectId: session.subjectId,
    subjectCode: session.subjectCode,
    facultyId: session.facultyId,
    classroomId: session.classroomId,
    status: 'PRESENT',
    timestamp: now,
    verificationMethod: locationVerified ? 'LOCATION_VERIFIED_QR' : 'DYNAMIC_QR',
    deviceFingerprint,
    locationVerified,
    isFlaggedProxy,
    proxyReason,
  };

  state.records.push(record);
  session.totalPresent = (session.totalPresent || 0) + 1;

  logAudit(
    student,
    'ATTENDANCE_MARKED',
    'ATTENDANCE',
    record.id,
    `Attendance marked for ${session.subjectCode} via Dynamic QR${isFlaggedProxy ? ' [FLAGGED: Unusual Location]' : ''}`
  );

  db.save();

  return res.status(200).json({
    success: true,
    message: isFlaggedProxy
      ? 'Attendance recorded with location flag for faculty review.'
      : 'Attendance successfully verified and recorded!',
    record,
    sessionSummary: {
      subjectCode: session.subjectCode,
      subjectName: session.subjectName,
      classroomName: session.classroomName,
      timestamp: now,
    },
  });
});

/**
 * Manual attendance correction / override by faculty
 */
apiRouter.post('/attendance/override', (req: Request, res: Response) => {
  const { sessionId, studentId, status, notes, facultyId } = req.body;

  if (!sessionId || !studentId || !status || !facultyId) {
    return res.status(400).json({ error: 'Session ID, student ID, status, and faculty ID are required.' });
  }

  const state = db.getState();
  const faculty = state.users.find((u) => u.id === facultyId);
  const student = state.users.find((u) => u.id === studentId);
  const session = state.sessions.find((s) => s.id === sessionId);

  if (!faculty || !student || !session) {
    return res.status(404).json({ error: 'Session, student, or faculty record not found.' });
  }

  let record = state.records.find((r) => r.sessionId === sessionId && r.studentId === studentId);

  if (record) {
    const oldStatus = record.status;
    record.status = status;
    record.notes = notes || `Status changed from ${oldStatus} to ${status} by ${faculty.name}`;
    record.verificationMethod = 'MANUAL_FACULTY';
  } else {
    record = {
      id: `rec-${sessionId}-${studentId}`,
      sessionId,
      studentId: student.id,
      studentName: student.name,
      studentRollNumber: student.studentId || '',
      subjectId: session.subjectId,
      subjectCode: session.subjectCode,
      facultyId: faculty.id,
      classroomId: session.classroomId,
      status,
      timestamp: Date.now(),
      verificationMethod: 'MANUAL_FACULTY',
      notes: notes || `Manually marked ${status} by ${faculty.name}`,
    };
    state.records.push(record);
  }

  // Recalculate session total
  session.totalPresent = state.records.filter(
    (r) => r.sessionId === sessionId && (r.status === 'PRESENT' || r.status === 'LATE')
  ).length;

  logAudit(
    faculty,
    'ATTENDANCE_OVERRIDDEN',
    'ATTENDANCE',
    record.id,
    `Manual override: Set ${student.name} (${student.studentId}) to ${status}. Reason: ${notes || 'Faculty discretion'}`
  );

  db.save();
  return res.json({ record, message: 'Attendance status updated successfully.' });
});

/* ==========================================================================
   STUDENT STATS & HISTORY
   ========================================================================== */

apiRouter.get('/student/:id/summary', (req: Request, res: Response) => {
  const { id } = req.params;
  const state = db.getState();

  const summary = computeStudentAttendanceSummary(
    id,
    state.enrollments,
    state.subjects,
    state.records
  );

  return res.json({ summary });
});

apiRouter.get('/student/:id/records', (req: Request, res: Response) => {
  const { id } = req.params;
  const { subjectId, status } = req.query;
  const state = db.getState();

  let records = state.records.filter((r) => r.studentId === id);

  if (subjectId) {
    records = records.filter((r) => r.subjectId === subjectId);
  }
  if (status) {
    records = records.filter((r) => r.status === status);
  }

  // Sort newest first
  records = [...records].sort((a, b) => b.timestamp - a.timestamp);

  return res.json({ records });
});

/* ==========================================================================
   ADMIN MANAGEMENT ROUTES
   ========================================================================== */

apiRouter.get('/admin/stats', (_req: Request, res: Response) => {
  const state = db.getState();
  const totalStudents = state.users.filter((u) => u.role === 'student').length;
  const totalFaculty = state.users.filter((u) => u.role === 'faculty').length;
  const totalDepartments = state.departments.length;
  const activeSessions = state.sessions.filter((s) => s.status === 'active').length;

  // Compute university-wide attendance percentage
  const totalRecords = state.records.length;
  const attendedRecords = state.records.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
  const overallAttendancePercentage = totalRecords > 0 ? Math.round((attendedRecords / totalRecords) * 1000) / 10 : 84.5;

  // Identify students with shortages (< 75%)
  const students = state.users.filter((u) => u.role === 'student');
  const shortageStudents = students.map((std) => {
    const summary = computeStudentAttendanceSummary(
      std.id,
      state.enrollments,
      state.subjects,
      state.records
    );
    return {
      student: std,
      summary,
    };
  }).filter((item) => item.summary.shortageWarning);

  // Department-wise stats
  const departmentStats = state.departments.map((dept) => {
    const deptStudents = state.users.filter((u) => u.role === 'student' && u.departmentId === dept.id);
    const deptSubjectIds = new Set(state.subjects.filter((s) => s.departmentId === dept.id).map((s) => s.id));
    const deptRecords = state.records.filter((r) => deptSubjectIds.has(r.subjectId));
    const deptAttended = deptRecords.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
    const avgAttendance = deptRecords.length > 0 ? Math.round((deptAttended / deptRecords.length) * 1000) / 10 : 82;

    return {
      departmentId: dept.id,
      departmentCode: dept.code,
      departmentName: dept.name,
      studentCount: deptStudents.length,
      averageAttendance: avgAttendance,
    };
  });

  return res.json({
    totalStudents,
    totalFaculty,
    totalDepartments,
    activeSessions,
    overallAttendancePercentage,
    shortageStudentsCount: shortageStudents.length,
    shortageStudents,
    departmentStats,
    recentAuditLogs: state.auditLogs.slice(0, 20),
  });
});

apiRouter.get('/admin/students', (_req: Request, res: Response) => {
  const state = db.getState();
  const students = state.users.filter((u) => u.role === 'student');

  const detailed = students.map((std) => {
    const summary = computeStudentAttendanceSummary(
      std.id,
      state.enrollments,
      state.subjects,
      state.records
    );
    return {
      ...std,
      attendancePercentage: summary.percentage,
      totalClasses: summary.totalClasses,
      attendedClasses: summary.attendedClasses,
      shortageWarning: summary.shortageWarning,
    };
  });

  return res.json({ students: detailed });
});

apiRouter.post('/admin/students', (req: Request, res: Response) => {
  const { name, email, studentId, departmentId, semester, batch } = req.body;
  if (!name || !email || !studentId || !departmentId) {
    return res.status(400).json({ error: 'Name, email, student ID, and department are required.' });
  }

  const state = db.getState();
  const dept = state.departments.find((d) => d.id === departmentId);
  const newStudent: User = {
    id: `std-${Date.now()}`,
    name,
    email,
    role: 'student',
    studentId: studentId.toUpperCase(),
    departmentId,
    departmentName: dept ? dept.name : 'Computer Science & Engineering',
    semester: Number(semester) || 1,
    batch: batch || '2024-2028',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  };

  state.users.push(newStudent);

  // Enroll in department subjects
  const deptSubs = state.subjects.filter((s) => s.departmentId === departmentId);
  deptSubs.forEach((sub) => {
    state.enrollments.push({
      id: `enr-${newStudent.id}-${sub.id}`,
      studentId: newStudent.id,
      subjectId: sub.id,
      academicYear: '2024-2025',
      semester: newStudent.semester || 1,
    });
  });

  db.save();
  return res.status(201).json({ student: newStudent });
});

apiRouter.delete('/admin/students/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const state = db.getState();
  state.users = state.users.filter((u) => u.id !== id);
  state.enrollments = state.enrollments.filter((e) => e.studentId !== id);
  state.records = state.records.filter((r) => r.studentId !== id);
  db.save();
  return res.json({ message: 'Student deleted successfully.' });
});

apiRouter.get('/admin/audit-logs', (_req: Request, res: Response) => {
  const state = db.getState();
  return res.json({ logs: state.auditLogs });
});

apiRouter.post('/admin/reset', (_req: Request, res: Response) => {
  db.resetToSeed();
  return res.json({ message: 'Database reset to initial demo state.' });
});
