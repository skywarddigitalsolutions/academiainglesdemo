import type { StatusTone } from "@/components/ui/status-badge";
import { CONCEPTUAL_SCALE, formatGrade, PASS_MARK, type ConceptualGrade, type GradingType } from "@/domain/grading";
import { averageOf, CONCEPTUAL_SCORE, gradeScore } from "@/domain/performance";
import { parseGradeText } from "@/features/grade-sheet/sheet-model";

/*
 * Pure logic of the exam detail screen. Everything is computed from the grade
 * texts currently typed, so teachers see the effect while they type.
 */

export type RowState = "pass" | "fail" | "empty" | "invalid";

export function rowState(text: string, type: GradingType): RowState {
  const parsed = parseGradeText(text, type);
  if (!parsed.ok) return "invalid";
  const score = gradeScore(parsed.value);
  if (score === null) return "empty";
  if (type === "conceptual") return parsed.value === "Insuficiente" ? "fail" : "pass";
  return score >= PASS_MARK ? "pass" : "fail";
}

export interface LiveExamStats {
  total: number;
  graded: number;
  passed: number;
  failed: number;
  invalid: number;
  /** Numeric grade average, or the equivalent score for conceptual courses. */
  average: number | null;
  /** Percentages of the graded students, rounded. */
  passedPct: number;
  failedPct: number;
}

function pct(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 100);
}

export function liveExamStats(texts: Record<string, string>, type: GradingType): LiveExamStats {
  const scores: number[] = [];
  let passed = 0;
  let failed = 0;
  let invalid = 0;
  for (const text of Object.values(texts)) {
    const state = rowState(text, type);
    if (state === "invalid") invalid += 1;
    if (state === "pass") passed += 1;
    if (state === "fail") failed += 1;
    if (state === "pass" || state === "fail") {
      const parsed = parseGradeText(text, type);
      const score = parsed.ok ? gradeScore(parsed.value) : null;
      if (score !== null) scores.push(score);
    }
  }
  const graded = passed + failed;
  return {
    total: Object.keys(texts).length,
    graded,
    passed,
    failed,
    invalid,
    average: averageOf(scores),
    passedPct: pct(passed, graded),
    failedPct: pct(failed, graded),
  };
}

/** "Muy bueno (8,5)": the conceptual label nearest to a numeric average. */
export function conceptualAverageLabel(average: number | null): string {
  if (average === null) return "—";
  let best: ConceptualGrade = CONCEPTUAL_SCALE[0];
  for (const label of CONCEPTUAL_SCALE) {
    const closer = Math.abs(CONCEPTUAL_SCORE[label] - average) < Math.abs(CONCEPTUAL_SCORE[best] - average);
    if (closer) best = label;
  }
  return `${best} (${formatGrade(CONCEPTUAL_SCORE[best])})`;
}

export function averageText(average: number | null, type: GradingType): string {
  if (average === null) return "—";
  return type === "numeric" ? formatGrade(average) : conceptualAverageLabel(average);
}

export interface DistributionBand {
  label: string;
  count: number;
  tone: StatusTone;
}

const NUMERIC_BANDS: { label: string; min: number; max: number; tone: StatusTone }[] = [
  { label: "1 a 3", min: 1, max: 3.99, tone: "danger" },
  { label: "4 a 5", min: 4, max: 5.99, tone: "warning" },
  { label: "6 a 7", min: 6, max: 7.99, tone: "info" },
  { label: "8 a 10", min: 8, max: 10, tone: "success" },
];

const CONCEPTUAL_TONES: Record<(typeof CONCEPTUAL_SCALE)[number], StatusTone> = {
  Excelente: "success",
  "Muy bueno": "success",
  Bueno: "info",
  Regular: "warning",
  Insuficiente: "danger",
};

export function gradeDistribution(texts: Record<string, string>, type: GradingType): DistributionBand[] {
  const values = Object.values(texts).map((t) => parseGradeText(t, type));
  if (type === "conceptual") {
    return CONCEPTUAL_SCALE.map((label) => ({
      label,
      count: values.filter((v) => v.ok && v.value === label).length,
      tone: CONCEPTUAL_TONES[label],
    }));
  }
  return NUMERIC_BANDS.map(({ label, min, max, tone }) => ({
    label,
    tone,
    count: values.filter((v) => v.ok && typeof v.value === "number" && v.value >= min && v.value <= max)
      .length,
  }));
}

export type StepState = "done" | "current" | "todo";

/** Three-step guide of the grade entry: grade, save, publish. */
export function guideSteps(input: {
  allGraded: boolean;
  dirty: boolean;
  published: boolean;
}): { label: string; state: StepState }[] {
  const done = [input.allGraded, input.allGraded && !input.dirty, input.published];
  const labels = ["Cargar la nota de cada alumno", "Guardar", "Publicar para las familias"];
  const currentIndex = done.indexOf(false);
  return labels.map((label, i) => ({
    label,
    state: done[i] ? "done" : i === currentIndex ? "current" : "todo",
  }));
}

const WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** "miércoles 21 de octubre de 2026" from a yyyy-mm-dd day. */
export function longDateLabel(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${weekday} ${d} de ${MONTHS[m - 1]} de ${y}`;
}

/** "hoy", "mañana" or "faltan N días" (lowercase, for use inside a sentence). */
export function upcomingLead(date: string, today: string): string {
  const toNumber = (day: string) => {
    const [y, m, d] = day.split("-").map(Number);
    return Date.UTC(y, m - 1, d) / 86_400_000;
  };
  const days = toNumber(date) - toNumber(today);
  if (days <= 0) return "hoy";
  if (days === 1) return "mañana";
  return `faltan ${days} días`;
}
