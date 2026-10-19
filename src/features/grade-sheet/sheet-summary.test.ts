import { describe, expect, it } from "vitest";
import {
  acknowledgeBimester,
  createEmptyReportCard,
  publishBimester,
  publishClosing,
  updateBimester,
  updateClosing,
  type ReportCard,
} from "@/domain/report-card";
import {
  compactSummary,
  currentPeriodProgress,
  effectiveFilter,
  filterSheetRows,
  periodBreakdown,
  periodDisplayState,
  periodStepState,
  periodSteps,
  publishCandidates,
  rowStatus,
  summarySentence,
  type PeriodBreakdown,
} from "./sheet-summary";

const NOW = new Date("2026-10-15T13:00:00.000Z");
let seq = 0;
const empty = () =>
  createEmptyReportCard({ id: `rc-${++seq}`, studentId: `s-${seq}`, courseId: "c", year: 2026 });
const draft = (card = empty()) =>
  updateBimester(card, 1, { applicationGrade: 8, conductGrade: "Bien" }, "numeric");
const published = () => publishBimester(draft(), 1, NOW);
const read = () => acknowledgeBimester(published(), 1, NOW);

const breakdown = (over: Partial<ReturnType<typeof periodBreakdown>>) => ({
  total: 0,
  empty: 0,
  draft: 0,
  published: 0,
  read: 0,
  ...over,
});

describe("grade sheet summary", () => {
  it("derives the status of a row for a period", () => {
    expect(rowStatus(empty(), 1)).toBe("empty");
    expect(rowStatus(draft(), 1)).toBe("draft");
    expect(rowStatus(published(), 1)).toBe("published");
    expect(rowStatus(read(), 1)).toBe("read");
    const closed = updateClosing(
      empty(),
      { result: "Aprobado", finalResult: { kind: "march" } },
      "numeric",
    );
    expect(rowStatus(closed, "closing")).toBe("draft");
    expect(rowStatus(publishClosing(closed, NOW), "closing")).toBe("published");
  });

  it("counts every status of a period without overlap", () => {
    const cards = [empty(), draft(), published(), read(), read()];
    expect(periodBreakdown(cards, 1)).toEqual({
      total: 5,
      empty: 1,
      draft: 1,
      published: 1,
      read: 2,
    });
    expect(periodBreakdown(cards, 2)).toEqual(breakdown({ total: 5, empty: 5 }));
  });

  it("classifies a period step as not started, in progress or done", () => {
    expect(periodStepState(breakdown({}))).toBe("not-started");
    expect(periodStepState(breakdown({ total: 3, empty: 3 }))).toBe("not-started");
    expect(periodStepState(breakdown({ total: 3, empty: 2, draft: 1 }))).toBe("in-progress");
    expect(periodStepState(breakdown({ total: 3, empty: 1, published: 2 }))).toBe("in-progress");
    expect(periodStepState(breakdown({ total: 3, published: 1, read: 2 }))).toBe("done");
  });

  it("lists every period in order and marks the current one", () => {
    const cards: ReportCard[] = [read(), published()];
    const steps = periodSteps(cards);
    expect(steps.map((s) => s.period)).toEqual([1, 2, 3, 4, "closing"]);
    expect(steps[0]).toMatchObject({ state: "done", current: false });
    expect(steps[1]).toMatchObject({ state: "not-started", current: true });
    expect(steps.filter((s) => s.current)).toHaveLength(1);
  });

  it("describes what is pending in the period", () => {
    expect(summarySentence(breakdown({}), 1)).toBe("Este curso todavía no tiene alumnos.");
    expect(summarySentence(breakdown({ total: 8, empty: 5, draft: 3 }), 1)).toBe(
      "Faltan cargar 5 alumnos. 3 borradores sin publicar.",
    );
    expect(summarySentence(breakdown({ total: 2, empty: 1, draft: 1 }), 1)).toBe(
      "Falta cargar 1 alumno. 1 borrador sin publicar.",
    );
    expect(summarySentence(breakdown({ total: 4, published: 3, read: 1 }), 1)).toBe(
      "Todo publicado · 3 familias aún no lo leyeron.",
    );
    expect(summarySentence(breakdown({ total: 4, published: 1, read: 3 }), 1)).toBe(
      "Todo publicado · 1 familia aún no lo leyó.",
    );
    expect(summarySentence(breakdown({ total: 4, read: 4 }), 1)).toBe("Todo publicado y leído.");
    expect(summarySentence(breakdown({ total: 4, published: 4 }), "closing")).toBe(
      "Todo publicado.",
    );
  });

  it("points to the publish action when asked", () => {
    expect(summarySentence(breakdown({ total: 3, draft: 2, read: 1 }), 1, { publishHint: true })).toBe(
      "2 borradores sin publicar. Revíselos y use «Enviar a Dirección».",
    );
    expect(summarySentence(breakdown({ total: 3, empty: 3 }), 1, { publishHint: true })).toBe(
      "Faltan cargar 3 alumnos.",
    );
  });

  it("filters rows by status and reports hidden unsaved edits", () => {
    const rows = [
      { row: { card: empty() }, dirty: true },
      { row: { card: draft() }, dirty: false },
      { row: { card: read() }, dirty: true },
    ];
    expect(filterSheetRows(rows, 1, "all")).toEqual({ visible: rows, hiddenDirty: 0 });
    const drafts = filterSheetRows(rows, 1, "draft");
    expect(drafts.visible).toEqual([rows[1]]);
    expect(drafts.hiddenDirty).toBe(2);
    expect(filterSheetRows(rows, 1, "read")).toEqual({ visible: [rows[2]], hiddenDirty: 1 });
  });

  it("falls back to every row when the filtered status has no rows left", () => {
    const b = breakdown({ total: 3, draft: 0, published: 3 });
    expect(effectiveFilter("published", b)).toBe("published");
    expect(effectiveFilter("draft", b)).toBe("all");
    expect(effectiveFilter("all", b)).toBe("all");
  });

  it("picks the progress of the first period not fully published", () => {
    const p = (period: 1 | 2 | 3 | 4 | "closing", published: number) => ({
      period,
      total: 4,
      complete: published,
      published,
      read: 0,
    });
    expect(currentPeriodProgress([p(1, 4), p(2, 1), p(3, 0)])?.period).toBe(2);
    expect(currentPeriodProgress([p(1, 4), p(2, 4)])?.period).toBe(1);
    expect(currentPeriodProgress([])).toBeUndefined();
  });

  it("splits unpublished rows into ready to publish and incomplete", () => {
    const bim = (application: string, conduct: string) => ({
      application,
      conduct,
      observation: "",
    });
    const rows = [
      { values: bim("8", "Bien"), errors: {}, published: false },
      { values: bim("8", ""), errors: {}, published: false },
      { values: bim("12", "Bien"), errors: { application: true as const }, published: false },
      { values: bim("9", "Bien"), errors: {}, published: true },
    ];
    const { ready, incomplete } = publishCandidates(rows, 1);
    expect(ready).toEqual([rows[0]]);
    expect(incomplete).toEqual([rows[1]]);
  });
});

describe("compactSummary", () => {
  const b = (o: Partial<PeriodBreakdown>): PeriodBreakdown => ({
    total: 8,
    empty: 0,
    draft: 0,
    published: 0,
    read: 0,
    ...o,
  });

  it("names missing grades and drafts briefly", () => {
    expect(compactSummary(b({ empty: 2, draft: 6 }), 3)).toBe("Faltan 2 · 6 borradores");
    expect(compactSummary(b({ empty: 1, draft: 1, read: 6 }), 3)).toBe("Falta 1 · 1 borrador");
  });

  it("reports unread and finished periods", () => {
    expect(compactSummary(b({ published: 3, read: 5 }), 2)).toBe("Todo publicado · 3 sin leer");
    expect(compactSummary(b({ read: 8 }), 2)).toBe("Todo publicado y leído");
    expect(compactSummary(b({ published: 8 }), "closing")).toBe("Todo publicado");
  });

  it("handles a course without students", () => {
    expect(compactSummary(b({ total: 0 }), 1)).toBe("Sin alumnos");
  });
});

describe("periodDisplayState", () => {
  const review = (status: "pending" | "returned" | "approved") => ({ status });

  it("shows the approval state while a batch is pending or returned", () => {
    expect(periodDisplayState("in-progress", review("pending"))).toBe("pending");
    expect(periodDisplayState("in-progress", review("returned"))).toBe("returned");
  });

  it("falls back to the loading state otherwise", () => {
    expect(periodDisplayState("not-started", null)).toBe("not-started");
    expect(periodDisplayState("in-progress", undefined)).toBe("draft");
    expect(periodDisplayState("done", review("approved"))).toBe("done");
    expect(periodDisplayState("in-progress", review("approved"))).toBe("draft");
  });
});
