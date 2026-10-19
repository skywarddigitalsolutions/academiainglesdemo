import { describe, expect, it } from "vitest";
import type { CourseMetrics, StudentMetrics } from "@/application/dashboard";
import {
  comparisonGroups,
  countLabel,
  formatChange,
  formatLongDay,
  formatPercent,
  passFailSegments,
  passFailText,
  progressChange,
  progressRows,
  rankCourses,
  riskBadge,
  scoreLabel,
  trendTone,
} from "./dashboard-model";

function course(id: string, over: Record<string, unknown> = {}): CourseMetrics {
  return {
    course: { id, level: "primary", year: 5, division: "A", gradingType: "numeric" },
    studentCount: 10,
    average: 7,
    passed: 6,
    failed: 2,
    ungraded: 2,
    passRate: 75,
    failRate: 25,
    examsTaken: 2,
    atRisk: [],
    ...over,
  } as unknown as CourseMetrics;
}

function student(id: string, changePct: number | null, trend: "up" | "down" | "flat" | null) {
  return { student: { id }, performance: { changePct, trend } } as unknown as StudentMetrics;
}

function conceptStudent(id: string, levelChange: number | null) {
  const trend = levelChange === null ? null : levelChange > 0 ? "up" : levelChange < 0 ? "down" : "flat";
  return {
    student: { id },
    performance: { gradingType: "conceptual", changePct: null, levelChange, trend },
  } as unknown as StudentMetrics;
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
  it("names the nearest conceptual grade without any number", () => {
    expect(scoreLabel(8.1, "conceptual")).toBe("Muy bien");
    expect(scoreLabel(7.7, "conceptual")).toBe("Bien +");
    expect(scoreLabel(9.8, "conceptual")).toBe("Excelente");
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
  it("marks nothing when the spread is too small to matter", () => {
    const close = [course("a", { passRate: 90.8 }), course("b", { passRate: 90.6 })];
    expect(rankCourses(close, "passRate")).toEqual({ best: [], worst: [] });
    const near = [course("a", { average: 8.2 }), course("b", { average: 8.1 })];
    expect(rankCourses(near, "average")).toEqual({ best: [], worst: [] });
  });
});

describe("rankCourses on conceptual courses", () => {
  it("compares the median concepts through their order", () => {
    const list = [
      course("a", { average: 8, passRate: null, failRate: null }),
      course("b", { average: 7, passRate: null, failRate: null }),
    ];
    expect(rankCourses(list, "average")).toEqual({ best: ["a"], worst: ["b"] });
    expect(rankCourses(list, "passRate")).toEqual({ best: [], worst: [] });
  });
});

describe("comparisonGroups", () => {
  const at = (id: string, level: "primary" | "secondary", year: number, division: string) =>
    course(id, { course: { id, level, year, division } });

  it("groups divisions of the same grade or year and drops single divisions", () => {
    const list = [
      at("2a", "primary", 2, "A"),
      at("1y", "secondary", 1, "A"),
      at("5a", "primary", 5, "A"),
      at("2b", "primary", 2, "B"),
      at("1b", "secondary", 1, "B"),
    ];
    const groups = comparisonGroups(list);
    expect(groups.map((g) => g.title)).toEqual(["2° Grado", "1° Año"]);
    expect(groups[0].courses.map((c) => c.course.id)).toEqual(["2a", "2b"]);
    expect(groups[1].courses.map((c) => c.course.id)).toEqual(["1y", "1b"]);
  });

  it("returns nothing when no grade has two divisions", () => {
    expect(comparisonGroups([at("2a", "primary", 2, "A"), at("3a", "primary", 3, "A")])).toEqual([]);
  });

  it("orders primary before secondary and by year", () => {
    const list = [
      at("2y-a", "secondary", 2, "A"),
      at("2y-b", "secondary", 2, "B"),
      at("3g-a", "primary", 3, "A"),
      at("3g-b", "primary", 3, "B"),
      at("1g-a", "primary", 1, "A"),
      at("1g-b", "primary", 1, "B"),
    ];
    expect(comparisonGroups(list).map((g) => g.title)).toEqual(["1° Grado", "3° Grado", "2° Año"]);
  });
});

describe("passFailText", () => {
  it("adds the percentage for numeric courses only", () => {
    expect(passFailText(course("a"), "passed")).toBe("6 (75 %)");
    expect(passFailText(course("a"), "failed")).toBe("2 (25 %)");
    const conceptual = course("b", {
      course: { id: "b", gradingType: "conceptual" },
      passRate: null,
      failRate: null,
    });
    expect(passFailText(conceptual, "passed")).toBe("6");
    expect(passFailText(conceptual, "failed")).toBe("2");
  });
});

describe("progressChange", () => {
  const perf = (over: Record<string, unknown>) => over as never;

  it("keeps the percentage for numeric courses", () => {
    expect(progressChange(perf({ gradingType: "numeric", changePct: 12.5, trend: "up" }))).toEqual({
      text: "+12,5 %",
      detail: null,
    });
  });

  it("describes conceptual changes as scale levels", () => {
    const up = perf({
      gradingType: "conceptual",
      levelChange: 2,
      previous: { score: 7 },
      latest: { score: 8 },
    });
    expect(progressChange(up)).toEqual({ text: "+2 niveles", detail: "Bien → Muy bien" });
    const one = perf({
      gradingType: "conceptual",
      levelChange: 1,
      previous: { score: 8 },
      latest: { score: 9 },
    });
    expect(progressChange(one).text).toBe("+1 nivel");
    const down = perf({
      gradingType: "conceptual",
      levelChange: -3,
      previous: { score: 8 },
      latest: { score: 6 },
    });
    expect(progressChange(down)).toEqual({ text: "−3 niveles", detail: "Muy bien → Regular" });
    const same = perf({
      gradingType: "conceptual",
      levelChange: 0,
      previous: { score: 7 },
      latest: { score: 7 },
    });
    expect(progressChange(same)).toEqual({ text: "Sin cambios", detail: "Bien → Bien" });
  });

  it("shows a dash without two graded bimesters", () => {
    expect(
      progressChange(perf({ gradingType: "conceptual", levelChange: null, previous: null, latest: null })),
    ).toEqual({ text: "—", detail: null });
  });
});

describe("countLabel", () => {
  it("agrees the noun with the count", () => {
    expect(countLabel(1, "alumno", "alumnos")).toBe("1 alumno");
    expect(countLabel(0, "alumno", "alumnos")).toBe("0 alumnos");
    expect(countLabel(3, "desaprobado", "desaprobados")).toBe("3 desaprobados");
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

describe("progressRows on conceptual courses", () => {
  it("orders by the biggest level change", () => {
    const list = [conceptStudent("a", 1), conceptStudent("b", 3), conceptStudent("c", -2), conceptStudent("d", -1)];
    const ids = (rows: StudentMetrics[]) => rows.map((r) => r.student.id);
    expect(ids(progressRows(list, "improved"))).toEqual(["b", "a"]);
    expect(ids(progressRows(list, "declined"))).toEqual(["c", "d"]);
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
