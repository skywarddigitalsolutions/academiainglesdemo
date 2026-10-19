"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import type { PeriodProgress } from "@/application/progress";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageBand, SectionHeading } from "@/components/layout/page-header";
import { periodShortLabel } from "@/features/report-card/period";
import { PeriodProgressList, ProgressLegend } from "@/features/report-card/period-progress";
import { cn } from "@/lib/utils";
import { AdminCalendar } from "./admin-calendar";
import { DashboardSections } from "./dashboard/dashboard-sections";
import { formatLongDay } from "./dashboard/dashboard-model";
import { useAsyncData } from "@/providers/use-async-data";
import { pendingItems, type PendingItem } from "./pending";

/** Container: Dirección's Tablero: calendar, period management, then metrics and comparison. */
export function AdminOverview() {
  const overview = useAsyncData("admin-overview", (s) => s.admin.getOverview());
  const dashboard = useAsyncData("admin-dashboard", (s) => s.admin.getDashboard());
  const data = overview.data;
  const metrics = dashboard.data;

  return (
    <>
      <PageBand
        eyebrow="Dirección"
        title="Tablero"
        description={
          metrics
            ? `Resumen del ciclo ${metrics.year} al ${formatLongDay(metrics.today)}.`
            : "Resumen del ciclo lectivo."
        }
      />
      <div className="flex flex-col gap-10">
        <AdminCalendar />

        {overview.loading && <LoadingState variant="cards" />}
        {overview.error && <ErrorState message={overview.error} />}
        {data && (
          <>
            <PendingCard items={pendingItems(data.courses, data.progress)} />
            <div className="grid items-start gap-6 lg:grid-cols-2">
              <section className="flex min-w-0 flex-col">
                <SectionHeading title="Publicación por período" />
                <div className="surface-card px-5 py-4">
                  <PeriodProgressList progress={data.progress} />
                  <ProgressLegend className="mt-3 border-t border-slate-100 pt-3" />
                </div>
              </section>
              <ReadingCard progress={data.progress} />
            </div>
          </>
        )}

        {dashboard.loading && <LoadingState variant="cards" />}
        {dashboard.error && <ErrorState message={dashboard.error} />}
        {metrics && <DashboardSections metrics={metrics} />}
      </div>
    </>
  );
}

/** Published bimesters already read by families: one compact row per bimester. */
function ReadingCard({ progress }: { progress: PeriodProgress[] }) {
  const bimesters = progress.filter((p) => p.period !== "closing");
  return (
    <section className="flex min-w-0 flex-col">
      <SectionHeading title="Lectura de las familias" />
      <ul className="surface-card flex flex-col gap-3 px-5 py-4">
        {bimesters.map((p) => {
          const pct = p.published === 0 ? null : Math.round((p.read / p.published) * 100);
          return (
            <li
              key={String(p.period)}
              className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-3 text-[13px]"
            >
              <span className="font-medium text-slate-600">{periodShortLabel(p.period)}</span>
              <span className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                <span
                  className="block h-full rounded-full bg-success"
                  style={{ width: `${pct ?? 0}%` }}
                />
              </span>
              <span className="text-right text-muted-foreground tabular-nums">
                {pct === null ? (
                  "Sin publicar"
                ) : (
                  <>
                    <span className="font-semibold text-foreground">{pct}%</span> · {p.read} de{" "}
                    {p.published}
                  </>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Dirección's to-do list, derived from the overview. */
function PendingCard({ items }: { items: PendingItem[] }) {
  return (
    <section className="min-w-0">
      <SectionHeading title="Pendientes" />
      {items.length === 0 ? (
        <p className="surface-card flex items-center gap-2 px-5 py-4 text-sm text-success">
          <CheckCircle2 className="size-4" aria-hidden />
          No hay pendientes.
        </p>
      ) : (
        <ul className="surface-card divide-y divide-border overflow-hidden">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="group flex min-h-12 items-center justify-between gap-3 px-5 py-3 text-sm text-foreground transition-colors hover:bg-primary-tint focus-visible:bg-primary-tint focus-visible:outline-none"
              >
                <span className="flex min-w-0 items-start gap-2.5">
                  <span
                    aria-hidden
                    className={cn(
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      item.id.startsWith("approval")
                        ? "bg-navy ring-2 ring-primary/30"
                        : item.id.startsWith("unread")
                          ? "bg-success"
                          : item.id.startsWith("drafts")
                            ? "bg-primary"
                            : "bg-warning",
                    )}
                  />
                  {item.text}
                </span>
                <ArrowRight
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
