import { PASS_MARK, type ConceptualGrade, type GradeValue } from "./grading";
import { BIMESTER_NUMBERS, type BimesterNumber, type ReportCard } from "./report-card";

/*
 * Academic performance derived from a report card. Pure and explainable:
 * every risk flag carries the reasons Dirección can read. Drafts count too
 * (Dirección sees work in progress).
 */

/** Internal ordering score of the conceptual scale (never shown as a grade). */
export const CONCEPTUAL_SCORE: Record<ConceptualGrade, number> = {
  Excelente: 10,
  "Muy bien +": 9,
  "Muy bien": 8,
  "Bien +": 7.5,
  Bien: 7,
  Regular: 6,
  Desaprobado: 4,
};

/** A drop of this percentage or more (with a low average) is a medium March risk. */
export const SHARP_DROP_PCT = 10;
const LOW_AVERAGE = 7;
const FLAT_BAND_PCT = 1;

export type Trend = "up" | "down" | "flat";
export type Standing = "passed" | "failed" | "ungraded";
export type RiskLevel = "high" | "medium" | "none";

export interface GradedBimester {
  bimester: BimesterNumber;
  score: number;
}

export interface MarchRisk {
  level: RiskLevel;
  /** Spanish, ready to show to Dirección. */
  reasons: string[];
}

export interface StudentPerformance {
  /** Score per bimester 1-4 (null = not graded yet). */
  scores: (number | null)[];
  average: number | null;
  gradedBimesters: number;
  latest: GradedBimester | null;
  previous: GradedBimester | null;
  /** Latest vs previous graded bimester, percentage with one decimal. */
  changePct: number | null;
  trend: Trend | null;
  standing: Standing;
  risk: MarchRisk;
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** Spanish decimal comma, e.g. 12.5 -> "12,5". */
function formatDecimal(value: number): string {
  return String(value).replace(".", ",");
}

export function gradeScore(value: GradeValue | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return typeof value === "number" ? value : CONCEPTUAL_SCORE[value];
}

export function averageOf(values: number[]): number | null {
  if (values.length === 0) return null;
  return round(values.reduce((sum, v) => sum + v, 0) / values.length, 2);
}

export function percentChange(
  previous: number | null,
  latest: number | null,
): number | null {
  if (previous === null || latest === null || previous === 0) return null;
  return round(((latest - previous) / previous) * 100, 1);
}

function evaluateRisk(params: {
  card: ReportCard;
  average: number | null;
  latest: GradedBimester | null;
  previous: GradedBimester | null;
  changePct: number | null;
}): MarchRisk {
  const { card, average, latest, previous, changePct } = params;
  const high: string[] = [];
  const medium: string[] = [];

  if (card.closing.finalResult?.kind === "march" || card.closing.result === "Va a examen final") {
    high.push("Figura para rendir examen final");
  }
  if (average !== null && average < PASS_MARK) {
    high.push(`Promedio por debajo de ${PASS_MARK}`);
  }
  if (latest && previous && latest.score < PASS_MARK && previous.score < PASS_MARK) {
    high.push("Desaprobó los dos últimos bimestres");
  }

  if (latest && latest.score < PASS_MARK) {
    medium.push("Desaprobó el último bimestre");
  }
  if (
    average !== null &&
    average < LOW_AVERAGE &&
    changePct !== null &&
    changePct <= -SHARP_DROP_PCT
  ) {
    medium.push(`Bajó ${formatDecimal(Math.abs(changePct))}% respecto del bimestre anterior`);
  }

  const level: RiskLevel = high.length > 0 ? "high" : medium.length > 0 ? "medium" : "none";
  return { level, reasons: [...high, ...medium] };
}

export function studentPerformance(card: ReportCard): StudentPerformance {
  const bimesters = BIMESTER_NUMBERS.map(
    (n) => card.bimesters.find((b) => b.number === n) ?? null,
  );
  const scores = bimesters.map((b) => gradeScore(b?.applicationGrade));
  const graded: GradedBimester[] = [];
  scores.forEach((score, i) => {
    if (score !== null) graded.push({ bimester: BIMESTER_NUMBERS[i], score });
  });

  const average = averageOf(graded.map((g) => g.score));
  const latest = graded.at(-1) ?? null;
  const previous = graded.at(-2) ?? null;
  const changePct = percentChange(previous?.score ?? null, latest?.score ?? null);
  const trend: Trend | null =
    changePct === null
      ? null
      : changePct >= FLAT_BAND_PCT
        ? "up"
        : changePct <= -FLAT_BAND_PCT
          ? "down"
          : "flat";
  const standing: Standing =
    average === null ? "ungraded" : average >= PASS_MARK ? "passed" : "failed";

  return {
    scores,
    average,
    gradedBimesters: graded.length,
    latest,
    previous,
    changePct,
    trend,
    standing,
    risk: evaluateRisk({ card, average, latest, previous, changePct }),
  };
}

export const RISK_ORDER: Record<RiskLevel, number> = { high: 0, medium: 1, none: 2 };

/** High risk first, then the lowest average first (ungraded last). */
export function compareRisk(a: StudentPerformance, b: StudentPerformance): number {
  return (
    RISK_ORDER[a.risk.level] - RISK_ORDER[b.risk.level] ||
    (a.average ?? Infinity) - (b.average ?? Infinity)
  );
}
