import {
  CUATRIMESTRAL_AFTER_BIMESTER,
  REPORT_PERIODS,
  type Bimester,
  type BimesterNumber,
  type ParentReportCardView,
  type ReportPeriod,
} from "@/domain/report-card";
import type { GradeValue } from "@/domain/grading";

/*
 * Family view of the school year: which periods were published, which ones
 * are new (published and not read yet) and how the report card page lists
 * the bimesters.
 */

export type ParentPeriodState = "new" | "read" | "published" | "pending";

export interface ParentPeriodStep {
  period: ReportPeriod;
  state: ParentPeriodState;
}

export function parentPeriodSteps(view: ParentReportCardView): ParentPeriodStep[] {
  return REPORT_PERIODS.map((period) => {
    if (period === "closing") {
      return { period, state: view.closing !== null ? "published" : "pending" };
    }
    const b = view.bimesters.find((x) => x.number === period);
    if (!b?.visible || !b.data) return { period, state: "pending" };
    return { period, state: b.data.readAt !== null ? "read" : "new" };
  });
}

/** Published bimesters the family has not marked as read, oldest first. */
export function unreadPeriods(steps: ParentPeriodStep[]): ReportPeriod[] {
  return steps.filter((s) => s.state === "new").map((s) => s.period);
}

export function latestPublishedPeriod(steps: ParentPeriodStep[]): ReportPeriod | null {
  return steps.filter((s) => s.state !== "pending").at(-1)?.period ?? null;
}

/* ------------------------------------------------------------------------- */

export type ParentBimesterState = "new" | "read" | "pending";

/** One bimester of the report card page. Pending rows carry no data. */
export interface ParentBimesterRow {
  number: BimesterNumber;
  state: ParentBimesterState;
  bimester: Bimester | null;
  /** Only on the bimester after which the cuatrimestral exam is taken. */
  cuatrimestralExam: GradeValue | null;
}

/** The four bimesters in chronological order. */
export function parentBimesterRows(view: ParentReportCardView): ParentBimesterRow[] {
  return view.bimesters.map(({ number, visible, data }) => {
    const bimester = visible ? data : null;
    return {
      number,
      state: bimester === null ? "pending" : bimester.readAt !== null ? "read" : "new",
      bimester,
      cuatrimestralExam:
        bimester !== null && number === CUATRIMESTRAL_AFTER_BIMESTER
          ? view.cuatrimestralExam
          : null,
    };
  });
}

/** Phone order: the latest published bimester first, pending ones at the end. */
export function newestPublishedFirst(rows: ParentBimesterRow[]): ParentBimesterRow[] {
  const published = rows.filter((r) => r.state !== "pending").reverse();
  return [...published, ...rows.filter((r) => r.state === "pending")];
}

export function unreadNotice(count: number): string | null {
  if (count <= 0) return null;
  return count === 1 ? "Tiene 1 bimestre nuevo." : `Tiene ${count} bimestres nuevos.`;
}

/** Period to scroll to from an old `?periodo=` link: only published ones. */
export function scrollTargetPeriod(
  steps: ParentPeriodStep[],
  requested: ReportPeriod | null,
): ReportPeriod | null {
  const step = steps.find((s) => s.period === requested);
  return step && step.state !== "pending" ? step.period : null;
}

/** How the family lists their children's upcoming exams. */
export type ExamView = "list" | "calendar";

export const EXAM_VIEW_STORAGE_KEY = "academia.parent.exam-view";

/** Stored choice -> view; anything unknown means the default list. */
export function parseExamView(raw: string | null): ExamView {
  return raw === "calendar" ? "calendar" : "list";
}
