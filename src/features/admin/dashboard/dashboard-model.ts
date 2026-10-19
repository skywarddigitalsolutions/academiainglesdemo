import type { CourseMetrics, StudentMetrics } from "@/application/dashboard";
import type { StatusTone } from "@/components/ui/status-badge";
import { courseName } from "@/domain/course";
import type { GradingType } from "@/domain/grading";
import {
  nearestConcept,
  type RiskLevel,
  type StudentPerformance,
  type Trend,
} from "@/domain/performance";

/** Pure presentation helpers for Dirección's "Tablero". */

const MINUS = "\u2212";
const MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function decimalComma(value: number): string {
  return String(value).replace(".", ",");
}

/** 68.4 -> "68,4 %"; no data -> "—". */
export function formatPercent(value: number | null): string {
  return value === null ? "—" : `${decimalComma(value)} %`;
}

/** Signed change with one decimal: "+12,5 %", "−8,0 %". */
export function formatChange(changePct: number | null): string {
  if (changePct === null) return "—";
  const body = `${Math.abs(changePct).toFixed(1).replace(".", ",")} %`;
  if (changePct > 0) return `+${body}`;
  if (changePct < 0) return `${MINUS}${body}`;
  return body;
}

export function trendTone(trend: Trend | null): StatusTone {
  if (trend === "up") return "success";
  if (trend === "down") return "danger";
  return "neutral";
}

const RISK_BADGES: Record<RiskLevel, { label: string; tone: StatusTone }> = {
  high: { label: "Riesgo alto", tone: "danger" },
  medium: { label: "Riesgo medio", tone: "warning" },
  none: { label: "Sin riesgo", tone: "success" },
};

export function riskBadge(level: RiskLevel): { label: string; tone: StatusTone } {
  return RISK_BADGES[level];
}

/** Numeric: "7,5". Conceptual: the nearest concept, never a number ("Muy bien"). */
export function scoreLabel(score: number | null, gradingType: GradingType): string {
  if (score === null) return "—";
  return gradingType === "numeric" ? decimalComma(score) : nearestConcept(score);
}

export type ComparisonKey =
  | "average"
  | "passRate"
  | "failRate"
  | "examsTaken"
  | "atRisk";

/** Metrics where a lower value is the better one. */
const LOWER_IS_BETTER: ReadonlySet<ComparisonKey> = new Set([
  "failRate",
  "atRisk",
]);

/** Smallest gap between best and worst worth highlighting, in the column's own unit. */
const MIN_SPREAD: Record<ComparisonKey, number> = {
  average: 0.25,
  passRate: 2,
  failRate: 2,
  examsTaken: 1,
  atRisk: 1,
};

/** 1 -> "1 alumno"; otherwise the plural form. */
export function countLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function comparisonValue(course: CourseMetrics, key: ComparisonKey): number | null {
  return key === "atRisk" ? course.atRisk.length : course[key];
}

export interface ComparisonGroup {
  /** "2° Grado", "1° Año". */
  title: string;
  courses: CourseMetrics[];
}

/**
 * Divisions of the same grade or year, side by side. A grade with a single
 * division has nothing to be compared with and is left out.
 */
export function comparisonGroups(courses: CourseMetrics[]): ComparisonGroup[] {
  const groups = new Map<string, ComparisonGroup & { level: number; year: number }>();
  for (const metrics of courses) {
    const { level, year } = metrics.course;
    const key = `${level}-${year}`;
    const group = groups.get(key) ?? {
      title: courseName(level, year, "").trim(),
      courses: [],
      level: level === "primary" ? 0 : 1,
      year,
    };
    group.courses.push(metrics);
    groups.set(key, group);
  }
  return [...groups.values()]
    .filter((g) => g.courses.length >= 2)
    .sort((a, b) => a.level - b.level || a.year - b.year)
    .map(({ title, courses: members }) => ({
      title,
      courses: [...members].sort((a, b) => a.course.division.localeCompare(b.course.division)),
    }));
}

/** "6 (75 %)" for numeric courses; conceptual courses show the count alone. */
export function passFailText(metrics: CourseMetrics, which: "passed" | "failed"): string {
  const count = metrics[which];
  if (metrics.course.gradingType === "conceptual") return String(count);
  return `${count} (${formatPercent(which === "passed" ? metrics.passRate : metrics.failRate)})`;
}

/** Course ids holding the best and the worst value of a column (none without contrast). */
export function rankCourses(
  courses: CourseMetrics[],
  key: ComparisonKey,
): { best: string[]; worst: string[] } {
  const values = courses
    .map((c) => ({ id: c.course.id, value: comparisonValue(c, key) }))
    .filter((v): v is { id: string; value: number } => v.value !== null);
  const min = Math.min(...values.map((v) => v.value));
  const max = Math.max(...values.map((v) => v.value));
  if (values.length < 2 || max - min < MIN_SPREAD[key]) return { best: [], worst: [] };
  const [bestValue, worstValue] = LOWER_IS_BETTER.has(key) ? [min, max] : [max, min];
  const idsAt = (target: number) => values.filter((v) => v.value === target).map((v) => v.id);
  return { best: idsAt(bestValue), worst: idsAt(worstValue) };
}

export type ProgressFilter = "all" | "improved" | "declined";

/** Size of a student's move: percentage points (numeric) or scale levels (conceptual). */
function progressMagnitude(performance: StudentPerformance): number {
  return performance.changePct ?? performance.levelChange ?? 0;
}

/** Students for the progress table; the filtered views put the biggest moves first. */
export function progressRows(students: StudentMetrics[], filter: ProgressFilter): StudentMetrics[] {
  if (filter === "all") return students;
  const wanted: Trend = filter === "improved" ? "up" : "down";
  const sign = filter === "improved" ? -1 : 1;
  return students
    .filter((s) => s.performance.trend === wanted)
    .sort(
      (a, b) => sign * (progressMagnitude(a.performance) - progressMagnitude(b.performance)),
    );
}

/** "+2 niveles", "−1 nivel", "Sin cambios". */
function formatLevels(levels: number): string {
  if (levels === 0) return "Sin cambios";
  const body = `${Math.abs(levels)} ${Math.abs(levels) === 1 ? "nivel" : "niveles"}`;
  return levels > 0 ? `+${body}` : `${MINUS}${body}`;
}

/**
 * How a student moved since the previous graded bimester. Numeric: "+12,5 %".
 * Conceptual: "+2 niveles" with the detail "Bien → Muy bien".
 */
export function progressChange(performance: StudentPerformance): {
  text: string;
  detail: string | null;
} {
  if (performance.gradingType === "numeric") {
    return { text: formatChange(performance.changePct), detail: null };
  }
  const { levelChange, previous, latest } = performance;
  if (levelChange === null || !previous || !latest) return { text: "—", detail: null };
  return {
    text: formatLevels(levelChange),
    detail: `${nearestConcept(previous.score)} → ${nearestConcept(latest.score)}`,
  };
}

/** Share of the roster that passed, failed or has no grades yet (0-100, one decimal). */
export function passFailSegments(course: CourseMetrics): {
  passed: number;
  failed: number;
  ungraded: number;
} {
  const share = (count: number) =>
    course.studentCount === 0 ? 0 : Math.round((count / course.studentCount) * 1000) / 10;
  return {
    passed: share(course.passed),
    failed: share(course.failed),
    ungraded: share(course.ungraded),
  };
}

/** "2026-10-18" -> "18 de octubre de 2026". */
export function formatLongDay(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return `${d} de ${MONTHS[m - 1]} de ${y}`;
}
