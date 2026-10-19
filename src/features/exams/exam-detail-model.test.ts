import { describe, expect, it } from "vitest";
import {
  conceptualAverageLabel,
  gradeDistribution,
  guideSteps,
  liveExamStats,
  longDateLabel,
  rowState,
  upcomingLead,
} from "./exam-detail-model";

describe("rowState", () => {
  it("classifies numeric texts", () => {
    expect(rowState("7,5", "numeric")).toBe("pass");
    expect(rowState("6", "numeric")).toBe("pass");
    expect(rowState("5,9", "numeric")).toBe("fail");
    expect(rowState("", "numeric")).toBe("empty");
    expect(rowState("  ", "numeric")).toBe("empty");
    expect(rowState("11", "numeric")).toBe("invalid");
    expect(rowState("abc", "numeric")).toBe("invalid");
  });

  it("classifies conceptual texts", () => {
    expect(rowState("Regular", "conceptual")).toBe("pass");
    expect(rowState("Insuficiente", "conceptual")).toBe("fail");
    expect(rowState("", "conceptual")).toBe("empty");
    expect(rowState("Genial", "conceptual")).toBe("invalid");
  });
});

describe("liveExamStats", () => {
  it("counts from the current texts, ignoring blanks and invalid cells", () => {
    const stats = liveExamStats({ a: "8", b: "4", c: "", d: "x", e: "6" }, "numeric");
    expect(stats).toMatchObject({ total: 5, graded: 3, passed: 2, failed: 1, invalid: 1 });
    expect(stats.average).toBe(6);
    expect(stats.passedPct).toBe(67);
    expect(stats.failedPct).toBe(33);
  });

  it("has no average or percentages without grades", () => {
    const stats = liveExamStats({ a: "", b: "" }, "numeric");
    expect(stats).toMatchObject({ graded: 0, average: null, passedPct: 0, failedPct: 0 });
  });

  it("averages conceptual grades through their numeric equivalence", () => {
    const stats = liveExamStats({ a: "Excelente", b: "Bueno" }, "conceptual");
    expect(stats.average).toBe(8.5);
    expect(stats.passed).toBe(2);
  });
});

describe("conceptualAverageLabel", () => {
  it("returns the nearest label with its equivalence", () => {
    expect(conceptualAverageLabel(8.5)).toBe("Muy bueno (8,5)");
    expect(conceptualAverageLabel(7.9)).toBe("Muy bueno (8,5)");
    expect(conceptualAverageLabel(5)).toBe("Regular (6)");
    expect(conceptualAverageLabel(null)).toBe("—");
  });
});

describe("gradeDistribution", () => {
  it("groups numeric grades in bands", () => {
    const bands = gradeDistribution({ a: "2", b: "5", c: "6,5", d: "9", e: "10", f: "" }, "numeric");
    expect(bands.map((b) => [b.label, b.count])).toEqual([
      ["1 a 3", 1],
      ["4 a 5", 1],
      ["6 a 7", 1],
      ["8 a 10", 2],
    ]);
  });

  it("groups conceptual grades by label", () => {
    const bands = gradeDistribution({ a: "Bueno", b: "Bueno", c: "Insuficiente" }, "conceptual");
    expect(bands.find((b) => b.label === "Bueno")?.count).toBe(2);
    expect(bands.find((b) => b.label === "Insuficiente")?.count).toBe(1);
    expect(bands).toHaveLength(5);
  });
});

describe("guideSteps", () => {
  it("highlights the first unfinished step", () => {
    expect(guideSteps({ allGraded: false, dirty: false, published: false }).map((s) => s.state)).toEqual([
      "current",
      "todo",
      "todo",
    ]);
    expect(guideSteps({ allGraded: true, dirty: true, published: false }).map((s) => s.state)).toEqual([
      "done",
      "current",
      "todo",
    ]);
    expect(guideSteps({ allGraded: true, dirty: false, published: false }).map((s) => s.state)).toEqual([
      "done",
      "done",
      "current",
    ]);
    expect(guideSteps({ allGraded: true, dirty: false, published: true }).map((s) => s.state)).toEqual([
      "done",
      "done",
      "done",
    ]);
  });
});

describe("dates", () => {
  it("writes the long date", () => {
    expect(longDateLabel("2026-10-21")).toBe("miércoles 21 de octubre de 2026");
    expect(longDateLabel("2026-01-01")).toBe("jueves 1 de enero de 2026");
  });

  it("says how far the exam is", () => {
    expect(upcomingLead("2026-10-18", "2026-10-18")).toBe("hoy");
    expect(upcomingLead("2026-10-19", "2026-10-18")).toBe("mañana");
    expect(upcomingLead("2026-10-21", "2026-10-18")).toBe("faltan 3 días");
  });
});
