import { describe, expect, it } from "vitest";
import { DomainError } from "./errors";
import {
  approveReview,
  isLockedForTeacher,
  returnReview,
  reviewId,
  submitReview,
  withdrawReview,
  type PeriodReview,
} from "./period-review";

const NOW = new Date("2026-10-15T13:00:00.000Z");
const LATER = new Date("2026-10-16T09:30:00.000Z");

function submitted(): PeriodReview {
  return submitReview(null, {
    courseId: "c-5a",
    year: 2026,
    period: 3,
    studentIds: ["s-08", "s-09"],
    teacherId: "u-teacher-1",
    now: NOW,
  });
}

describe("period review", () => {
  it("builds one id per course, year and period", () => {
    expect(reviewId("c-5a", 2026, 3)).toBe("rv-c-5a-2026-3");
    expect(reviewId("c-5a", 2026, "closing")).toBe("rv-c-5a-2026-closing");
  });

  it("sends a batch of students to Dirección as pending", () => {
    expect(submitted()).toEqual({
      id: "rv-c-5a-2026-3",
      courseId: "c-5a",
      year: 2026,
      period: 3,
      status: "pending",
      studentIds: ["s-08", "s-09"],
      submittedAt: NOW.toISOString(),
      submittedBy: "u-teacher-1",
      decidedAt: null,
      decidedBy: null,
      returnNote: null,
    });
  });

  it("refuses an empty batch or a second submission while pending", () => {
    expect(() =>
      submitReview(null, {
        courseId: "c-5a",
        year: 2026,
        period: 3,
        studentIds: [],
        teacherId: "u-teacher-1",
        now: NOW,
      }),
    ).toThrow(DomainError);
    expect(() =>
      submitReview(submitted(), {
        courseId: "c-5a",
        year: 2026,
        period: 3,
        studentIds: ["s-10"],
        teacherId: "u-teacher-1",
        now: NOW,
      }),
    ).toThrow(DomainError);
  });

  it("re-sends a returned batch and clears the previous decision", () => {
    const returned = returnReview(submitted(), "u-admin", "Revisar conducta.", LATER);
    const again = submitReview(returned, {
      courseId: "c-5a",
      year: 2026,
      period: 3,
      studentIds: ["s-08"],
      teacherId: "u-teacher-1",
      now: LATER,
    });
    expect(again).toMatchObject({
      status: "pending",
      studentIds: ["s-08"],
      submittedAt: LATER.toISOString(),
      decidedAt: null,
      decidedBy: null,
      returnNote: null,
    });
  });

  it("approves a pending batch", () => {
    expect(approveReview(submitted(), "u-admin", LATER)).toMatchObject({
      status: "approved",
      decidedAt: LATER.toISOString(),
      decidedBy: "u-admin",
    });
  });

  it("returns a pending batch with a required note", () => {
    expect(returnReview(submitted(), "u-admin", "  Falta la observación de Bruno. ", LATER)).toMatchObject({
      status: "returned",
      returnNote: "Falta la observación de Bruno.",
      decidedBy: "u-admin",
    });
    expect(() => returnReview(submitted(), "u-admin", "   ", LATER)).toThrow(DomainError);
  });

  it("only decides or withdraws pending batches", () => {
    const approved = approveReview(submitted(), "u-admin", LATER);
    expect(() => approveReview(approved, "u-admin", LATER)).toThrow(DomainError);
    expect(() => returnReview(approved, "u-admin", "x", LATER)).toThrow(DomainError);
    expect(() => withdrawReview(approved)).toThrow(DomainError);
    expect(() => withdrawReview(submitted())).not.toThrow();
  });

  it("locks the teacher's sheet only while pending", () => {
    expect(isLockedForTeacher(null)).toBe(false);
    expect(isLockedForTeacher(submitted())).toBe(true);
    expect(isLockedForTeacher(returnReview(submitted(), "u-admin", "x", LATER))).toBe(false);
    expect(isLockedForTeacher(approveReview(submitted(), "u-admin", LATER))).toBe(false);
  });
});
