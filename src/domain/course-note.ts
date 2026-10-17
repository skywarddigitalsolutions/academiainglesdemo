import { DomainError } from "./errors";
import type { ReportPeriod } from "./report-card";

/** A note from Dirección to the teachers of a course (optionally about a period). */
export interface CourseNote {
  id: string;
  courseId: string;
  year: number;
  authorId: string;
  authorName: string;
  createdAt: string;
  text: string;
  period: ReportPeriod | null;
}

export const COURSE_NOTE_MAX_LENGTH = 1000;

export function createCourseNote(params: {
  id: string;
  courseId: string;
  year: number;
  authorId: string;
  authorName: string;
  text: string;
  period: ReportPeriod | null;
  now: Date;
}): CourseNote {
  const text = params.text.trim();
  if (text === "") {
    throw new DomainError("note-empty", "Escriba el texto de la nota.");
  }
  if (text.length > COURSE_NOTE_MAX_LENGTH) {
    throw new DomainError(
      "note-too-long",
      `La nota puede tener hasta ${COURSE_NOTE_MAX_LENGTH} caracteres.`,
    );
  }
  return {
    id: params.id,
    courseId: params.courseId,
    year: params.year,
    authorId: params.authorId,
    authorName: params.authorName,
    createdAt: params.now.toISOString(),
    text,
    period: params.period,
  };
}

/** Notes written after the teacher last opened the course (`seenAt`). */
export function unreadNoteCount(notes: CourseNote[], seenAt: string | null): number {
  if (seenAt === null) return notes.length;
  return notes.filter((n) => n.createdAt > seenAt).length;
}
