import type { ExamListItem } from "@/application/exams";
import type { StatusTone } from "@/components/ui/status-badge";
import {
  type Exam,
  type ExamGradeChanges,
  type ExamStats,
  type ExamStatus,
} from "@/domain/exam";
import { formatGrade, type GradingType } from "@/domain/grading";
import { parseGradeText } from "@/features/grade-sheet/sheet-model";

/*
 * Presentation model of the exam pages: grade cells are edited as text (same
 * parsing as the bimester sheet) and converted to grade changes on save.
 */

/** Text of each student's grade cell ("" when not graded). */
export function examGradeTexts(exam: Exam, studentIds: string[]): Record<string, string> {
  return Object.fromEntries(
    studentIds.map((id) => {
      const value = exam.grades[id];
      return [id, value === undefined ? "" : formatGrade(value)];
    }),
  );
}

/** Cells that differ from the stored grades, plus the ones that do not parse. */
export function examGradeChanges(
  exam: Exam,
  texts: Record<string, string>,
  gradingType: GradingType,
): { changes: ExamGradeChanges; invalid: string[] } {
  const changes: ExamGradeChanges = {};
  const invalid: string[] = [];
  for (const [studentId, text] of Object.entries(texts)) {
    const parsed = parseGradeText(text, gradingType);
    if (!parsed.ok) {
      invalid.push(studentId);
      continue;
    }
    const stored = exam.grades[studentId] ?? null;
    if (parsed.value !== stored) changes[studentId] = parsed.value;
  }
  return { changes, invalid };
}

const STATUS_BADGES: Record<ExamStatus, { label: string; tone: StatusTone }> = {
  upcoming: { label: "Próximo", tone: "info" },
  "pending-grades": { label: "Pendiente de calificar", tone: "warning" },
  published: { label: "Publicado", tone: "success" },
};

export function examStatusBadge(status: ExamStatus): { label: string; tone: StatusTone } {
  return STATUS_BADGES[status];
}

function dayNumber(day: string): number {
  const [y, m, d] = day.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

/* ------------------------------------------------------------------------- */
/* Agenda cards                                                               */

export interface ExamStatusInfo {
  tone: StatusTone;
  /** Main sentence, in plain language. */
  headline: string;
  detail: string | null;
  /** Grading progress bar (pending exams only). */
  progress: { graded: number; total: number } | null;
}

/** What the card says about an exam: days left, grading progress or results. */
export function examStatusInfo(
  status: ExamStatus,
  date: string,
  stats: ExamStats,
  today: string,
): ExamStatusInfo {
  if (status === "upcoming") {
    const days = dayNumber(date) - dayNumber(today);
    const headline = days <= 0 ? "Es hoy" : days === 1 ? "Mañana" : `Faltan ${days} días`;
    return { tone: "info", headline, detail: null, progress: null };
  }
  if (status === "pending-grades") {
    const missing = stats.total - stats.graded;
    const headline =
      stats.total === 0
        ? "El curso todavía no tiene alumnos"
        : missing === 0
          ? "Notas cargadas, falta publicar"
          : missing === 1
            ? `Falta calificar 1 de ${stats.total} alumnos`
            : `Faltan calificar ${missing} de ${stats.total} alumnos`;
    return {
      tone: "warning",
      headline,
      detail: null,
      progress: { graded: stats.graded, total: stats.total },
    };
  }
  const parts: string[] = [];
  if (stats.average !== null) parts.push(`Promedio ${formatGrade(stats.average)}`);
  if (stats.graded > 0) parts.push(`${stats.atPassMark} de ${stats.graded} aprobados`);
  return {
    tone: "success",
    headline: "Notas publicadas",
    detail: parts.length > 0 ? parts.join(" · ") : null,
    progress: null,
  };
}

export interface AgendaGroups {
  /** Taken but not published, oldest first. */
  pending: ExamListItem[];
  /** Soonest first. */
  upcoming: ExamListItem[];
  /** Newest first. */
  published: ExamListItem[];
}

export function groupAgenda(items: ExamListItem[]): AgendaGroups {
  const byDate = (a: ExamListItem, b: ExamListItem) => a.exam.date.localeCompare(b.exam.date);
  const of = (status: ExamStatus) => items.filter((i) => i.status === status);
  return {
    pending: of("pending-grades").sort(byDate),
    upcoming: of("upcoming").sort(byDate),
    published: of("published").sort((a, b) => byDate(b, a)),
  };
}

/** "3 para calificar", "4 próximos", "9 publicados"; empty groups are skipped. */
export function agendaSummary(groups: AgendaGroups): string[] {
  const parts: string[] = [];
  const { pending, upcoming, published } = groups;
  if (pending.length > 0) parts.push(`${pending.length} para calificar`);
  if (upcoming.length > 0) parts.push(`${upcoming.length} ${upcoming.length === 1 ? "próximo" : "próximos"}`);
  if (published.length > 0) parts.push(`${published.length} ${published.length === 1 ? "publicado" : "publicados"}`);
  return parts;
}

/** Verb on the card's main button when the screen does not choose its own. */
export function defaultCtaLabel(status: ExamStatus): string {
  return status === "upcoming" ? "Ver detalle" : "Ver notas";
}

const WEEKDAYS_UPPER = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
const MONTHS_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** Pieces of the "calendar page" block of a card. */
export function dateBlockParts(day: string): { weekday: string; day: number; month: string } {
  const [y, m, d] = day.split("-").map(Number);
  return {
    weekday: WEEKDAYS_UPPER[new Date(Date.UTC(y, m - 1, d)).getUTCDay()],
    day: d,
    month: MONTHS_SHORT[m - 1],
  };
}
