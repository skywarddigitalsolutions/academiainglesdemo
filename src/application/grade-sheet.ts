import type { Course } from "@/domain/course";
import { DomainError } from "@/domain/errors";
import { reviewId, type PeriodReview } from "@/domain/period-review";
import {
  getBimester,
  updateBimester,
  updateClosing,
  type BimesterPatch,
  type ClosingPatch,
  type ReportCard,
  type ReportPeriod,
} from "@/domain/report-card";
import type { Student } from "@/domain/student";
import { loadOrCreateReportCard, type UseCaseDeps } from "./shared";

/*
 * Course grade sheet shared by the teacher (assigned courses) and Dirección
 * (any course). Access control stays in each role's use cases.
 */

export interface GradeSheetRow {
  student: Student;
  card: ReportCard;
}

export interface GradeSheet {
  course: Course;
  rows: GradeSheetRow[];
  /** Approval batches of the course, one per period at most. */
  reviews: PeriodReview[];
}

export type GradeSheetChange<P extends ReportPeriod> = {
  studentId: string;
  patch: P extends "closing" ? ClosingPatch : BimesterPatch;
};

export async function loadGradeSheetRows(
  deps: UseCaseDeps,
  course: Course,
): Promise<GradeSheetRow[]> {
  const list = await deps.repositories.students.listByCourse(course.id);
  return Promise.all(
    list.map(async (student) => ({
      student,
      card: await loadOrCreateReportCard(deps, student),
    })),
  );
}

export async function loadGradeSheet(deps: UseCaseDeps, course: Course): Promise<GradeSheet> {
  const [rows, reviews] = await Promise.all([
    loadGradeSheetRows(deps, course),
    deps.repositories.reviews.listByCourse(course.id, deps.year),
  ]);
  return { course, rows, reviews };
}

export function findReview(
  deps: UseCaseDeps,
  courseId: string,
  period: ReportPeriod,
): Promise<PeriodReview | null> {
  return deps.repositories.reviews.getById(reviewId(courseId, deps.year, period));
}

export function isPeriodPublished(card: ReportCard, period: ReportPeriod): boolean {
  return period === "closing"
    ? card.closing.publishedAt !== null
    : getBimester(card, period).publishedAt !== null;
}

/**
 * Saves the changed rows of one period. Unpublished periods stay as drafts and
 * published ones stay published (families see the corrected values). Every row
 * is validated before anything is written. `canChange` lets a role refuse
 * specific rows (e.g. the teacher cannot change published students).
 */
export async function saveGradeSheetChanges<P extends ReportPeriod>(
  deps: UseCaseDeps,
  course: Course,
  period: P,
  changes: GradeSheetChange<P>[],
  canChange: (row: GradeSheetRow) => void = () => {},
): Promise<GradeSheet> {
  const rows = await loadGradeSheetRows(deps, course);
  const updated = changes.map(({ studentId, patch }) => {
    const row = rows.find((r) => r.student.id === studentId);
    if (!row) {
      throw new DomainError("student-not-in-course", "El alumno no pertenece a este curso.");
    }
    canChange(row);
    return period === "closing"
      ? updateClosing(row.card, patch as ClosingPatch, course.gradingType)
      : updateBimester(row.card, period, patch as BimesterPatch, course.gradingType);
  });
  for (const card of updated) await deps.repositories.reportCards.save(card);
  return loadGradeSheet(deps, course);
}
