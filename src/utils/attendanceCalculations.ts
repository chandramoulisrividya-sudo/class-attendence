import { AttendanceRecord, Enrollment, Subject } from '../types/index.js';

export const SHORTAGE_THRESHOLD = 75; // 75% standard university requirement
export const WARNING_THRESHOLD = 80; // 80% amber threshold

/**
 * Calculates student attendance percentage safely
 */
export function calculateAttendancePercentage(attended: number, total: number): number {
  if (!total || total <= 0) return 100;
  return Math.round((attended / total) * 1000) / 10;
}

/**
 * Calculates number of future consecutive classes a student must attend to reach or maintain 75%
 */
export function calculateClassesNeededForTarget(
  attended: number,
  total: number,
  targetPercentage: number = SHORTAGE_THRESHOLD
): number {
  if (total === 0) return 0;
  const targetFraction = targetPercentage / 100;
  const currentFraction = attended / total;

  if (currentFraction >= targetFraction) {
    return 0; // Already meeting target
  }

  // (attended + x) / (total + x) >= targetFraction
  // attended + x >= targetFraction * total + targetFraction * x
  // x * (1 - targetFraction) >= targetFraction * total - attended
  // x = ceil((targetFraction * total - attended) / (1 - targetFraction))
  const needed = Math.ceil((targetFraction * total - attended) / (1 - targetFraction));
  return Math.max(0, needed);
}

/**
 * Determines attendance status indicator color
 */
export function getAttendanceStatusColor(percentage: number): {
  color: string;
  bgLight: string;
  badge: string;
  label: string;
} {
  if (percentage >= 85) {
    return {
      color: 'text-emerald-400',
      bgLight: 'bg-emerald-500/10 border-emerald-500/30',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      label: 'Good Standing',
    };
  }
  if (percentage >= 75) {
    return {
      color: 'text-amber-400',
      bgLight: 'bg-amber-500/10 border-amber-500/30',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      label: 'Borderline',
    };
  }
  return {
    color: 'text-rose-400',
    bgLight: 'bg-rose-500/10 border-rose-500/30',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    label: 'Critical Shortage',
  };
}

/**
 * Computes comprehensive attendance breakdown for a student
 */
export function computeStudentAttendanceSummary(
  studentId: string,
  enrollments: Enrollment[],
  subjects: Subject[],
  records: AttendanceRecord[]
) {
  const studentRecords = records.filter((r) => r.studentId === studentId);
  const enrolledSubjectIds = new Set(enrollments.filter((e) => e.studentId === studentId).map((e) => e.subjectId));

  const relevantSubjects = subjects.filter((s) => enrolledSubjectIds.has(s.id));

  let totalClassesAll = 0;
  let attendedClassesAll = 0;

  const subjectStats = relevantSubjects.map((subject) => {
    const subjectRecords = studentRecords.filter((r) => r.subjectId === subject.id);
    const attended = subjectRecords.filter((r) => r.status === 'PRESENT' || r.status === 'LATE' || r.status === 'EXCUSED').length;
    // Scheduled total or records total, whichever is larger
    const total = Math.max(subject.totalClassesScheduled, subjectRecords.length);

    totalClassesAll += total;
    attendedClassesAll += attended;

    const percentage = calculateAttendancePercentage(attended, total);
    const shortageWarning = percentage < SHORTAGE_THRESHOLD;
    const classesNeededFor75 = calculateClassesNeededForTarget(attended, total, SHORTAGE_THRESHOLD);

    return {
      subjectId: subject.id,
      subjectCode: subject.code,
      subjectName: subject.name,
      facultyName: subject.facultyName || 'Faculty',
      total,
      attended,
      missed: Math.max(0, total - attended),
      percentage,
      shortageWarning,
      classesNeededFor75,
    };
  });

  const overallPercentage = calculateAttendancePercentage(attendedClassesAll, totalClassesAll);
  const missedClassesAll = Math.max(0, totalClassesAll - attendedClassesAll);
  const shortageSubjects = subjectStats.filter((s) => s.shortageWarning);

  return {
    totalClasses: totalClassesAll,
    attendedClasses: attendedClassesAll,
    missedClasses: missedClassesAll,
    percentage: overallPercentage,
    shortageWarning: overallPercentage < SHORTAGE_THRESHOLD || shortageSubjects.length > 0,
    shortageCount: shortageSubjects.length,
    subjectStats,
  };
}
