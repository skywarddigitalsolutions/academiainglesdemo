import { describe, expect, it } from "vitest";
import type { GradeValue } from "./grading";
import {
  attendanceRate,
  averageOf,
  classesPerBimester,
  compareRisk,
  CONCEPTUAL_SCORE,
  gradeScore,
  percentChange,
  studentPerformance,
} from "./performance";
import { createEmptyReportCard, type ReportCard } from "./report-card";

const TWICE_A_WEEK = "Lunes y miércoles · 14:00 a 15:30"; // 16 classes per bimester

function card(
  grades: (GradeValue | null)[],
  options: { absences?: number[]; closing?: Partial<ReportCard["closing"]> } = {},
): ReportCard {
  const base = createEmptyReportCard({ id: "rc", studentId: "s", courseId: "c", year: 2026 });
  return {
    ...base,
    bimesters: base.bimesters.map((b, i) => ({
      ...b,
      applicationGrade: grades[i] ?? null,
      absences: options.absences?.[i] ?? 0,
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

describe("classesPerBimester", () => {
  it("counts distinct weekdays times eight weeks", () => {
    expect(classesPerBimester(TWICE_A_WEEK)).toBe(16);
    expect(classesPerBimester("Martes, jueves y viernes · 10:00 a 11:00")).toBe(24);
    expect(classesPerBimester("MIERCOLES y Sábado")).toBe(16);
    expect(classesPerBimester("Lunes y lunes")).toBe(8);
  });

  it("falls back to one weekday", () => {
    expect(classesPerBimester("A coordinar")).toBe(8);
  });
});

describe("attendanceRate", () => {
  it("returns a clamped percentage", () => {
    expect(attendanceRate(2, 16)).toBe(87.5);
    expect(attendanceRate(0, 16)).toBe(100);
    expect(attendanceRate(40, 16)).toBe(0);
  });

  it("is null without classes", () => {
    expect(attendanceRate(1, 0)).toBeNull();
  });
});

describe("studentPerformance", () => {
  it("summarizes a numeric card", () => {
    const p = studentPerformance(card([8, 9, null, null], { absences: [1, 2, 0, 0] }), TWICE_A_WEEK);
    expect(p.scores).toEqual([8, 9, null, null]);
    expect(p.average).toBe(8.5);
    expect(p.gradedBimesters).toBe(2);
    expect(p.latest).toEqual({ bimester: 2, score: 9 });
    expect(p.previous).toEqual({ bimester: 1, score: 8 });
    expect(p.changePct).toBe(12.5);
    expect(p.trend).toBe("up");
    expect(p.standing).toBe("passed");
    expect(p.absences).toEqual({ total: 3, byBimester: [1, 2, 0, 0] });
    expect(p.attendance).toBe(90.6); // 1 - 3/32
    expect(p.risk).toEqual({ level: "none", reasons: [] });
  });

  it("converts conceptual grades", () => {
    const p = studentPerformance(card(["Bien", "Excelente", null, null]), TWICE_A_WEEK);
    expect(p.scores).toEqual([7, 10, null, null]);
    expect(p.average).toBe(8.5);
  });

  it("is ungraded without grades", () => {
    const p = studentPerformance(card([null, null, null, null]), TWICE_A_WEEK);
    expect(p).toMatchObject({
      average: null,
      latest: null,
      previous: null,
      changePct: null,
      trend: null,
      standing: "ungraded",
      attendance: null,
    });
    expect(p.risk.level).toBe("none");
  });

  it("has no trend with a single graded bimester", () => {
    const p = studentPerformance(card([8, null, null, null]), TWICE_A_WEEK);
    expect(p.previous).toBeNull();
    expect(p.trend).toBeNull();
  });

  it("flags flat and down trends", () => {
    expect(studentPerformance(card([8, 8.05, null, null]), TWICE_A_WEEK).trend).toBe("flat");
    expect(studentPerformance(card([8, 7, null, null]), TWICE_A_WEEK).trend).toBe("down");
  });

  it("skips ungraded bimesters when picking latest and previous", () => {
    const p = studentPerformance(card([6, null, 9, null]), TWICE_A_WEEK);
    expect(p.latest).toEqual({ bimester: 3, score: 9 });
    expect(p.previous).toEqual({ bimester: 1, score: 6 });
  });

  it("counts absences as data even without a grade", () => {
    const p = studentPerformance(
      card([null, null, null, null], { absences: [4, 0, 0, 0] }),
      TWICE_A_WEEK,
    );
    expect(p.attendance).toBe(75);
  });

  it("fails when the average is below the pass mark", () => {
    const p = studentPerformance(card([5, 5.5, null, null]), TWICE_A_WEEK);
    expect(p.standing).toBe("failed");
  });

  describe("march risk", () => {
    it("is high for a final exam result", () => {
      const p = studentPerformance(
        card([8, 8, null, null], { closing: { result: "Va a examen final" } }),
        TWICE_A_WEEK,
      );
      expect(p.risk.level).toBe("high");
      expect(p.risk.reasons).toContain("Figura para rendir examen final");
    });

    it("is high when the final result is march", () => {
      const p = studentPerformance(
        card([8, 8, null, null], { closing: { finalResult: { kind: "march" } } }),
        TWICE_A_WEEK,
      );
      expect(p.risk.level).toBe("high");
    });

    it("is high with an average below 6", () => {
      const p = studentPerformance(card([5, 5, null, null]), TWICE_A_WEEK);
      expect(p.risk.level).toBe("high");
      expect(p.risk.reasons).toContain("Promedio por debajo de 6");
    });

    it("is high when the last two graded bimesters fail", () => {
      const p = studentPerformance(card([9, 5, 5, null]), TWICE_A_WEEK);
      expect(p.average).toBe(6.33);
      expect(p.risk.level).toBe("high");
      expect(p.risk.reasons).toContain("Desaprobó los dos últimos bimestres");
    });

    it("is medium when only the latest bimester fails", () => {
      const p = studentPerformance(card([9, 9, 5.5, null]), TWICE_A_WEEK);
      expect(p.risk.level).toBe("medium");
      expect(p.risk.reasons).toContain("Desaprobó el último bimestre");
    });

    it("is medium on a sharp drop with an average below 7", () => {
      const p = studentPerformance(card([7, 6, null, null]), TWICE_A_WEEK);
      expect(p.average).toBe(6.5);
      expect(p.risk.level).toBe("medium");
      expect(p.risk.reasons).toEqual(["Bajó 14,3% respecto del bimestre anterior"]);
    });

    it("does not flag a drop when the average is 7 or more", () => {
      const p = studentPerformance(card([10, 8, null, null]), TWICE_A_WEEK);
      expect(p.risk.level).toBe("none");
    });

    it("is medium with low estimated attendance", () => {
      const p = studentPerformance(
        card([8, 8, null, null], { absences: [3, 3, 0, 0] }),
        TWICE_A_WEEK,
      );
      expect(p.attendance).toBe(81.3);
      expect(p.risk.level).toBe("medium");
      expect(p.risk.reasons).toEqual(["Asistencia estimada por debajo del 85%"]);
    });

    it("keeps the highest level and every reason", () => {
      const p = studentPerformance(card([6, 5, 5, null]), TWICE_A_WEEK);
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
    const high = studentPerformance(card([5, 5, null, null]), TWICE_A_WEEK);
    const lowerHigh = studentPerformance(card([4, 4, null, null]), TWICE_A_WEEK);
    const medium = studentPerformance(card([9, 5.5, null, null]), TWICE_A_WEEK);
    const sorted = [medium, high, lowerHigh].sort(compareRisk);
    expect(sorted).toEqual([lowerHigh, high, medium]);
  });
});
