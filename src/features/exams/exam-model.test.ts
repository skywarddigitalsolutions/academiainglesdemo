import { describe, expect, it } from "vitest";
import type { Exam } from "@/domain/exam";
import type { ExamListItem } from "@/application/exams";
import type { ExamStats, ExamStatus } from "@/domain/exam";
import {
  agendaSummary,
  dateBlockParts,
  defaultCtaLabel,
  examGradeChanges,
  examGradeTexts,
  examStatusBadge,
  examStatusInfo,
  groupAgenda,
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


function stats(total: number, graded: number, average: number | null = null, atPassMark = graded): ExamStats {
  return { total, graded, average, atPassMark };
}

function listItem(id: string, date: string, status: ExamStatus): ExamListItem {
  return {
    exam: { ...exam, id, date },
    course: { id: "c-5a", name: "5° A" } as ExamListItem["course"],
    status,
    stats: stats(7, 0),
  };
}

describe("exam status in plain language", () => {
  const today = "2026-10-18";

  it("counts the days left for upcoming exams", () => {
    expect(examStatusInfo("upcoming", "2026-10-19", stats(7, 0), today)).toMatchObject({
      tone: "info",
      headline: "Mañana",
    });
    expect(examStatusInfo("upcoming", "2026-10-23", stats(7, 0), today).headline).toBe("Faltan 5 días");
    expect(examStatusInfo("upcoming", "2026-10-18", stats(7, 0), today).headline).toBe("Es hoy");
  });

  it("tells how many students still need a grade", () => {
    const info = examStatusInfo("pending-grades", "2026-10-06", stats(7, 1), today);
    expect(info).toMatchObject({
      tone: "warning",
      headline: "Faltan calificar 6 de 7 alumnos",
      progress: { graded: 1, total: 7 },
    });
    expect(examStatusInfo("pending-grades", "2026-10-06", stats(7, 6), today).headline).toBe(
      "Falta calificar 1 de 7 alumnos",
    );
  });

  it("asks to publish when everyone is graded", () => {
    expect(examStatusInfo("pending-grades", "2026-10-06", stats(7, 7), today).headline).toBe(
      "Notas cargadas, falta publicar",
    );
  });

  it("summarizes published exams with average and passes", () => {
    expect(examStatusInfo("published", "2026-10-06", stats(7, 7, 7.5, 6), today)).toMatchObject({
      tone: "success",
      headline: "Notas publicadas",
      detail: "Promedio 7,5 · 6 de 7 aprobados",
      progress: null,
    });
  });

  it("omits the average for conceptual courses", () => {
    expect(examStatusInfo("published", "2026-10-06", stats(7, 7, null, 5), today).detail).toBe(
      "5 de 7 aprobados",
    );
  });
});

describe("agenda grouping", () => {
  const items = [
    listItem("p2", "2026-10-10", "pending-grades"),
    listItem("p1", "2026-10-02", "pending-grades"),
    listItem("u2", "2026-10-30", "upcoming"),
    listItem("u1", "2026-10-20", "upcoming"),
    listItem("d1", "2026-09-01", "published"),
    listItem("d2", "2026-09-20", "published"),
  ];

  it("orders each group for what to do next", () => {
    const groups = groupAgenda(items);
    expect(groups.pending.map((i) => i.exam.id)).toEqual(["p1", "p2"]);
    expect(groups.upcoming.map((i) => i.exam.id)).toEqual(["u1", "u2"]);
    expect(groups.published.map((i) => i.exam.id)).toEqual(["d2", "d1"]);
  });

  it("writes the counts as plain text and skips empty ones", () => {
    expect(agendaSummary(groupAgenda(items))).toEqual(["2 para calificar", "2 próximos", "2 publicados"]);
    expect(agendaSummary(groupAgenda([listItem("a", "2026-10-30", "upcoming")]))).toEqual(["1 próximo"]);
    expect(agendaSummary(groupAgenda([listItem("a", "2026-09-01", "published")]))).toEqual(["1 publicado"]);
  });
});

describe("agenda card pieces", () => {
  it("labels the default action by status", () => {
    expect(defaultCtaLabel("pending-grades")).toBe("Ver notas");
    expect(defaultCtaLabel("upcoming")).toBe("Ver detalle");
    expect(defaultCtaLabel("published")).toBe("Ver notas");
  });

  it("splits a day for the calendar page block", () => {
    expect(dateBlockParts("2026-10-21")).toEqual({ weekday: "MIÉ", day: 21, month: "oct" });
    expect(dateBlockParts("2026-03-02")).toEqual({ weekday: "LUN", day: 2, month: "mar" });
  });
});
