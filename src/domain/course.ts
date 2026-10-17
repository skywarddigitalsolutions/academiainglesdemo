import { DomainError } from "./errors";
import type { GradingType } from "./grading";

export interface Course {
  id: string;
  name: string;
  /** Grading type is defined per course, not by school grade. */
  gradingType: GradingType;
  teacherIds: string[];
  /** Name of the course the student is promoted to (suggestion for the closing). */
  nextCourseName: string;
  schedule: string;
}

export function gradingTypeLabel(type: GradingType): string {
  return type === "conceptual" ? "Conceptual" : "Numérica (1 a 10)";
}

export const GRADING_TYPES: readonly GradingType[] = ["conceptual", "numeric"];

export interface ScheduleParts {
  days: string;
  /** "HH:MM" */
  start: string;
  /** "HH:MM" */
  end: string;
}

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Builds the stored schedule, e.g. "Lunes y miércoles · 14:00 a 15:30". */
export function formatSchedule({ days, start, end }: ScheduleParts): string {
  const trimmedDays = days.trim();
  if (!trimmedDays) {
    throw new DomainError("invalid-schedule", "Indique los días de cursada.");
  }
  if (!TIME.test(start) || !TIME.test(end)) {
    throw new DomainError("invalid-schedule", "Indique el horario de inicio y de fin.");
  }
  if (end <= start) {
    throw new DomainError(
      "invalid-schedule",
      "El horario de fin debe ser posterior al de inicio.",
    );
  }
  return `${trimmedDays} · ${start} a ${end}`;
}

/** Inverse of `formatSchedule`; unknown shapes keep the whole text as days. */
export function parseSchedule(schedule: string): ScheduleParts {
  const match = /^(.*) · (\d{2}:\d{2}) a (\d{2}:\d{2})$/.exec(schedule.trim());
  if (!match) return { days: schedule.trim(), start: "", end: "" };
  return { days: match[1], start: match[2], end: match[3] };
}

/** Normalizes a course and enforces its invariants. */
export function validateCourse(course: Course): Course {
  const name = course.name.trim();
  if (!name) throw new DomainError("invalid-course-name", "Ingrese el nombre del curso.");
  const schedule = course.schedule.trim();
  if (!schedule) throw new DomainError("invalid-schedule", "Indique el horario del curso.");
  if (!GRADING_TYPES.includes(course.gradingType)) {
    throw new DomainError("invalid-grading-type", "Elija un tipo de calificación válido.");
  }
  return {
    ...course,
    name,
    schedule,
    nextCourseName: course.nextCourseName.trim(),
    teacherIds: [...new Set(course.teacherIds)],
  };
}
