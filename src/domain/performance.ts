import {
  CONCEPTUAL_SCALE,
  PASS_MARK,
  type ConceptualGrade,
  type GradeValue,
  type GradingType,
} from "./grading";
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
const FAILING_CONCEPT: ConceptualGrade = "Desaprobado";
const LOW_CONCEPT: ConceptualGrade = "Regular";
/** Dropping this many scale steps (or more) down to "Regular" is a medium March risk. */
const SHARP_LEVEL_DROP = 2;

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
  gradingType: GradingType;
  /** Score per bimester 1-4 (null = not graded yet). Conceptual grades use their internal score. */
  scores: (number | null)[];
  /** Numeric: mean of the scores. Conceptual: the internal score of `concept`. */
  average: number | null;
  /** Conceptual only: the median concept of the graded bimesters. */
  concept: ConceptualGrade | null;
  gradedBimesters: number;
  latest: GradedBimester | null;
  previous: GradedBimester | null;
  /** Numeric only: latest vs previous graded bimester, percentage with one decimal. */
  changePct: number | null;
  /** Conceptual only: scale steps gained (+) or lost (-) between the previous and the latest bimester. */
  levelChange: number | null;
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

/** The concept whose internal score is closest to `score`. */
export function nearestConcept(score: number): ConceptualGrade {
  return CONCEPTUAL_SCALE.reduce((best, grade) =>
    Math.abs(CONCEPTUAL_SCORE[grade] - score) < Math.abs(CONCEPTUAL_SCORE[best] - score)
      ? grade
      : best,
  );
}

/** Median concept; with an even count it takes the lower (worse) middle one. */
export function medianConcept(grades: ConceptualGrade[]): ConceptualGrade | null {
  if (grades.length === 0) return null;
  const sorted = [...grades].sort(
    (a, b) => CONCEPTUAL_SCALE.indexOf(a) - CONCEPTUAL_SCALE.indexOf(b),
  );
  return sorted[Math.floor(sorted.length / 2)];
}

/** Scale steps from one concept to another: positive when improving. */
export function levelsBetween(from: ConceptualGrade, to: ConceptualGrade): number {
  return CONCEPTUAL_SCALE.indexOf(from) - CONCEPTUAL_SCALE.indexOf(to);
}

export function percentChange(
  previous: number | null,
  latest: number | null,
): number | null {
  if (previous === null || latest === null || previous === 0) return null;
  return round(((latest - previous) / previous) * 100, 1);
}

function isFinalExam(card: ReportCard): boolean {
  return card.closing.finalResult?.kind === "march" || card.closing.result === "Va a examen final";
}

function finish(high: string[], medium: string[]): MarchRisk {
  const level: RiskLevel = high.length > 0 ? "high" : medium.length > 0 ? "medium" : "none";
  return { level, reasons: [...high, ...medium] };
}

function evaluateNumericRisk(params: {
  card: ReportCard;
  average: number | null;
  latest: GradedBimester | null;
  previous: GradedBimester | null;
  changePct: number | null;
}): MarchRisk {
  const { card, average, latest, previous, changePct } = params;
  const high: string[] = [];
  const medium: string[] = [];

  if (isFinalExam(card)) {
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

  return finish(high, medium);
}

/** Conceptual courses only fail with "Desaprobado"; "Regular" matters when it is a steep drop. */
function evaluateConceptualRisk(params: {
  card: ReportCard;
  concept: ConceptualGrade | null;
  latest: ConceptualGrade | null;
  previous: ConceptualGrade | null;
}): MarchRisk {
  const { card, concept, latest, previous } = params;
  const high: string[] = [];
  const medium: string[] = [];

  if (isFinalExam(card)) {
    high.push("Figura para rendir examen final");
  }
  if (latest === FAILING_CONCEPT && previous === FAILING_CONCEPT) {
    high.push("Desaprobó los dos últimos bimestres");
  }
  if (concept === FAILING_CONCEPT) {
    high.push(`Su concepto general es ${FAILING_CONCEPT}`);
  }

  if (latest === FAILING_CONCEPT) {
    medium.push("Desaprobó el último bimestre");
  }
  if (latest === LOW_CONCEPT && previous) {
    const dropped = -levelsBetween(previous, latest);
    if (dropped >= SHARP_LEVEL_DROP) {
      medium.push(`Bajó de ${previous} a ${latest} (${dropped} niveles)`);
    }
  }

  return finish(high, medium);
}

function trendOf(change: number | null, flatBand: number): Trend | null {
  if (change === null) return null;
  return change >= flatBand ? "up" : change <= -flatBand ? "down" : "flat";
}

export function studentPerformance(
  card: ReportCard,
  gradingType: GradingType = "numeric",
): StudentPerformance {
  const bimesters = BIMESTER_NUMBERS.map(
    (n) => card.bimesters.find((b) => b.number === n) ?? null,
  );
  const scores = bimesters.map((b) => gradeScore(b?.applicationGrade));
  const graded: GradedBimester[] = [];
  scores.forEach((score, i) => {
    if (score !== null) graded.push({ bimester: BIMESTER_NUMBERS[i], score });
  });
  const latest = graded.at(-1) ?? null;
  const previous = graded.at(-2) ?? null;
  const base = { gradingType, scores, gradedBimesters: graded.length, latest, previous };

  if (gradingType === "conceptual") {
    const concepts = graded.map((g) => nearestConcept(g.score));
    const concept = medianConcept(concepts);
    const latestConcept = concepts.at(-1) ?? null;
    const previousConcept = concepts.at(-2) ?? null;
    const levelChange =
      latestConcept && previousConcept ? levelsBetween(previousConcept, latestConcept) : null;
    return {
      ...base,
      average: concept ? CONCEPTUAL_SCORE[concept] : null,
      concept,
      changePct: null,
      levelChange,
      trend: trendOf(levelChange, 1),
      standing: concept === null ? "ungraded" : concept === FAILING_CONCEPT ? "failed" : "passed",
      risk: evaluateConceptualRisk({
        card,
        concept,
        latest: latestConcept,
        previous: previousConcept,
      }),
    };
  }

  const average = averageOf(graded.map((g) => g.score));
  const changePct = percentChange(previous?.score ?? null, latest?.score ?? null);
  return {
    ...base,
    average,
    concept: null,
    changePct,
    levelChange: null,
    trend: trendOf(changePct, FLAT_BAND_PCT),
    standing: average === null ? "ungraded" : average >= PASS_MARK ? "passed" : "failed",
    risk: evaluateNumericRisk({ card, average, latest, previous, changePct }),
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
