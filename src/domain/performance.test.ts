import { describe, expect, it } from "vitest";
import type { GradeValue } from "./grading";
import {
  averageOf,
  compareRisk,
  CONCEPTUAL_SCORE,
  gradeScore,
  levelsBetween,
  medianConcept,
  nearestConcept,
  percentChange,
  studentPerformance,
} from "./performance";
import { createEmptyReportCard, type ReportCard } from "./report-card";

function card(
  grades: (GradeValue | null)[],
  options: { closing?: Partial<ReportCard["closing"]> } = {},
): ReportCard {
  const base = createEmptyReportCard({ id: "rc", studentId: "s", courseId: "c", year: 2026 });
  return {
    ...base,
    bimesters: base.bimesters.map((b, i) => ({
      ...b,
      applicationGrade: grades[i] ?? null,
    })),
    closing: { ...base.closing, ...options.closing },
  };
}

describe("gradeScore", () => {
  it("maps conceptual grades and passes numbers through", () => {
    expect(CONCEPTUAL_SCORE).toEqual({
      Excelente: 10,
      "Muy bien +": 9,
      "Muy bien": 8,
      "Bien +": 7.5,
      Bien: 7,
      Regular: 6,
      Desaprobado: 4,
    });
    expect(gradeScore("Muy bien")).toBe(8);
    expect(gradeScore(7.5)).toBe(7.5);
    expect(gradeScore(null)).toBeNull();
    expect(gradeScore(undefined)).toBeNull();
  });
});

describe("averageOf and percentChange", () => {
  it("averages with two decimals", () => {
    expect(averageOf([])).toBeNull();
    expect(averageOf([7, 8, 8])).toBe(7.67);
  });

  it("computes the change with one decimal", () => {
    expect(percentChange(8, 9)).toBe(12.5);
    expect(percentChange(8, 7)).toBe(-12.5);
    expect(percentChange(6, 6)).toBe(0);
  });

  it("returns null without a usable previous value", () => {
    expect(percentChange(0, 5)).toBeNull();
    expect(percentChange(null, 5)).toBeNull();
    expect(percentChange(5, null)).toBeNull();
  });
});

describe("studentPerformance", () => {
  it("summarizes a numeric card", () => {
    const p = studentPerformance(card([8, 9, null, null])) ;
    expect(p.scores).toEqual([8, 9, null, null]);
    expect(p.average).toBe(8.5);
    expect(p.gradedBimesters).toBe(2);
    expect(p.latest).toEqual({ bimester: 2, score: 9 });
    expect(p.previous).toEqual({ bimester: 1, score: 8 });
    expect(p.changePct).toBe(12.5);
    expect(p.trend).toBe("up");
    expect(p.standing).toBe("passed");
    expect(p).not.toHaveProperty("absences");
    expect(p).not.toHaveProperty("attendance");
    expect(p.risk).toEqual({ level: "none", reasons: [] });
  });

  it("converts conceptual grades", () => {
    const p = studentPerformance(card(["Bien", "Excelente", null, null]));
    expect(p.scores).toEqual([7, 10, null, null]);
    expect(p.average).toBe(8.5);
  });

  it("is ungraded without grades", () => {
    const p = studentPerformance(card([null, null, null, null]));
    expect(p).toMatchObject({
      average: null,
      latest: null,
      previous: null,
      changePct: null,
      trend: null,
      standing: "ungraded",
    });
    expect(p.risk.level).toBe("none");
  });

  it("has no trend with a single graded bimester", () => {
    const p = studentPerformance(card([8, null, null, null]));
    expect(p.previous).toBeNull();
    expect(p.trend).toBeNull();
  });

  it("flags flat and down trends", () => {
    expect(studentPerformance(card([8, 8.05, null, null])).trend).toBe("flat");
    expect(studentPerformance(card([8, 7, null, null])).trend).toBe("down");
  });

  it("skips ungraded bimesters when picking latest and previous", () => {
    const p = studentPerformance(card([6, null, 9, null]));
    expect(p.latest).toEqual({ bimester: 3, score: 9 });
    expect(p.previous).toEqual({ bimester: 1, score: 6 });
  });

  it("fails when the average is below the pass mark", () => {
    const p = studentPerformance(card([5, 5.5, null, null]));
    expect(p.standing).toBe("failed");
  });

  describe("march risk", () => {
    it("is high for a final exam result", () => {
      const p = studentPerformance(
        card([8, 8, null, null], { closing: { result: "Va a examen final" } }));
      expect(p.risk.level).toBe("high");
      expect(p.risk.reasons).toContain("Figura para rendir examen final");
    });

    it("is high when the final result is march", () => {
      const p = studentPerformance(
        card([8, 8, null, null], { closing: { finalResult: { kind: "march" } } }));
      expect(p.risk.level).toBe("high");
    });

    it("is high with an average below 6", () => {
      const p = studentPerformance(card([5, 5, null, null]));
      expect(p.risk.level).toBe("high");
      expect(p.risk.reasons).toContain("Promedio por debajo de 6");
    });

    it("is high when the last two graded bimesters fail", () => {
      const p = studentPerformance(card([9, 5, 5, null]));
      expect(p.average).toBe(6.33);
      expect(p.risk.level).toBe("high");
      expect(p.risk.reasons).toContain("Desaprobó los dos últimos bimestres");
    });

    it("is medium when only the latest bimester fails", () => {
      const p = studentPerformance(card([9, 9, 5.5, null]));
      expect(p.risk.level).toBe("medium");
      expect(p.risk.reasons).toContain("Desaprobó el último bimestre");
    });

    it("is medium on a sharp drop with an average below 7", () => {
      const p = studentPerformance(card([7, 6, null, null]));
      expect(p.average).toBe(6.5);
      expect(p.risk.level).toBe("medium");
      expect(p.risk.reasons).toEqual(["Bajó 14,3% respecto del bimestre anterior"]);
    });

    it("does not flag a drop when the average is 7 or more", () => {
      const p = studentPerformance(card([10, 8, null, null]));
      expect(p.risk.level).toBe("none");
    });

    it("keeps the highest level and every reason", () => {
      const p = studentPerformance(card([6, 5, 5, null]));
      expect(p.risk.level).toBe("high");
      expect(p.risk.reasons).toEqual(
        expect.arrayContaining([
          "Desaprobó los dos últimos bimestres",
          "Desaprobó el último bimestre",
        ]),
      );
    });
  });
});

describe("compareRisk", () => {
  it("orders high first and then the lower average", () => {
    const high = studentPerformance(card([5, 5, null, null]));
    const lowerHigh = studentPerformance(card([4, 4, null, null]));
    const medium = studentPerformance(card([9, 5.5, null, null]));
    const sorted = [medium, high, lowerHigh].sort(compareRisk);
    expect(sorted).toEqual([lowerHigh, high, medium]);
  });
});

describe("conceptual helpers", () => {
  it("finds the concept closest to a score", () => {
    expect(nearestConcept(8.1)).toBe("Muy bien");
    expect(nearestConcept(7.7)).toBe("Bien +");
    expect(nearestConcept(4)).toBe("Desaprobado");
  });

  it("takes the median concept, the lower middle one on even counts", () => {
    expect(medianConcept([])).toBeNull();
    expect(medianConcept(["Bien"])).toBe("Bien");
    expect(medianConcept(["Excelente", "Bien", "Regular"])).toBe("Bien");
    expect(medianConcept(["Excelente", "Desaprobado"])).toBe("Desaprobado");
    expect(medianConcept(["Muy bien", "Bien", "Excelente", "Regular"])).toBe("Bien");
  });

  it("counts the steps between two concepts, positive when improving", () => {
    expect(levelsBetween("Bien", "Muy bien")).toBe(2);
    expect(levelsBetween("Excelente", "Regular")).toBe(-5);
    expect(levelsBetween("Bien", "Bien")).toBe(0);
  });
});

describe("studentPerformance on a conceptual course", () => {
  const perf = (grades: (GradeValue | null)[], closing = {}) =>
    studentPerformance(card(grades, { closing }), "conceptual");

  it("summarizes the median concept and the level change", () => {
    const p = perf(["Bien", "Muy bien", null, null]);
    expect(p.gradingType).toBe("conceptual");
    expect(p.concept).toBe("Bien");
    expect(p.average).toBe(CONCEPTUAL_SCORE["Bien"]);
    expect(p.levelChange).toBe(2);
    expect(p.changePct).toBeNull();
    expect(p.trend).toBe("up");
    expect(p.standing).toBe("passed");
    expect(p.risk).toEqual({ level: "none", reasons: [] });
  });

  it("flags down and flat level changes", () => {
    expect(perf(["Muy bien", "Bien", null, null]).trend).toBe("down");
    const same = perf(["Bien", "Bien", null, null]);
    expect(same.trend).toBe("flat");
    expect(same.levelChange).toBe(0);
  });

  it("has no change with a single graded bimester", () => {
    const p = perf(["Bien", null, null, null]);
    expect(p.levelChange).toBeNull();
    expect(p.trend).toBeNull();
  });

  it("is ungraded without grades", () => {
    const p = perf([null, null, null, null]);
    expect(p.standing).toBe("ungraded");
    expect(p.concept).toBeNull();
    expect(p.average).toBeNull();
  });

  it("fails only when the median concept is Desaprobado", () => {
    expect(perf(["Regular", "Regular", null, null]).standing).toBe("passed");
    expect(perf(["Desaprobado", "Excelente", null, null]).standing).toBe("failed");
    expect(perf(["Desaprobado", "Regular", "Excelente", null]).standing).toBe("passed");
  });

  describe("risk", () => {
    it("is high for a final exam result", () => {
      const p = perf(["Muy bien", "Muy bien", null, null], { result: "Va a examen final" });
      expect(p.risk.level).toBe("high");
      expect(p.risk.reasons).toContain("Figura para rendir examen final");
    });

    it("is high when the last two graded bimesters are Desaprobado", () => {
      const p = perf(["Excelente", "Desaprobado", "Desaprobado", null]);
      expect(p.risk.level).toBe("high");
      expect(p.risk.reasons).toContain("Desaprobó los dos últimos bimestres");
    });

    it("is high when the median concept is Desaprobado", () => {
      const p = perf(["Desaprobado", "Excelente", null, null]);
      expect(p.risk.level).toBe("high");
      expect(p.risk.reasons).toContain("Su concepto general es Desaprobado");
    });

    it("is medium when only the latest bimester is Desaprobado", () => {
      const p = perf(["Muy bien", "Bien", "Desaprobado", null]);
      expect(p.risk.level).toBe("medium");
      expect(p.risk.reasons).toEqual(["Desaprobó el último bimestre"]);
    });

    it("is medium when the latest is Regular after dropping two or more levels", () => {
      const p = perf(["Muy bien", "Regular", null, null]);
      expect(p.risk.level).toBe("medium");
      expect(p.risk.reasons).toEqual(["Bajó de Muy bien a Regular (3 niveles)"]);
    });

    it("does not flag a Regular that dropped a single level", () => {
      expect(perf(["Bien", "Regular", null, null]).risk.level).toBe("none");
    });

    it("does not flag a big drop that ends above Regular", () => {
      expect(perf(["Excelente", "Bien", null, null]).risk.level).toBe("none");
    });
  });
});
