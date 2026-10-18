import { describe, expect, it } from "vitest";
import type { Exam } from "@/domain/exam";
import {
  examGradeChanges,
  examGradeTexts,
  examStatusBadge,
  formatStatsSummary,
  relativeDayLabel,
} from "./exam-model";

const exam: Exam = {
  id: "ex-1",
  courseId: "c-5a",
  year: 2026,
  bimester: 3,
  date: "2026-10-06",
  type: "written",
  topic: "Unit 4",
  grades: { "s-08": 7.5, "s-09": 9 },
  publishedAt: null,
  createdAt: "2026-10-01T10:00:00.000Z",
  updatedAt: "2026-10-01T10:00:00.000Z",
};

describe("exam grade texts", () => {
  it("shows stored grades with a decimal comma and blanks for the rest", () => {
    expect(examGradeTexts(exam, ["s-08", "s-09", "s-10"])).toEqual({
      "s-08": "7,5",
      "s-09": "9",
      "s-10": "",
    });
  });
});

describe("exam grade changes", () => {
  it("returns only the changed cells, clearing blanks", () => {
    const result = examGradeChanges(
      exam,
      { "s-08": "7,5", "s-09": "", "s-10": "6.25", "s-11": "" },
      "numeric",
    );
    expect(result).toEqual({ changes: { "s-09": null, "s-10": 6.25 }, invalid: [] });
  });

  it("reports the cells that are not valid grades", () => {
    expect(examGradeChanges(exam, { "s-08": "11", "s-10": "abc" }, "numeric").invalid).toEqual([
      "s-08",
      "s-10",
    ]);
    expect(examGradeChanges(exam, { "s-01": "Bueno" }, "conceptual")).toEqual({
      changes: { "s-01": "Bueno" },
      invalid: [],
    });
  });
});

describe("exam status badge", () => {
  it("maps each status to a label and tone", () => {
    expect(examStatusBadge("upcoming")).toEqual({ label: "Próximo", tone: "info" });
    expect(examStatusBadge("pending-grades")).toEqual({
      label: "Pendiente de calificar",
      tone: "warning",
    });
    expect(examStatusBadge("published")).toEqual({ label: "Publicado", tone: "success" });
  });
});

describe("exam stats summary", () => {
  it("describes numeric and conceptual results without deciding them", () => {
    expect(formatStatsSummary({ total: 8, graded: 6, average: 7.25, atPassMark: 5 })).toEqual([
      "6 de 8 calificados",
      "Promedio 7,25",
      "5 con nota de aprobación",
    ]);
    expect(formatStatsSummary({ total: 7, graded: 1, average: null, atPassMark: 1 })).toEqual([
      "1 de 7 calificados",
      "1 con nota de aprobación",
    ]);
    expect(formatStatsSummary({ total: 7, graded: 0, average: null, atPassMark: 0 })).toEqual([
      "0 de 7 calificados",
    ]);
  });
});

describe("relative day label", () => {
  it("names today, tomorrow and the next days", () => {
    expect(relativeDayLabel("2026-10-15", "2026-10-15")).toBe("Hoy");
    expect(relativeDayLabel("2026-10-16", "2026-10-15")).toBe("Mañana");
    expect(relativeDayLabel("2026-10-20", "2026-10-15")).toBe("En 5 días");
    expect(relativeDayLabel("2026-10-10", "2026-10-15")).toBeNull();
  });
});
