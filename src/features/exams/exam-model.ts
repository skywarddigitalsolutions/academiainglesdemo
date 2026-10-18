import type { StatusTone } from "@/components/ui/status-badge";
import type { Exam, ExamGradeChanges, ExamStats, ExamStatus } from "@/domain/exam";
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

/** Short facts about an exam; the system never decides who passed. */
export function formatStatsSummary(stats: ExamStats): string[] {
  const parts = [`${stats.graded} de ${stats.total} calificados`];
  if (stats.average !== null) parts.push(`Promedio ${formatGrade(stats.average)}`);
  if (stats.graded > 0) parts.push(`${stats.atPassMark} con nota de aprobación`);
  return parts;
}

function dayNumber(day: string): number {
  const [y, m, d] = day.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

/** "Hoy", "Mañana" or "En N días" for upcoming days; null for past ones. */
export function relativeDayLabel(day: string, today: string): string | null {
  const diff = dayNumber(day) - dayNumber(today);
  if (diff < 0) return null;
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Mañana";
  return `En ${diff} días`;
}
