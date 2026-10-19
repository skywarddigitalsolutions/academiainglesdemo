import { DomainError } from "./errors";
import {
  isValidGrade,
  PASS_MARK,
  type GradeValue,
  type GradingType,
} from "./grading";
import { BIMESTER_NUMBERS, type BimesterNumber } from "./report-card";

/*
 * Exams of a course: dated evaluations the teacher grades and publishes to
 * families directly (no approval by Dirección). They do not replace the
 * bimester grade ("Nota bimestral"): their average is a reference only.
 */

export const EXAM_TYPES = ["written", "oral", "practical", "presentation", "other"] as const;
export type ExamType = (typeof EXAM_TYPES)[number];

const EXAM_TYPE_LABELS: Record<ExamType, string> = {
  written: "Evaluación escrita",
  oral: "Evaluación oral",
  practical: "Trabajo práctico",
  presentation: "Exposición",
  other: "Otro",
};

export function examTypeLabel(type: ExamType): string {
  return EXAM_TYPE_LABELS[type];
}

export type ExamStatus = "upcoming" | "pending-grades" | "published";

export const EXAM_TOPIC_MAX_LENGTH = 120;

/** Time zone that defines "today" for the school. */
export const SCHOOL_TIME_ZONE = "America/Argentina/Buenos_Aires";

export interface Exam {
  id: string;
  courseId: string;
  year: number;
  bimester: BimesterNumber;
  /** Calendar day, yyyy-mm-dd. */
  date: string;
  type: ExamType;
  topic: string;
  /** Grades by student id; students without a grade are not listed. */
  grades: Record<string, GradeValue>;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** What the teacher edits in the exam dialog. */
export interface ExamDetails {
  date: string;
  type: ExamType;
  topic: string;
  bimester: BimesterNumber;
}

/** Grade changes by student id; null clears the grade. */
export type ExamGradeChanges = Record<string, GradeValue | null>;

export interface ExamStats {
  /** Students of the course. */
  total: number;
  graded: number;
  /** Numeric courses only, rounded to two decimals. */
  average: number | null;
  /** Grades at or above the pass mark (not "Desaprobado" for conceptual). */
  atPassMark: number;
}

/* ------------------------------------------------------------------------- */
/* Calendar days                                                              */

export function isIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [y, m, d] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export function addDays(day: string, days: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

const dayFormat = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: SCHOOL_TIME_ZONE,
});

/** Calendar day (yyyy-mm-dd) of an instant in the school time zone. */
export function isoDay(instant: Date): string {
  return dayFormat.format(instant);
}

/* ------------------------------------------------------------------------- */
/* Creation and edition                                                       */

function validateDetails(details: ExamDetails): ExamDetails {
  const topic = details.topic.trim();
  if (topic === "") {
    throw new DomainError("exam-topic-empty", "Indique el tema del examen.");
  }
  if (topic.length > EXAM_TOPIC_MAX_LENGTH) {
    throw new DomainError(
      "exam-topic-too-long",
      `El tema puede tener hasta ${EXAM_TOPIC_MAX_LENGTH} caracteres.`,
    );
  }
  if (!isIsoDate(details.date)) {
    throw new DomainError("exam-invalid-date", "Ingrese una fecha válida.");
  }
  if (!(EXAM_TYPES as readonly string[]).includes(details.type)) {
    throw new DomainError("exam-invalid-type", "Seleccione el tipo de examen.");
  }
  if (!(BIMESTER_NUMBERS as readonly number[]).includes(details.bimester)) {
    throw new DomainError("exam-invalid-bimester", "Seleccione un bimestre del 1 al 4.");
  }
  return { date: details.date, type: details.type, topic, bimester: details.bimester };
}

export function createExam(params: {
  id: string;
  courseId: string;
  year: number;
  details: ExamDetails;
  now: Date;
}): Exam {
  const details = validateDetails(params.details);
  const now = params.now.toISOString();
  return {
    id: params.id,
    courseId: params.courseId,
    year: params.year,
    bimester: details.bimester,
    date: details.date,
    type: details.type,
    topic: details.topic,
    grades: {},
    publishedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

/** Changes date, type, topic or bimester; grades and publication stay. */
export function updateExamDetails(exam: Exam, details: ExamDetails, now: Date): Exam {
  return { ...exam, ...validateDetails(details), updatedAt: now.toISOString() };
}

/* ------------------------------------------------------------------------- */
/* Grades and publication                                                     */

export function applyExamGrades(
  exam: Exam,
  changes: ExamGradeChanges,
  gradingType: GradingType,
  now: Date,
): Exam {
  const grades = { ...exam.grades };
  for (const [studentId, value] of Object.entries(changes)) {
    if (value === null) {
      delete grades[studentId];
      continue;
    }
    if (!isValidGrade(gradingType, value)) {
      throw new DomainError(
        "invalid-grade",
        gradingType === "numeric"
          ? "Las notas numéricas van de 1 a 10."
          : "Use la escala conceptual del curso.",
      );
    }
    grades[studentId] = value;
  }
  return { ...exam, grades, updatedAt: now.toISOString() };
}

/** Makes the grades visible to families. Later corrections stay published. */
export function publishExam(exam: Exam, now: Date): Exam {
  if (Object.keys(exam.grades).length === 0) {
    throw new DomainError("exam-without-grades", "Cargue al menos una nota antes de publicar.");
  }
  if (exam.publishedAt !== null) return exam;
  return { ...exam, publishedAt: now.toISOString(), updatedAt: now.toISOString() };
}

export function examStatus(exam: Exam, today: string): ExamStatus {
  if (exam.publishedAt !== null) return "published";
  return exam.date > today ? "upcoming" : "pending-grades";
}

/* ------------------------------------------------------------------------- */
/* Agenda                                                                     */

export function sortUpcomingFirst<T extends Pick<Exam, "date">>(exams: T[]): T[] {
  return [...exams].sort((a, b) => a.date.localeCompare(b.date));
}

export function sortPastFirst<T extends Pick<Exam, "date">>(exams: T[]): T[] {
  return [...exams].sort((a, b) => b.date.localeCompare(a.date));
}

/** "Próximos" (from today, ascending) and "Anteriores" (descending). */
export function splitAgenda<T extends Pick<Exam, "date">>(
  exams: T[],
  today: string,
): { upcoming: T[]; past: T[] } {
  return {
    upcoming: sortUpcomingFirst(exams.filter((e) => e.date >= today)),
    past: sortPastFirst(exams.filter((e) => e.date < today)),
  };
}

/** Exams from today up to `days` days ahead, ascending. */
export function upcomingWithin<T extends Pick<Exam, "date">>(
  exams: T[],
  today: string,
  days: number,
): T[] {
  const last = addDays(today, days);
  return sortUpcomingFirst(exams.filter((e) => e.date >= today && e.date <= last));
}

/* ------------------------------------------------------------------------- */
/* Summaries                                                                  */

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return round2(values.reduce((sum, v) => sum + v, 0) / values.length);
}

function atPassMark(value: GradeValue): boolean {
  return typeof value === "number" ? value >= PASS_MARK : value !== "Desaprobado";
}

/** Stats over the given students (grades of students no longer in the course are ignored). */
export function examStats(exam: Exam, studentIds: string[], gradingType: GradingType): ExamStats {
  const values = studentIds
    .map((id) => exam.grades[id])
    .filter((v): v is GradeValue => v !== undefined);
  return {
    total: studentIds.length,
    graded: values.length,
    average:
      gradingType === "numeric"
        ? average(values.filter((v): v is number => typeof v === "number"))
        : null,
    atPassMark: values.filter(atPassMark).length,
  };
}

/**
 * Average of the student's numeric exam grades in a bimester. A reference for
 * the teacher only: the bimester grade is always set by the teacher.
 */
export function examAverageForBimester(
  exams: Exam[],
  studentId: string,
  bimester: BimesterNumber,
): number | null {
  return average(
    exams
      .filter((e) => e.bimester === bimester)
      .map((e) => e.grades[studentId])
      .filter((v): v is number => typeof v === "number"),
  );
}
