import { describe, expect, it } from "vitest";
import { DomainError } from "./errors";
import {
  addDays,
  applyExamGrades,
  createExam,
  examAverageForBimester,
  examStats,
  examStatus,
  examTypeLabel,
  isIsoDate,
  isoDay,
  publishExam,
  sortPastFirst,
  sortUpcomingFirst,
  splitAgenda,
  upcomingWithin,
  updateExamDetails,
  type Exam,
  type ExamDetails,
} from "./exam";

const NOW = new Date("2026-10-15T13:00:00.000Z");
const LATER = new Date("2026-10-16T09:30:00.000Z");

const DETAILS: ExamDetails = {
  date: "2026-10-20",
  type: "written",
  topic: "  Past simple  ",
  bimester: 4,
};

function exam(overrides: Partial<Exam> = {}): Exam {
  return {
    id: "ex-1",
    courseId: "c-5a",
    year: 2026,
    bimester: 3,
    date: "2026-10-01",
    type: "written",
    topic: "Unit 4",
    grades: {},
    publishedAt: null,
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
    ...overrides,
  };
}

describe("exam dates", () => {
  it("accepts only real calendar days in yyyy-mm-dd", () => {
    expect(isIsoDate("2026-10-20")).toBe(true);
    expect(isIsoDate("2028-02-29")).toBe(true);
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("2026-13-01")).toBe(false);
    expect(isIsoDate("20/10/2026")).toBe(false);
    expect(isIsoDate("")).toBe(false);
  });

  it("adds days across months and years", () => {
    expect(addDays("2026-10-25", 14)).toBe("2026-11-08");
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("gives the calendar day of an instant in the school time zone", () => {
    // 01:30 UTC is still the previous evening in Buenos Aires.
    expect(isoDay(new Date("2026-10-16T01:30:00.000Z"))).toBe("2026-10-15");
    expect(isoDay(NOW)).toBe("2026-10-15");
  });
});

describe("exam creation and edition", () => {
  it("creates an ungraded, unpublished exam with a trimmed topic", () => {
    expect(
      createExam({ id: "ex-9", courseId: "c-5a", year: 2026, details: DETAILS, now: NOW }),
    ).toEqual({
      id: "ex-9",
      courseId: "c-5a",
      year: 2026,
      bimester: 4,
      date: "2026-10-20",
      type: "written",
      topic: "Past simple",
      grades: {},
      publishedAt: null,
      createdAt: NOW.toISOString(),
      updatedAt: NOW.toISOString(),
    });
  });

  it("rejects a blank topic, an invalid date, type or bimester", () => {
    const base = { id: "ex", courseId: "c-5a", year: 2026, now: NOW };
    const bad: Partial<ExamDetails>[] = [
      { topic: "   " },
      { topic: "a".repeat(121) },
      { date: "2026-02-30" },
      { type: "quiz" as ExamDetails["type"] },
      { bimester: 5 as ExamDetails["bimester"] },
    ];
    for (const patch of bad) {
      expect(() => createExam({ ...base, details: { ...DETAILS, ...patch } })).toThrow(
        DomainError,
      );
    }
  });

  it("updates the details and keeps grades and publication", () => {
    const published = exam({ grades: { "s-08": 7 }, publishedAt: NOW.toISOString() });
    const updated = updateExamDetails(published, { ...DETAILS, topic: "Unit 5" }, LATER);
    expect(updated).toMatchObject({
      date: "2026-10-20",
      bimester: 4,
      topic: "Unit 5",
      grades: { "s-08": 7 },
      publishedAt: NOW.toISOString(),
      updatedAt: LATER.toISOString(),
      createdAt: NOW.toISOString(),
    });
  });

  it("labels the exam types in Spanish", () => {
    expect(examTypeLabel("written")).toBe("Evaluación escrita");
    expect(examTypeLabel("oral")).toBe("Evaluación oral");
    expect(examTypeLabel("practical")).toBe("Trabajo práctico");
    expect(examTypeLabel("presentation")).toBe("Exposición");
    expect(examTypeLabel("other")).toBe("Otro");
  });
});

describe("exam grades", () => {
  it("merges grades and clears the ones set to null", () => {
    const base = exam({ grades: { "s-08": 7, "s-09": 9 } });
    const next = applyExamGrades(base, { "s-08": 8.5, "s-09": null, "s-10": 5 }, "numeric", LATER);
    expect(next.grades).toEqual({ "s-08": 8.5, "s-10": 5 });
    expect(next.updatedAt).toBe(LATER.toISOString());
  });

  it("validates grades against the grading type of the course", () => {
    expect(() => applyExamGrades(exam(), { "s-08": 11 }, "numeric", NOW)).toThrow(DomainError);
    expect(() => applyExamGrades(exam(), { "s-08": "Bueno" }, "numeric", NOW)).toThrow(
      DomainError,
    );
    expect(() => applyExamGrades(exam(), { "s-01": 8 }, "conceptual", NOW)).toThrow(DomainError);
    expect(applyExamGrades(exam(), { "s-01": "Muy bueno" }, "conceptual", NOW).grades).toEqual({
      "s-01": "Muy bueno",
    });
  });

  it("publishes once there is at least one grade, keeping the first publication date", () => {
    expect(() => publishExam(exam(), NOW)).toThrow(DomainError);
    const published = publishExam(exam({ grades: { "s-08": 7 } }), NOW);
    expect(published.publishedAt).toBe(NOW.toISOString());
    expect(publishExam(published, LATER).publishedAt).toBe(NOW.toISOString());
  });

  it("keeps a published exam published when its grades are corrected", () => {
    const published = exam({ grades: { "s-08": 7 }, publishedAt: NOW.toISOString() });
    const corrected = applyExamGrades(published, { "s-08": 8 }, "numeric", LATER);
    expect(corrected.publishedAt).toBe(NOW.toISOString());
  });
});

describe("exam status", () => {
  const today = "2026-10-15";

  it("is upcoming while the date is ahead", () => {
    expect(examStatus(exam({ date: "2026-10-16" }), today)).toBe("upcoming");
  });

  it("is pending grades from the exam day until it is published", () => {
    expect(examStatus(exam({ date: today }), today)).toBe("pending-grades");
    expect(examStatus(exam({ date: "2026-10-01", grades: { "s-08": 7 } }), today)).toBe(
      "pending-grades",
    );
  });

  it("is published once the grades were published", () => {
    expect(
      examStatus(exam({ grades: { "s-08": 7 }, publishedAt: NOW.toISOString() }), today),
    ).toBe("published");
  });
});

describe("exam agenda", () => {
  const today = "2026-10-15";
  const list = [
    exam({ id: "a", date: "2026-10-01" }),
    exam({ id: "b", date: "2026-10-28" }),
    exam({ id: "c", date: "2026-10-15" }),
    exam({ id: "d", date: "2026-09-10" }),
    exam({ id: "e", date: "2026-10-18" }),
  ];
  const ids = (exams: Exam[]) => exams.map((e) => e.id);

  it("sorts upcoming ascending and past descending", () => {
    expect(ids(sortUpcomingFirst(list))).toEqual(["d", "a", "c", "e", "b"]);
    expect(ids(sortPastFirst(list))).toEqual(["b", "e", "c", "a", "d"]);
  });

  it("splits from today: today's exam is still on the agenda", () => {
    const { upcoming, past } = splitAgenda(list, today);
    expect(ids(upcoming)).toEqual(["c", "e", "b"]);
    expect(ids(past)).toEqual(["a", "d"]);
  });

  it("lists the exams of the next days, today included", () => {
    expect(ids(upcomingWithin(list, today, 7))).toEqual(["c", "e"]);
    expect(ids(upcomingWithin(list, today, 14))).toEqual(["c", "e", "b"]);
  });
});

describe("exam stats", () => {
  it("summarizes numeric grades of the course students", () => {
    const stats = examStats(
      exam({ grades: { "s-08": 7, "s-09": 9.5, "s-10": 4, "gone": 10 } }),
      ["s-08", "s-09", "s-10", "s-11"],
      "numeric",
    );
    expect(stats).toEqual({ total: 4, graded: 3, average: 6.83, atPassMark: 2 });
  });

  it("counts conceptual grades other than Insuficiente at the pass mark, without average", () => {
    const stats = examStats(
      exam({ grades: { "s-01": "Excelente", "s-02": "Insuficiente", "s-03": "Regular" } }),
      ["s-01", "s-02", "s-03"],
      "conceptual",
    );
    expect(stats).toEqual({ total: 3, graded: 3, average: null, atPassMark: 2 });
  });

  it("has no average without grades", () => {
    expect(examStats(exam(), ["s-08"], "numeric")).toEqual({
      total: 1,
      graded: 0,
      average: null,
      atPassMark: 0,
    });
  });
});

describe("exam average for a bimester (reference only)", () => {
  const exams = [
    exam({ id: "1", bimester: 3, grades: { "s-08": 7, "s-09": 9 } }),
    exam({ id: "2", bimester: 3, grades: { "s-08": 8 } }),
    exam({ id: "3", bimester: 2, grades: { "s-08": 2 } }),
    exam({ id: "4", bimester: 3, grades: { "s-09": 10 } }),
  ];

  it("averages the numeric grades of the student in that bimester", () => {
    expect(examAverageForBimester(exams, "s-08", 3)).toBe(7.5);
    expect(examAverageForBimester(exams, "s-09", 3)).toBe(9.5);
    expect(examAverageForBimester(exams, "s-08", 4)).toBeNull();
  });

  it("has no numeric average for conceptual grades", () => {
    const conceptual = [exam({ grades: { "s-01": "Bueno" } })];
    expect(examAverageForBimester(conceptual, "s-01", 3)).toBeNull();
  });
});
