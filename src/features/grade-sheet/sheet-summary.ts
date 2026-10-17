import {
  getBimester,
  getBimesterStatus,
  getClosingStatus,
  REPORT_PERIODS,
  type BimesterStatus,
  type ReportCard,
  type ReportPeriod,
} from "@/domain/report-card";
import type { PeriodProgress } from "@/application/progress";
import {
  defaultSheetPeriod,
  isRowComplete,
  type RowErrors,
  type RowValues,
} from "./sheet-model";

/*
 * Summary of a course grade sheet: per-period status counts, the period
 * timeline, the pending-work sentence and the status filter of the table.
 */

/** Stored status of a row; the closing is never "read". */
export type RowStatus = BimesterStatus;

export interface PeriodBreakdown {
  total: number;
  empty: number;
  draft: number;
  /** Published and not read yet. */
  published: number;
  read: number;
}

export type PeriodStepState = "not-started" | "in-progress" | "done";

export interface PeriodStep {
  period: ReportPeriod;
  breakdown: PeriodBreakdown;
  state: PeriodStepState;
  /** First period that is not fully published (the one the sheet opens on). */
  current: boolean;
}

export type SheetFilter = "all" | RowStatus;

export function rowStatus(card: ReportCard, period: ReportPeriod): RowStatus {
  return period === "closing"
    ? getClosingStatus(card.closing)
    : getBimesterStatus(getBimester(card, period));
}

export function periodBreakdown(cards: ReportCard[], period: ReportPeriod): PeriodBreakdown {
  const result: PeriodBreakdown = { total: cards.length, empty: 0, draft: 0, published: 0, read: 0 };
  for (const card of cards) result[rowStatus(card, period)]++;
  return result;
}

export function periodStepState(b: PeriodBreakdown): PeriodStepState {
  if (b.draft + b.published + b.read === 0) return "not-started";
  return b.empty + b.draft === 0 ? "done" : "in-progress";
}

export function periodSteps(cards: ReportCard[]): PeriodStep[] {
  const current = defaultSheetPeriod(cards);
  return REPORT_PERIODS.map((period) => {
    const breakdown = periodBreakdown(cards, period);
    return { period, breakdown, state: periodStepState(breakdown), current: period === current };
  });
}

/** What a period shows in the selector: approval state first, then loading state. */
export type PeriodDisplayState = "not-started" | "draft" | "pending" | "returned" | "done";

export function periodDisplayState(
  state: PeriodStepState,
  review: { status: "pending" | "returned" | "approved" } | null | undefined,
): PeriodDisplayState {
  if (review?.status === "pending") return "pending";
  if (review?.status === "returned") return "returned";
  if (state === "in-progress") return "draft";
  return state;
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/** One actionable sentence about what is still pending in the period. */
export function summarySentence(
  b: PeriodBreakdown,
  period: ReportPeriod,
  options: { publishHint?: boolean } = {},
): string {
  if (b.total === 0) return "Este curso todavía no tiene alumnos.";
  const parts: string[] = [];
  if (b.empty > 0) {
    parts.push(
      plural(b.empty, "Falta cargar 1 alumno.", `Faltan cargar ${b.empty} alumnos.`),
    );
  }
  if (b.draft > 0) {
    parts.push(
      plural(b.draft, "1 borrador sin publicar.", `${b.draft} borradores sin publicar.`),
    );
    if (options.publishHint) parts.push("Revíselos y use «Enviar a Dirección».");
  }
  if (parts.length > 0) return parts.join(" ");
  if (period === "closing") return "Todo publicado.";
  if (b.published > 0) {
    return `Todo publicado · ${plural(
      b.published,
      "1 familia aún no lo leyó.",
      `${b.published} familias aún no lo leyeron.`,
    )}`;
  }
  return "Todo publicado y leído.";
}

/** The pending work of the period in a few words (collapsed summary on phones). */
export function compactSummary(b: PeriodBreakdown, period: ReportPeriod): string {
  if (b.total === 0) return "Sin alumnos";
  const parts: string[] = [];
  if (b.empty > 0) parts.push(`${plural(b.empty, "Falta", "Faltan")} ${b.empty}`);
  if (b.draft > 0) parts.push(`${b.draft} ${plural(b.draft, "borrador", "borradores")}`);
  if (parts.length > 0) return parts.join(" · ");
  if (period === "closing") return "Todo publicado";
  if (b.published > 0) return `Todo publicado · ${b.published} sin leer`;
  return "Todo publicado y leído";
}

/** The filter only points to a status that still has rows; otherwise "all". */
export function effectiveFilter(filter: SheetFilter, b: PeriodBreakdown): SheetFilter {
  return filter === "all" || b[filter] > 0 ? filter : "all";
}

/**
 * Rows shown for a status filter (by stored status). Hidden rows keep their
 * edits; `hiddenDirty` counts the ones with unsaved changes.
 */
export function filterSheetRows<T extends { row: { card: ReportCard }; dirty: boolean }>(
  rows: T[],
  period: ReportPeriod,
  filter: SheetFilter,
): { visible: T[]; hiddenDirty: number } {
  if (filter === "all") return { visible: rows, hiddenDirty: 0 };
  const visible: T[] = [];
  let hiddenDirty = 0;
  for (const r of rows) {
    if (rowStatus(r.row.card, period) === filter) visible.push(r);
    else if (r.dirty) hiddenDirty++;
  }
  return { visible, hiddenDirty };
}

/** Progress of the first period that is not fully published (else the first). */
export function currentPeriodProgress(progress: PeriodProgress[]): PeriodProgress | undefined {
  return progress.find((p) => p.published < p.total) ?? progress[0];
}

/**
 * Unpublished rows split into the ones that can be published now (complete
 * and valid) and the ones that would stay as drafts.
 */
export function publishCandidates<
  T extends { values: RowValues; errors: RowErrors; published: boolean },
>(rows: T[], period: ReportPeriod): { ready: T[]; incomplete: T[] } {
  const ready: T[] = [];
  const incomplete: T[] = [];
  for (const r of rows) {
    if (r.published) continue;
    if (!isRowComplete(period, r.values)) incomplete.push(r);
    else if (Object.keys(r.errors).length === 0) ready.push(r);
  }
  return { ready, incomplete };
}
