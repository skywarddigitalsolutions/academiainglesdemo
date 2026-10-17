import type { PeriodProgress } from "@/application/progress";
import type { ReportPeriod } from "@/domain/report-card";

export type CourseFocus =
  | { state: "empty" }
  | { state: "done" }
  | { state: "current"; period: ReportPeriod; total: number; complete: number; published: number };

/** What a course card leads with: the period being loaded, or a final state. */
export function courseFocus(progress: PeriodProgress[]): CourseFocus {
  if (progress.length === 0 || progress[0].total === 0) return { state: "empty" };
  const current = progress.find((p) => p.published < p.total);
  if (!current) return { state: "done" };
  const { period, total, complete, published } = current;
  return { state: "current", period, total, complete, published };
}
