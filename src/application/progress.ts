import {
  getBimester,
  isBimesterComplete,
  isClosingComplete,
  REPORT_PERIODS,
  type ReportCard,
  type ReportPeriod,
} from "@/domain/report-card";

export interface PeriodProgress {
  period: ReportPeriod;
  total: number;
  /** Students with the grades required to publish. */
  complete: number;
  /** Students whose period is visible to families. */
  published: number;
  /** Published bimesters already read by a family (always 0 for the closing). */
  read: number;
}

export type PublishState = "already-published" | "incomplete" | "ready";

export function isPublishable(card: ReportCard, period: ReportPeriod): PublishState {
  if (period === "closing") {
    if (card.closing.publishedAt !== null) return "already-published";
    return isClosingComplete(card.closing) ? "ready" : "incomplete";
  }
  const bimester = getBimester(card, period);
  if (bimester.publishedAt !== null) return "already-published";
  return isBimesterComplete(bimester) ? "ready" : "incomplete";
}

export function summarizePeriod(cards: ReportCard[], period: ReportPeriod): PeriodProgress {
  const progress: PeriodProgress = {
    period,
    total: cards.length,
    complete: 0,
    published: 0,
    read: 0,
  };
  for (const card of cards) {
    if (period === "closing") {
      if (isClosingComplete(card.closing)) progress.complete++;
      if (card.closing.publishedAt !== null) progress.published++;
      continue;
    }
    const bimester = getBimester(card, period);
    if (isBimesterComplete(bimester)) progress.complete++;
    if (bimester.publishedAt !== null) progress.published++;
    if (bimester.readAt !== null) progress.read++;
  }
  return progress;
}

export function summarizeProgress(cards: ReportCard[]): PeriodProgress[] {
  return REPORT_PERIODS.map((period) => summarizePeriod(cards, period));
}
