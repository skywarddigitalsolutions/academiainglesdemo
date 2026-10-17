import type { PeriodProgress } from "@/application/progress";
import type { ReviewStatus } from "@/domain/period-review";
import type { ReportPeriod } from "@/domain/report-card";
import { currentPeriodProgress } from "@/features/grade-sheet/sheet-summary";
import { periodLabel, periodParam } from "@/features/report-card/period";

export interface PendingCourse {
  course: { id: string; name: string };
  studentCount: number;
  progress: PeriodProgress[];
  reviews?: { period: ReportPeriod; status: ReviewStatus }[];
}

export interface PendingItem {
  id: string;
  text: string;
  href: string;
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/**
 * Dirección's to-do list, from the overview data: first the periods waiting
 * for approval; then, for each course, the current period's missing grades
 * and unpublished drafts (drafts already sent for approval are not repeated);
 * then published bimesters that families have not read yet.
 */
export function pendingItems(courses: PendingCourse[], overall: PeriodProgress[]): PendingItem[] {
  const items: PendingItem[] = [];

  for (const { course, reviews = [] } of courses) {
    for (const review of reviews) {
      if (review.status !== "pending") continue;
      items.push({
        id: `approval:${course.id}:${review.period}`,
        text: `${course.name} · ${periodLabel(review.period)}: pendiente de aprobación`,
        href: `/admin/grades/${course.id}?periodo=${periodParam(review.period)}`,
      });
    }
  }

  for (const { course, studentCount, progress, reviews = [] } of courses) {
    if (studentCount === 0) continue;
    const current = currentPeriodProgress(progress);
    if (!current || current.published >= current.total) continue;
    const where = `${course.name} · ${periodLabel(current.period)}`;
    const href = `/admin/grades/${course.id}?periodo=${periodParam(current.period)}`;
    const missing = Math.max(0, current.total - current.complete);
    const drafts = Math.max(0, current.complete - current.published);
    if (missing > 0) {
      items.push({
        id: `missing:${course.id}`,
        text: `${where}: ${plural(missing, "falta", "faltan")} cargar ${missing} ${plural(missing, "alumno", "alumnos")}`,
        href,
      });
    }
    const sent = reviews.some((r) => r.period === current.period && r.status === "pending");
    if (drafts > 0 && !sent) {
      items.push({
        id: `drafts:${course.id}`,
        text: `${where}: ${drafts} ${plural(drafts, "borrador", "borradores")} sin publicar`,
        href,
      });
    }
  }

  for (const p of overall) {
    if (p.period === "closing") continue;
    const unread = p.published - p.read;
    if (unread <= 0) continue;
    items.push({
      id: `unread:${p.period}`,
      text: `${periodLabel(p.period)}: ${unread} ${plural(unread, "boletín publicado", "boletines publicados")} aún sin leer por las familias`,
      href: "/admin/grades",
    });
  }

  return items;
}
