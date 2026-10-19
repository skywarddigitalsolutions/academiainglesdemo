import { describe, expect, it } from "vitest";
import type { CourseMetrics, StudentMetrics } from "@/application/dashboard";
import {
  formatChange,
  formatLongDay,
  formatPercent,
  passFailSegments,
  progressRows,
  rankCourses,
  riskBadge,
  scoreLabel,
  trendTone,
} from "./dashboard-model";

function course(id: string, over: Record<string, unknown> = {}): CourseMetrics {
  return {
    course: { id },
    studentCount: 10,
    average: 7,
    passed: 6,
    failed: 2,
    ungraded: 2,
    passRate: 75,
    failRate: 25,
    absencesPerStudent: 2,
    attendanceRate: 90,
    examsTaken: 2,
    atRisk: [],
    ...over,
  } as unknown as CourseMetrics;
}

function student(id: string, changePct: number | null, trend: "up" | "down" | "flat" | null) {
  return { student: { id }, performance: { changePct, trend } } as unknown as StudentMetrics;
}

describe("formatPercent", () => {
  it("uses the decimal comma and a space before the sign", () => {
    expect(formatPercent(68.4)).toBe("68,4 %");
    expect(formatPercent(70)).toBe("70 %");
  });
  it("shows a dash without data", () => {
    expect(formatPercent(null)).toBe("—");
  });
});

describe("formatChange", () => {
  it("signs the change with one decimal", () => {
    expect(formatChange(12.5)).toBe("+12,5 %");
    expect(formatChange(-8)).toBe("−8,0 %");
    expect(formatChange(0)).toBe("0,0 %");
  });
  it("shows a dash without a previous bimester", () => {
    expect(formatChange(null)).toBe("—");
  });
});

describe("trendTone", () => {
  it("maps trends to status tones", () => {
    expect(trendTone("up")).toBe("success");
    expect(trendTone("down")).toBe("danger");
    expect(trendTone("flat")).toBe("neutral");
    expect(trendTone(null)).toBe("neutral");
  });
});

describe("riskBadge", () => {
  it("labels every level", () => {
    expect(riskBadge("high")).toEqual({ label: "Riesgo alto", tone: "danger" });
    expect(riskBadge("medium")).toEqual({ label: "Riesgo medio", tone: "warning" });
    expect(riskBadge("none")).toEqual({ label: "Sin riesgo", tone: "success" });
  });
});

describe("scoreLabel", () => {
  it("formats numeric scores", () => {
    expect(scoreLabel(7.5, "numeric")).toBe("7,5");
    expect(scoreLabel(null, "numeric")).toBe("—");
  });
  it("names the nearest conceptual grade with its equivalent", () => {
    expect(scoreLabel(8.5, "conceptual")).toBe("Muy bueno (8,5)");
    expect(scoreLabel(7.7, "conceptual")).toBe("Bueno (7)");
    expect(scoreLabel(9.4, "conceptual")).toBe("Excelente (10)");
    expect(scoreLabel(null, "conceptual")).toBe("—");
  });
});

describe("rankCourses", () => {
  it("marks the highest as best and the lowest as worst", () => {
    const list = [course("a", { average: 8 }), course("b", { average: 6 }), course("c", { average: 7 })];
    expect(rankCourses(list, "average")).toEqual({ best: ["a"], worst: ["b"] });
  });
  it("inverts the direction for metrics where lower is better", () => {
    const list = [course("a", { failRate: 40 }), course("b", { failRate: 10 })];
    expect(rankCourses(list, "failRate")).toEqual({ best: ["b"], worst: ["a"] });
  });
  it("counts at-risk students per course", () => {
    const list = [
      course("a", { atRisk: [1, 2] }),
      course("b", { atRisk: [] }),
    ];
    expect(rankCourses(list, "atRisk")).toEqual({ best: ["b"], worst: ["a"] });
  });
  it("ignores missing values and marks nothing when there is no contrast", () => {
    const list = [course("a", { average: null }), course("b", { average: 7 })];
    expect(rankCourses(list, "average")).toEqual({ best: [], worst: [] });
    const ties = [course("a"), course("b")];
    expect(rankCourses(ties, "average")).toEqual({ best: [], worst: [] });
  });
});

describe("progressRows", () => {
  const list = [
    student("s1", 5, "up"),
    student("s2", -20, "down"),
    student("s3", 30, "up"),
    student("s4", null, null),
    student("s5", -3, "down"),
  ];
  const ids = (rows: StudentMetrics[]) => rows.map((r) => r.student.id);
  it("keeps everyone in order for 'all'", () => {
    expect(ids(progressRows(list, "all"))).toEqual(["s1", "s2", "s3", "s4", "s5"]);
  });
  it("lists who improved, biggest gain first", () => {
    expect(ids(progressRows(list, "improved"))).toEqual(["s3", "s1"]);
  });
  it("lists who declined, biggest drop first", () => {
    expect(ids(progressRows(list, "declined"))).toEqual(["s2", "s5"]);
  });
});

describe("passFailSegments", () => {
  it("splits the roster into percentages", () => {
    expect(passFailSegments(course("a"))).toEqual({ passed: 60, failed: 20, ungraded: 20 });
  });
  it("is all zero for an empty course", () => {
    expect(passFailSegments(course("a", { studentCount: 0, passed: 0, failed: 0, ungraded: 0 }))).toEqual({
      passed: 0,
      failed: 0,
      ungraded: 0,
    });
  });
});

describe("formatLongDay", () => {
  it("writes the day in words", () => {
    expect(formatLongDay("2026-10-18")).toBe("18 de octubre de 2026");
    expect(formatLongDay("2026-03-01")).toBe("1 de marzo de 2026");
  });
});
