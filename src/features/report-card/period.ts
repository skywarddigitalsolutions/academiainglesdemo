import type { ReportPeriod } from "@/domain/report-card";

export function periodShortLabel(period: ReportPeriod): string {
  return period === "closing" ? "Cierre" : `${period}° Bim`;
}

export function periodLabel(period: ReportPeriod): string {
  return period === "closing" ? "Cierre del año" : `${period}° Bimestre`;
}

/** URL value for a period (`?periodo=`). */
export function periodParam(period: ReportPeriod): string {
  return period === "closing" ? "cierre" : String(period);
}

export function parsePeriodParam(value: string | null): ReportPeriod | null {
  if (value === "cierre") return "closing";
  const n = Number(value);
  return n === 1 || n === 2 || n === 3 || n === 4 ? n : null;
}
