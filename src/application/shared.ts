import type { Course } from "@/domain/course";
import { DomainError } from "@/domain/errors";
import { createEmptyReportCard, type ReportCard } from "@/domain/report-card";
import type { Student } from "@/domain/student";
import type { Clock, IdGenerator, Repositories } from "./ports";

export interface UseCaseDeps {
  repositories: Repositories;
  clock: Clock;
  ids: IdGenerator;
  /** School year handled by the app. */
  year: number;
}

export function notFound(what: string): DomainError {
  return new DomainError("not-found", `No se encontró ${what}.`);
}

export function forbidden(): DomainError {
  return new DomainError(
    "forbidden",
    "No tiene permisos para acceder a esta información.",
  );
}

export async function requireStudent(
  deps: UseCaseDeps,
  studentId: string,
): Promise<Student> {
  const student = await deps.repositories.students.getById(studentId);
  if (!student) throw notFound("el alumno");
  return student;
}

export async function requireCourse(
  deps: UseCaseDeps,
  courseId: string,
): Promise<Course> {
  const course = await deps.repositories.courses.getById(courseId);
  if (!course) throw notFound("el curso");
  return course;
}

/** Loads the report card for the current year, creating it when missing. */
export async function loadOrCreateReportCard(
  deps: UseCaseDeps,
  student: Student,
): Promise<ReportCard> {
  const existing = await deps.repositories.reportCards.findByStudent(
    student.id,
    deps.year,
  );
  if (existing) {
    if (existing.courseId === student.courseId) return existing;
    const moved = { ...existing, courseId: student.courseId };
    await deps.repositories.reportCards.save(moved);
    return moved;
  }
  const card = createEmptyReportCard({
    id: `rc-${student.id}-${deps.year}`,
    studentId: student.id,
    courseId: student.courseId,
    year: deps.year,
  });
  await deps.repositories.reportCards.save(card);
  return card;
}

export interface StudentReportCard {
  student: Student;
  course: Course;
  card: ReportCard;
}

export async function loadStudentReportCard(
  deps: UseCaseDeps,
  studentId: string,
): Promise<StudentReportCard> {
  const student = await requireStudent(deps, studentId);
  const course = await requireCourse(deps, student.courseId);
  const card = await loadOrCreateReportCard(deps, student);
  return { student, course, card };
}
