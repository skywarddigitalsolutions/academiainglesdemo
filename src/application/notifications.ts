import type { Exam } from "@/domain/exam";
import type { GradeValue } from "@/domain/grading";
import type { BimesterNumber, ReportCard } from "@/domain/report-card";
import type { Student } from "@/domain/student";

/*
 * Family notifications for the demo: not a stored feed, but what the seed data
 * already says happened (a boletín or an exam grade was published), so every
 * notice is true and links to something the family can open.
 */

interface BaseNotification {
  /** Stable, so read state survives reloads. */
  id: string;
  studentId: string;
  studentName: string;
  /** When the teacher published it (ISO timestamp). */
  publishedAt: string;
}

export interface ReportCardNotification extends BaseNotification {
  kind: "report-card";
  bimester: BimesterNumber;
}

export interface ExamGradeNotification extends BaseNotification {
  kind: "exam-grade";
  examId: string;
  topic: string;
  grade: GradeValue;
}

export type ParentNotification = ReportCardNotification | ExamGradeNotification;

export interface NotificationSource {
  student: Student;
  card: ReportCard;
  exams: Exam[];
}

/** Notices of every child, newest first, at most `limit`. */
export function buildParentNotifications(
  sources: NotificationSource[],
  limit = 10,
): ParentNotification[] {
  const list: ParentNotification[] = [];
  for (const { student, card, exams } of sources) {
    const base = { studentId: student.id, studentName: student.firstName };
    for (const b of card.bimesters) {
      if (b.publishedAt === null) continue;
      list.push({
        ...base,
        id: `report-card:${student.id}:${b.number}`,
        kind: "report-card",
        bimester: b.number,
        publishedAt: b.publishedAt,
      });
    }
    for (const exam of exams) {
      const grade = exam.grades[student.id];
      // Only published exams, and only when this child has a grade in them.
      if (exam.publishedAt === null || grade === undefined || grade === null) continue;
      list.push({
        ...base,
        id: `exam:${student.id}:${exam.id}`,
        kind: "exam-grade",
        examId: exam.id,
        topic: exam.topic,
        grade,
        publishedAt: exam.publishedAt,
      });
    }
  }
  return list
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id))
    .slice(0, limit);
}
