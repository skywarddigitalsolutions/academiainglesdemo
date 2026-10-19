import { describe, expect, it } from "vitest";
import { DomainError } from "./errors";
import {
  absenceCoversDay,
  absenceDays,
  createTeacherAbsence,
  TEACHER_ABSENCE_REASON_MAX_LENGTH,
  type TeacherAbsence,
} from "./teacher-absence";

const NOW = new Date("2026-10-15T13:00:00.000Z");

function params(over: Partial<Parameters<typeof createTeacherAbsence>[0]> = {}) {
  return {
    id: "abs-1",
    teacherId: "u-teacher-1",
    from: "2026-10-21",
    to: "2026-10-21",
    reason: "Licencia médica",
    now: NOW,
    ...over,
  };
}

function absence(from: string, to: string): TeacherAbsence {
  return {
    id: "a",
    teacherId: "t",
    from,
    to,
    reason: "x",
    createdAt: NOW.toISOString(),
  };
}

describe("createTeacherAbsence", () => {
  it("creates an absence with a trimmed reason", () => {
    expect(createTeacherAbsence(params({ reason: "  Capacitación  ", to: "2026-10-22" }))).toEqual({
      id: "abs-1",
      teacherId: "u-teacher-1",
      from: "2026-10-21",
      to: "2026-10-22",
      reason: "Capacitación",
      createdAt: NOW.toISOString(),
    });
  });

  it("rejects invalid dates", () => {
    expect(() => createTeacherAbsence(params({ from: "21/10/2026" }))).toThrow(DomainError);
    expect(() => createTeacherAbsence(params({ to: "2026-02-30" }))).toThrow(DomainError);
  });

  it("rejects an end date before the start date", () => {
    expect(() => createTeacherAbsence(params({ from: "2026-10-22", to: "2026-10-21" }))).toThrow(
      /hasta/i,
    );
  });

  it("requires a reason of reasonable length", () => {
    expect(() => createTeacherAbsence(params({ reason: "   " }))).toThrow(DomainError);
    expect(() =>
      createTeacherAbsence(params({ reason: "x".repeat(TEACHER_ABSENCE_REASON_MAX_LENGTH + 1) })),
    ).toThrow(DomainError);
  });
});

describe("absenceCoversDay and absenceDays", () => {
  it("covers every day from the start to the end, both included", () => {
    const multi = absence("2026-10-27", "2026-10-29");
    expect(absenceCoversDay(multi, "2026-10-26")).toBe(false);
    expect(absenceCoversDay(multi, "2026-10-27")).toBe(true);
    expect(absenceCoversDay(multi, "2026-10-28")).toBe(true);
    expect(absenceCoversDay(multi, "2026-10-29")).toBe(true);
    expect(absenceCoversDay(multi, "2026-10-30")).toBe(false);
  });

  it("lists the covered days", () => {
    expect(absenceDays(absence("2026-10-30", "2026-11-02"))).toEqual([
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
      "2026-11-02",
    ]);
    expect(absenceDays(absence("2026-10-21", "2026-10-21"))).toEqual(["2026-10-21"]);
  });
});
