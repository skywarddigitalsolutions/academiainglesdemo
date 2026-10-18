import type { Course } from "@/domain/course";
import { DomainError } from "@/domain/errors";
import {
  applyExamGrades,
  examStats,
  examStatus,
  isoDay,
  publishExam,
  type Exam,
  type ExamGradeChanges,
  type ExamStats,
  type ExamStatus,
} from "@/domain/exam";
import type { GradeValue } from "@/domain/grading";
import type { Student } from "@/domain/student";
import { notFound, type UseCaseDeps } from "./shared";

/*
 * Exams shared by the teacher (assigned courses), Dirección (read-only, any
 * course) and families (published grades of their children only). Access
 * control stays in each role's use cases.
 */

export interface ExamListItem {
  exam: Exam;
  course: Course;
  status: ExamStatus;
  stats: ExamStats;
}

export interface ExamAgenda {
  /** Calendar day used to derive each status (yyyy-mm-dd). */
  today: string;
  courses: Course[];
  /** Oldest first. */
  items: ExamListItem[];
}

export interface ExamDetail extends ExamListItem {
  today: string;
  students: Student[];
}

/** What families may see of an exam: never other students' grades. */
export type ParentExamView = Omit<Exam, "grades" | "createdAt" | "updatedAt">;

export interface ParentExamGrade {
  exam: ParentExamView;
  grade: GradeValue | null;
}

export function today(deps: UseCaseDeps): string {
  return isoDay(deps.clock.now());
}

export function toParentExamView(exam: Exam): ParentExamView {
  return {
    id: exam.id,
    courseId: exam.courseId,
    year: exam.year,
    bimester: exam.bimester,
    date: exam.date,
    type: exam.type,
    topic: exam.topic,
    publishedAt: exam.publishedAt,
  };
}

export async function requireExam(deps: UseCaseDeps, examId: string): Promise<Exam> {
  const exam = await deps.repositories.exams.getById(examId);
  if (!exam) throw notFound("el examen");
  return exam;
}

export async function loadExamAgenda(deps: UseCaseDeps, courses: Course[]): Promise<ExamAgenda> {
  const day = today(deps);
  const perCourse = await Promise.all(
    courses.map(async (course) => {
      const [exams, students] = await Promise.all([
        deps.repositories.exams.listByCourse(course.id, deps.year),
        deps.repositories.students.listByCourse(course.id),
      ]);
      const ids = students.map((s) => s.id);
      return exams.map(
        (exam): ExamListItem => ({
          exam,
          course,
          status: examStatus(exam, day),
          stats: examStats(exam, ids, course.gradingType),
        }),
      );
    }),
  );
  const items = perCourse
    .flat()
    .sort((a, b) => a.exam.date.localeCompare(b.exam.date) || a.exam.id.localeCompare(b.exam.id));
  return { today: day, courses, items };
}

export async function loadExamDetail(
  deps: UseCaseDeps,
  exam: Exam,
  course: Course,
): Promise<ExamDetail> {
  const day = today(deps);
  const students = await deps.repositories.students.listByCourse(course.id);
  return {
    exam,
    course,
    students,
    today: day,
    status: examStatus(exam, day),
    stats: examStats(
      exam,
      students.map((s) => s.id),
      course.gradingType,
    ),
  };
}

function notTakenYet(exam: Exam, deps: UseCaseDeps): void {
  if (exam.date > today(deps)) {
    throw new DomainError(
      "exam-not-taken",
      "Podrá cargar y publicar las notas desde el día del examen.",
    );
  }
}

/** Validates every change before writing; published exams stay published. */
export async function saveExamGradeChanges(
  deps: UseCaseDeps,
  exam: Exam,
  course: Course,
  changes: ExamGradeChanges,
): Promise<ExamDetail> {
  notTakenYet(exam, deps);
  const students = await deps.repositories.students.listByCourse(course.id);
  for (const studentId of Object.keys(changes)) {
    if (!students.some((s) => s.id === studentId)) {
      throw new DomainError("student-not-in-course", "El alumno no pertenece a este curso.");
    }
  }
  const updated = applyExamGrades(exam, changes, course.gradingType, deps.clock.now());
  await deps.repositories.exams.save(updated);
  return loadExamDetail(deps, updated, course);
}

export async function publishExamGrades(
  deps: UseCaseDeps,
  exam: Exam,
  course: Course,
): Promise<ExamDetail> {
  notTakenYet(exam, deps);
  const published = publishExam(exam, deps.clock.now());
  await deps.repositories.exams.save(published);
  return loadExamDetail(deps, published, course);
}
