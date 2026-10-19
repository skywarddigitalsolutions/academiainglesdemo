import { DomainError } from "./errors";
import type { GradingType } from "./grading";

export type SchoolLevel = "primary" | "secondary";

export const SCHOOL_LEVELS: readonly SchoolLevel[] = ["primary", "secondary"];

export function schoolLevelLabel(level: SchoolLevel): string {
  return level === "primary" ? "Primaria" : "Secundaria";
}

/** Years available per level: 1° a 7° grado, 1° a 5° año. */
export function yearsFor(level: SchoolLevel): number[] {
  const count = level === "primary" ? 7 : 5;
  return Array.from({ length: count }, (_, i) => i + 1);
}

/** "2° Grado A" / "1° Año B". */
export function courseName(level: SchoolLevel, year: number, division: string): string {
  return `${year}° ${level === "primary" ? "Grado" : "Año"} ${division}`;
}

/** Conceptual grading from 1° to 4° grado; numeric from 5° grado onwards and in secondary. */
export function gradingTypeFor(level: SchoolLevel, year: number): GradingType {
  return level === "primary" && year <= 4 ? "conceptual" : "numeric";
}

/** Suggested promotion target; empty after the last secondary year. */
export function nextCourseNameFor(level: SchoolLevel, year: number, division: string): string {
  if (year < yearsFor(level).length) return courseName(level, year + 1, division);
  return level === "primary" ? courseName("secondary", 1, division) : "";
}

export interface Course {
  id: string;
  /** Derived from level, year and division (see `courseName`). */
  name: string;
  level: SchoolLevel;
  year: number;
  /** One uppercase letter, e.g. "A". */
  division: string;
  /** Derived from level and year (see `gradingTypeFor`). */
  gradingType: GradingType;
  teacherIds: string[];
  /** Name of the course the student is promoted to (suggestion for the closing). */
  nextCourseName: string;
  schedule: string;
}

export function gradingTypeLabel(type: GradingType): string {
  return type === "conceptual" ? "Conceptual" : "Numérica (1 a 10)";
}

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

/** Normalizes a course, derives its name and grading type, and enforces its invariants. */
export function validateCourse(course: Course): Course {
  if (!SCHOOL_LEVELS.includes(course.level)) {
    throw new DomainError("invalid-level", "Elija el nivel del curso.");
  }
  if (!Number.isInteger(course.year) || !yearsFor(course.level).includes(course.year)) {
    throw new DomainError(
      "invalid-year",
      course.level === "primary"
        ? "El grado debe estar entre 1° y 7°."
        : "El año debe estar entre 1° y 5°.",
    );
  }
  const division = course.division.trim().toUpperCase();
  if (!/^[A-Z]$/.test(division)) {
    throw new DomainError("invalid-division", "La división debe ser una letra de la A a la Z.");
  }
  const schedule = course.schedule.trim();
  if (!schedule) throw new DomainError("invalid-schedule", "Indique el horario del curso.");
  return {
    ...course,
    name: courseName(course.level, course.year, division),
    division,
    gradingType: gradingTypeFor(course.level, course.year),
    schedule,
    nextCourseName: course.nextCourseName.trim(),
    teacherIds: [...new Set(course.teacherIds)],
  };
}
