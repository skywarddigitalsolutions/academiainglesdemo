import { summarizePeriod } from "@/application/progress";
import {
  isConceptualGrade,
  isValidGrade,
  type GradeValue,
  type GradingType,
} from "@/domain/grading";
import {
  CLOSING_RESULTS,
  FINAL_EXAM_MODALITIES,
  getBimester,
  REPORT_PERIODS,
  type BimesterNumber,
  type BimesterPatch,
  type ClosingPatch,
  type ClosingResult,
  type FinalExamModality,
  type ReportCard,
  type ReportPeriod,
} from "@/domain/report-card";

/*
 * Presentation model of the course grade sheet: every cell is edited as text
 * and converted to a domain patch on save. The domain still validates.
 */

export interface BimesterRowValues {
  application: string;
  conduct: string;
  absences: string;
  observation: string;
}

export interface ClosingRowValues {
  cuatrimestral: string;
  result: string;
  modality: string;
  finalGrade: string;
  /** "" | "promoted" | "march" */
  finalResult: string;
}

export type RowValues = BimesterRowValues | ClosingRowValues;
export type RowErrors = Partial<Record<string, true>>;

function gradeText(value: GradeValue | null): string {
  if (value === null) return "";
  return typeof value === "number" ? String(value).replace(".", ",") : value;
}

export function bimesterValues(card: ReportCard, n: BimesterNumber): BimesterRowValues {
  const b = getBimester(card, n);
  return {
    application: gradeText(b.applicationGrade),
    conduct: b.conductGrade ?? "",
    absences: b.absences > 0 || b.publishedAt || b.applicationGrade !== null ? String(b.absences) : "",
    observation: b.observation,
  };
}

export function closingValues(card: ReportCard): ClosingRowValues {
  const c = card.closing;
  return {
    cuatrimestral: gradeText(c.cuatrimestralExam),
    result: c.result ?? "",
    modality: c.finalExam?.modality ?? "",
    finalGrade: gradeText(c.finalExam?.grade ?? null),
    finalResult: c.finalResult?.kind ?? "",
  };
}

export function rowValues(card: ReportCard, period: ReportPeriod): RowValues {
  return period === "closing" ? closingValues(card) : bimesterValues(card, period);
}

export type ParsedGrade = { ok: true; value: GradeValue | null } | { ok: false };

export function parseGradeText(text: string, type: GradingType): ParsedGrade {
  const trimmed = text.trim();
  if (trimmed === "") return { ok: true, value: null };
  if (type === "conceptual") {
    return isConceptualGrade(trimmed) ? { ok: true, value: trimmed } : { ok: false };
  }
  if (!/^\d{1,2}([.,]\d{1,2})?$/.test(trimmed)) return { ok: false };
  const value = Number(trimmed.replace(",", "."));
  return isValidGrade("numeric", value) ? { ok: true, value } : { ok: false };
}

function parseAbsences(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === "") return 0;
  return /^\d{1,3}$/.test(trimmed) ? Number(trimmed) : null;
}

export function validateRow(
  period: ReportPeriod,
  values: RowValues,
  type: GradingType,
): RowErrors {
  const errors: RowErrors = {};
  if (period === "closing") {
    const v = values as ClosingRowValues;
    if (!parseGradeText(v.cuatrimestral, type).ok) errors.cuatrimestral = true;
    if (!parseGradeText(v.finalGrade, type).ok) errors.finalGrade = true;
    return errors;
  }
  const v = values as BimesterRowValues;
  if (!parseGradeText(v.application, type).ok) errors.application = true;
  if (parseAbsences(v.absences) === null) errors.absences = true;
  return errors;
}

function grade(text: string, type: GradingType): GradeValue | null {
  const parsed = parseGradeText(text, type);
  return parsed.ok ? parsed.value : null;
}

export function toBimesterPatch(values: BimesterRowValues, type: GradingType): BimesterPatch {
  return {
    applicationGrade: grade(values.application, type),
    conductGrade: isConceptualGrade(values.conduct) ? values.conduct : null,
    absences: parseAbsences(values.absences) ?? 0,
    observation: values.observation.trim(),
  };
}

export function toClosingPatch(
  values: ClosingRowValues,
  type: GradingType,
  nextCourseName: string,
): ClosingPatch {
  const result = (CLOSING_RESULTS as readonly string[]).includes(values.result)
    ? (values.result as ClosingResult)
    : null;
  const modality = (FINAL_EXAM_MODALITIES as readonly string[]).includes(values.modality)
    ? (values.modality as FinalExamModality)
    : null;
  return {
    cuatrimestralExam: grade(values.cuatrimestral, type),
    result,
    finalExam:
      result === "Va a examen final"
        ? { modality, grade: grade(values.finalGrade, type) }
        : null,
    finalResult:
      values.finalResult === "promoted"
        ? { kind: "promoted", nextCourseName }
        : values.finalResult === "march"
          ? { kind: "march" }
          : null,
  };
}

/** Converts the text values of a row into the domain patch of the period. */
export function toPeriodPatch(
  period: ReportPeriod,
  values: RowValues,
  course: { gradingType: GradingType; nextCourseName: string },
): BimesterPatch | ClosingPatch {
  return period === "closing"
    ? toClosingPatch(values as ClosingRowValues, course.gradingType, course.nextCourseName)
    : toBimesterPatch(values as BimesterRowValues, course.gradingType);
}

/** Cells of one row that differ from the stored values. */
export type RowDraft = Partial<Record<string, string>>;

const FINAL_EXAM_FIELDS = ["modality", "finalGrade"] as const;

/**
 * Applies one cell edit to the draft of a row, keeping only the cells that
 * differ from the stored values. Leaving "Va a examen final" clears the final
 * exam cells. An empty result means the row has no pending changes.
 */
export function editRowDraft(
  base: RowValues,
  draft: RowDraft,
  field: string,
  value: string,
): RowDraft {
  const stored = base as unknown as Record<string, string>;
  const next: RowDraft = { ...draft };
  const set = (key: string, text: string) => {
    if (stored[key] === text) delete next[key];
    else next[key] = text;
  };
  set(field, value);
  if (field === "result" && value !== "Va a examen final") {
    for (const key of FINAL_EXAM_FIELDS) set(key, "");
  }
  return next;
}

/** First period that still has students without publishing (1 when none). */
export function defaultSheetPeriod(cards: ReportCard[]): ReportPeriod {
  return (
    REPORT_PERIODS.find((p) => {
      const progress = summarizePeriod(cards, p);
      return progress.published < progress.total;
    }) ?? 1
  );
}

/** Whether the period of a card is already visible to families. */
export function isPeriodPublished(card: ReportCard, period: ReportPeriod): boolean {
  return period === "closing"
    ? card.closing.publishedAt !== null
    : getBimester(card, period).publishedAt !== null;
}

/** Mirrors the domain rule used to publish a row. */
export function isRowComplete(period: ReportPeriod, values: RowValues): boolean {
  if (period === "closing") {
    const v = values as ClosingRowValues;
    return v.result !== "" && v.finalResult !== "";
  }
  const v = values as BimesterRowValues;
  return v.application.trim() !== "" && v.conduct !== "";
}

/** Numeric grades below 6 or "Desaprobado": a visual hint only. */
export function isLowGrade(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed === "Desaprobado") return true;
  if (trimmed === "") return false;
  const n = Number(trimmed.replace(",", "."));
  return Number.isFinite(n) && n < 6;
}
