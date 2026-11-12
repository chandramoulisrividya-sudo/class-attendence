import fs from 'fs';
import path from 'path';
import {
  User,
  Department,
  Subject,
  Classroom,
  Enrollment,
  AttendanceSession,
  AttendanceRecord,
  AuditLog,
} from '../types/index.js';

export interface DatabaseState {
  users: User[];
  departments: Department[];
  subjects: Subject[];
  classrooms: Classroom[];
  enrollments: Enrollment[];
  sessions: AttendanceSession[];
  records: AttendanceRecord[];
  auditLogs: AuditLog[];
}

const DB_FILE_PATH = path.resolve('data/database.json');

function ensureDataDirectory() {
  const dir = path.dirname(DB_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function createInitialSeedData(): DatabaseState {
  const departments: Department[] = [
    { id: 'dept-cse', name: 'Computer Science & Engineering', code: 'CSE', headOfDepartment: 'Dr. Sarah Jenkins', totalStudents: 0, totalFaculty: 3 },
    { id: 'dept-ece', name: 'Electronics & Communication', code: 'ECE', headOfDepartment: 'Dr. Vikram Seth', totalStudents: 0, totalFaculty: 2 },
    { id: 'dept-it', name: 'Information Technology', code: 'IT', headOfDepartment: 'Prof. Ramesh Rao', totalStudents: 0, totalFaculty: 1 },
    { id: 'dept-me', name: 'Mechanical Engineering', code: 'ME', headOfDepartment: 'Dr. Rajesh Nair', totalStudents: 0, totalFaculty: 1 },
  ];

  const classrooms: Classroom[] = [
    { id: 'cr-101', name: 'LH-101 (Turing Hall)', building: 'Tech Block A', capacity: 80, latitude: 12.9716, longitude: 77.5946, geofenceRadiusMeters: 60, hasBeacon: true },
    { id: 'cr-102', name: 'LH-102 (Von Neumann)', building: 'Tech Block A', capacity: 70, latitude: 12.9718, longitude: 77.5948, geofenceRadiusMeters: 50, hasBeacon: true },
    { id: 'cr-204', name: 'CS-Lab-204 (Advanced Systems)', building: 'Computing Center', capacity: 45, latitude: 12.9721, longitude: 77.5950, geofenceRadiusMeters: 40, hasBeacon: true },
    { id: 'cr-sem-a', name: 'Seminar Hall A (Auditorium)', building: 'Central Block', capacity: 150, latitude: 12.9710, longitude: 77.5940, geofenceRadiusMeters: 100, hasBeacon: false },
  ];

  // Registered Teachers across departments
  const faculty: User[] = [
    {
      id: 'fac-1',
      name: 'Dr. Sarah Jenkins',
      email: 'sarah.jenkins@smartattend.edu',
      role: 'faculty',
      facultyId: 'FAC-CSE-01',
      designation: 'Professor & Head',
      departmentId: 'dept-cse',
      departmentName: 'Computer Science & Engineering',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 'fac-2',
      name: 'Prof. Robert Miller',
      email: 'robert.miller@smartattend.edu',
      role: 'faculty',
      facultyId: 'FAC-CSE-08',
      designation: 'Associate Professor',
      departmentId: 'dept-cse',
      departmentName: 'Computer Science & Engineering',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 'fac-3',
      name: 'Dr. Anita Sharma',
      email: 'anita.sharma@smartattend.edu',
      role: 'faculty',
      facultyId: 'FAC-CSE-15',
      designation: 'Associate Professor',
      departmentId: 'dept-cse',
      departmentName: 'Computer Science & Engineering',
      avatar: 'https://images.unsplash.com/photo-1580894732454-defa1b55913e?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 'fac-4',
      name: 'Dr. Vikram Seth',
      email: 'vikram.seth@smartattend.edu',
      role: 'faculty',
      facultyId: 'FAC-ECE-02',
      designation: 'Professor & Head',
      departmentId: 'dept-ece',
      departmentName: 'Electronics & Communication',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 'fac-5',
      name: 'Prof. David Patel',
      email: 'david.patel@smartattend.edu',
      role: 'faculty',
      facultyId: 'FAC-ECE-09',
      designation: 'Assistant Professor',
      departmentId: 'dept-ece',
      departmentName: 'Electronics & Communication',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 'fac-6',
      name: 'Prof. Ramesh Rao',
      email: 'ramesh.rao@smartattend.edu',
      role: 'faculty',
      facultyId: 'FAC-IT-04',
      designation: 'Professor & Head',
      departmentId: 'dept-it',
      departmentName: 'Information Technology',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    },
  ];

  const admin: User = {
    id: 'admin-1',
    name: 'Dr. Marcus Vance',
    email: 'admin@smartattend.edu',
    role: 'admin',
    adminRole: 'Dean of Academic Affairs',
    departmentId: 'dept-cse',
    departmentName: 'Academic Administration',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  };

  // ALL PREVIOUS STUDENTS REMOVED! Fresh empty student array:
  const students: User[] = [];

  const subjects: Subject[] = [
    {
      id: 'sub-cs301',
      name: 'Database Management Systems',
      code: 'CS301',
      departmentId: 'dept-cse',
      semester: 5,
      credits: 4,
      facultyId: 'fac-1',
      facultyName: 'Dr. Sarah Jenkins',
      totalClassesScheduled: 24,
    },
    {
      id: 'sub-cs302',
      name: 'Operating Systems & Concurrency',
      code: 'CS302',
      departmentId: 'dept-cse',
      semester: 5,
      credits: 4,
      facultyId: 'fac-2',
      facultyName: 'Prof. Robert Miller',
      totalClassesScheduled: 22,
    },
    {
      id: 'sub-cs303',
      name: 'Computer Networks & Security',
      code: 'CS303',
      departmentId: 'dept-cse',
      semester: 5,
      credits: 3,
      facultyId: 'fac-1',
      facultyName: 'Dr. Sarah Jenkins',
      totalClassesScheduled: 20,
    },
    {
      id: 'sub-cs304',
      name: 'Artificial Intelligence & Neural Nets',
      code: 'CS304',
      departmentId: 'dept-cse',
      semester: 5,
      credits: 4,
      facultyId: 'fac-3',
      facultyName: 'Dr. Anita Sharma',
      totalClassesScheduled: 20,
    },
    {
      id: 'sub-ec201',
      name: 'Digital Signal Processing',
      code: 'EC201',
      departmentId: 'dept-ece',
      semester: 5,
      credits: 4,
      facultyId: 'fac-4',
      facultyName: 'Dr. Vikram Seth',
      totalClassesScheduled: 18,
    },
    {
      id: 'sub-it301',
      name: 'Cloud & Web Architecture',
      code: 'IT301',
      departmentId: 'dept-it',
      semester: 5,
      credits: 4,
      facultyId: 'fac-6',
      facultyName: 'Prof. Ramesh Rao',
      totalClassesScheduled: 18,
    },
  ];

  // No student enrollments yet
  const enrollments: Enrollment[] = [];

  // No previous attendance records
  const records: AttendanceRecord[] = [];

  // Active ongoing attendance session for CS301 (Dr. Sarah Jenkins in LH-101)
  const now = Date.now();
  const activeSession: AttendanceSession = {
    id: 'active-sess-demo',
    subjectId: 'sub-cs301',
    subjectCode: 'CS301',
    subjectName: 'Database Management Systems',
    facultyId: 'fac-1',
    facultyName: 'Dr. Sarah Jenkins',
    classroomId: 'cr-101',
    classroomName: 'LH-101 (Turing Hall)',
    sessionType: 'Lecture',
    topic: 'Relational Algebra & Advanced Query Optimization',
    startTime: now - 5 * 60 * 1000,
    endTime: now + 55 * 60 * 1000,
    durationMinutes: 60,
    status: 'active',
    secretKey: 'live-session-crypt-key-cse301',
    qrRefreshIntervalSeconds: 20,
    totalEnrolled: 0,
    totalPresent: 0,
  };

  const auditLogs: AuditLog[] = [
    {
      id: 'log-seed-1',
      timestamp: now - 10 * 60 * 1000,
      actorId: 'admin-1',
      actorName: 'Dr. Marcus Vance',
      actorRole: 'admin',
      action: 'SESSION_CREATED',
      targetType: 'SESSION',
      targetId: 'sys-init',
      details: 'SmartAttend campus system initialized. Registered faculty roster active.',
    },
    {
      id: 'log-seed-2',
      timestamp: now - 5 * 60 * 1000,
      actorId: 'fac-1',
      actorName: 'Dr. Sarah Jenkins',
      actorRole: 'faculty',
      action: 'SESSION_CREATED',
      targetType: 'SESSION',
      targetId: 'active-sess-demo',
      details: 'Started dynamic QR attendance session for CS301 in LH-101 (Duration: 60 min).',
    },
  ];

  return {
    users: [...faculty, admin],
    departments,
    subjects,
    classrooms,
    enrollments,
    sessions: [activeSession],
    records,
    auditLogs,
  };
}

class Database {
  private state: DatabaseState;

  constructor() {
    ensureDataDirectory();
    this.state = this.loadOrSeed();
  }

  private loadOrSeed(): DatabaseState {
    const initial = createInitialSeedData();
    this.persist(initial);
    return initial;
  }

  private persist(state: DatabaseState) {
    try {
      ensureDataDirectory();
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(state, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database.json:', err);
    }
  }

  public getState(): DatabaseState {
    return this.state;
  }

  public save() {
    this.persist(this.state);
  }

  public resetToSeed() {
    this.state = createInitialSeedData();
    this.persist(this.state);
    return this.state;
  }
}

export const db = new Database();
