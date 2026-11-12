import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAttendancePercentage,
  calculateClassesNeededForTarget,
  getAttendanceStatusColor,
  computeStudentAttendanceSummary,
} from './attendanceCalculations.js';
import { AttendanceRecord, Enrollment, Subject } from '../types/index.js';

test('AttendanceCalc: calculateAttendancePercentage calculates percentages accurately', () => {
  assert.equal(calculateAttendancePercentage(18, 20), 90);
  assert.equal(calculateAttendancePercentage(15, 20), 75);
  assert.equal(calculateAttendancePercentage(14, 20), 70);
  assert.equal(calculateAttendancePercentage(0, 0), 100);
});

test('AttendanceCalc: calculateClassesNeededForTarget calculates required classes for 75%', () => {
  // If student attended 14 out of 20 (70%), they need to attend consecutive classes to reach 75%
  // (14 + x) / (20 + x) >= 0.75 => 14 + x >= 15 + 0.75x => 0.25x >= 1 => x = 4
  const needed = calculateClassesNeededForTarget(14, 20, 75);
  assert.equal(needed, 4);
  // Verify: (14 + 4) / (20 + 4) = 18 / 24 = 75%
  assert.equal((14 + needed) / (20 + needed), 0.75);

  // If already at 80% (16/20), needed classes is 0
  assert.equal(calculateClassesNeededForTarget(16, 20, 75), 0);
});

test('AttendanceCalc: getAttendanceStatusColor returns correct color badges', () => {
  const good = getAttendanceStatusColor(88);
  assert.equal(good.label, 'Good Standing');
  assert.ok(good.color.includes('emerald'));

  const borderline = getAttendanceStatusColor(76);
  assert.equal(borderline.label, 'Borderline');
  assert.ok(borderline.color.includes('amber'));

  const shortage = getAttendanceStatusColor(68);
  assert.equal(shortage.label, 'Critical Shortage');
  assert.ok(shortage.color.includes('rose'));
});

test('AttendanceCalc: computeStudentAttendanceSummary computes subject breakdowns and warnings', () => {
  const studentId = 'std-1';
  const subjects: Subject[] = [
    {
      id: 'sub-1',
      name: 'Database Systems',
      code: 'CS301',
      departmentId: 'dept-1',
      semester: 5,
      credits: 4,
      facultyId: 'fac-1',
      facultyName: 'Dr. Sarah',
      totalClassesScheduled: 20,
    },
    {
      id: 'sub-2',
      name: 'Operating Systems',
      code: 'CS302',
      departmentId: 'dept-1',
      semester: 5,
      credits: 4,
      facultyId: 'fac-2',
      facultyName: 'Prof. Miller',
      totalClassesScheduled: 20,
    },
  ];

  const enrollments: Enrollment[] = [
    { id: 'e1', studentId, subjectId: 'sub-1', academicYear: '2024-2025', semester: 5 },
    { id: 'e2', studentId, subjectId: 'sub-2', academicYear: '2024-2025', semester: 5 },
  ];

  // 18 present in sub-1 (90%), 12 present in sub-2 (60%)
  const records: AttendanceRecord[] = [];
  for (let i = 0; i < 18; i++) {
    records.push({
      id: `r-1-${i}`,
      sessionId: `s1-${i}`,
      studentId,
      studentName: 'Alex Vance',
      studentRollNumber: 'CS2023001',
      subjectId: 'sub-1',
      subjectCode: 'CS301',
      facultyId: 'fac-1',
      classroomId: 'c1',
      status: 'PRESENT',
      timestamp: Date.now() - (i + 1) * 86400000,
      verificationMethod: 'DYNAMIC_QR',
    });
  }
  for (let i = 0; i < 12; i++) {
    records.push({
      id: `r-2-${i}`,
      sessionId: `s2-${i}`,
      studentId,
      studentName: 'Alex Vance',
      studentRollNumber: 'CS2023001',
      subjectId: 'sub-2',
      subjectCode: 'CS302',
      facultyId: 'fac-2',
      classroomId: 'c2',
      status: 'PRESENT',
      timestamp: Date.now() - (i + 1) * 86400000,
      verificationMethod: 'DYNAMIC_QR',
    });
  }

  const summary = computeStudentAttendanceSummary(studentId, enrollments, subjects, records);

  assert.equal(summary.totalClasses, 40);
  assert.equal(summary.attendedClasses, 30);
  assert.equal(summary.percentage, 75); // (30/40) = 75%
  assert.equal(summary.subjectStats.length, 2);

  const sub2Stat = summary.subjectStats.find((s) => s.subjectId === 'sub-2');
  assert.ok(sub2Stat);
  assert.equal(sub2Stat.percentage, 60);
  assert.equal(sub2Stat.shortageWarning, true);
  assert.equal(sub2Stat.classesNeededFor75, 12); // (12 + 12)/(20 + 12) = 24/32 = 75%
  assert.equal(summary.shortageWarning, true); // true because sub-2 is below 75%
});
