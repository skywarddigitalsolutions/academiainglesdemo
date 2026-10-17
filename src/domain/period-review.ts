import { DomainError } from "./errors";
import type { ReportPeriod } from "./report-card";

/*
 * Approval of a course period by Dirección. The teacher sends the complete
 * students of a period as one batch; Dirección approves it (the batch is
 * published to families) or returns it to the teacher with a note.
 * No review (or an approved one) means the teacher works on drafts freely.
 */

export type ReviewStatus = "pending" | "returned" | "approved";

export interface PeriodReview {
  id: string;
  courseId: string;
  year: number;
  period: ReportPeriod;
  status: ReviewStatus;
  /** Students sent in the batch (the ones published on approval). */
  studentIds: string[];
  submittedAt: string;
  submittedBy: string;
  decidedAt: string | null;
  decidedBy: string | null;
  /** Dirección's reason when the batch was returned. */
  returnNote: string | null;
}

export function reviewId(courseId: string, year: number, period: ReportPeriod): string {
  return `rv-${courseId}-${year}-${period}`;
}

function notPending(): DomainError {
  return new DomainError("review-not-pending", "Este período no está pendiente de aprobación.");
}

export function submitReview(
  existing: PeriodReview | null,
  params: {
    courseId: string;
    year: number;
    period: ReportPeriod;
    studentIds: string[];
    teacherId: string;
    now: Date;
  },
): PeriodReview {
  if (existing?.status === "pending") {
    throw new DomainError("review-already-pending", "Este período ya fue enviado a Dirección.");
  }
  if (params.studentIds.length === 0) {
    throw new DomainError(
      "review-empty",
      "No hay alumnos completos sin publicar para enviar a Dirección.",
    );
  }
  return {
    id: reviewId(params.courseId, params.year, params.period),
    courseId: params.courseId,
    year: params.year,
    period: params.period,
    status: "pending",
    studentIds: [...params.studentIds],
    submittedAt: params.now.toISOString(),
    submittedBy: params.teacherId,
    decidedAt: null,
    decidedBy: null,
    returnNote: null,
  };
}

export function approveReview(review: PeriodReview, adminId: string, now: Date): PeriodReview {
  if (review.status !== "pending") throw notPending();
  return { ...review, status: "approved", decidedAt: now.toISOString(), decidedBy: adminId };
}

export function returnReview(
  review: PeriodReview,
  adminId: string,
  note: string,
  now: Date,
): PeriodReview {
  if (review.status !== "pending") throw notPending();
  const text = note.trim();
  if (text === "") {
    throw new DomainError(
      "return-note-required",
      "Escriba una observación para el docente antes de devolver.",
    );
  }
  return {
    ...review,
    status: "returned",
    decidedAt: now.toISOString(),
    decidedBy: adminId,
    returnNote: text,
  };
}

/** Checks that the teacher can take back the batch (the caller deletes it). */
export function withdrawReview(review: PeriodReview): void {
  if (review.status !== "pending") throw notPending();
}

/** While Dirección reviews the batch, the teacher cannot edit the period. */
export function isLockedForTeacher(review: PeriodReview | null | undefined): boolean {
  return review?.status === "pending";
}
