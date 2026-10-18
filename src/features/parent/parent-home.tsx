"use client";

import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import type { ChildSummary } from "@/application/parent-use-cases";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageBand } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { periodLabel } from "@/features/report-card/period";
import { cn } from "@/lib/utils";
import { useAsyncData } from "@/providers/use-async-data";
import { useSession } from "@/providers/session-provider";
import { latestPublishedPeriod, parentPeriodSteps, unreadPeriods } from "./parent-model";
import { ParentUpcomingExams } from "./parent-exams";
import { ParentPeriodStrip } from "./parent-period-strip";

/** Container: loads the children of the logged-in parent. */
export function ParentHome() {
  const { state } = useSession();
  const parentId = state.session?.userId ?? "";
  const { data, error, loading } = useAsyncData(`children:${parentId}`, (s) =>
    s.parent.listChildren(parentId),
  );

  const firstName = state.session?.displayName.split(" ")[0] ?? "";
  const unreadTotal = data
    ? data.reduce((n, item) => n + unreadPeriods(parentPeriodSteps(item.view)).length, 0)
    : 0;

  return (
    <>
      <PageBand
        eyebrow={firstName ? `Hola, ${firstName}` : "Familia"}
        title="Mis hijos"
        description="Consulte el boletín de cada uno de sus hijos; los bimestres nuevos aparecen señalados."
        stats={
          data && data.length > 0
            ? [
                { label: data.length === 1 ? "Hijo en el instituto" : "Hijos en el instituto", value: data.length },
                { label: unreadTotal === 1 ? "Bimestre sin leer" : "Bimestres sin leer", value: unreadTotal },
              ]
            : undefined
        }
      />
      {loading && <LoadingState variant="cards" />}
      {error && <ErrorState message={error} />}
      {data && <ChildrenList items={data} />}
      {data && data.length > 0 && <ParentUpcomingExams />}
    </>
  );
}

/** Presentational: one card per child (a single child gets a wider card). */
function ChildrenList({ items }: { items: ChildSummary[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No hay alumnos vinculados a su cuenta"
        description="Comuníquese con la secretaría del instituto."
      />
    );
  }
  return (
    <ul className={cn("grid gap-4", items.length === 1 ? "max-w-2xl" : "md:grid-cols-2")}>
      {items.map((item) => (
        <li key={item.student.id}>
          <ChildCard item={item} />
        </li>
      ))}
    </ul>
  );
}

function ChildCard({ item }: { item: ChildSummary }) {
  const { student, course, view } = item;
  const steps = parentPeriodSteps(view);
  const unread = unreadPeriods(steps);
  const latest = latestPublishedPeriod(steps);
  const hasNew = unread.length > 0;

  return (
    <Link
      href={`/parent/report-cards/${student.id}`}
      className={cn(
        "group surface-card flex h-full flex-col transition-[border-color,box-shadow] duration-150 hover:shadow-raised focus-visible:ring-4 focus-visible:ring-primary/15 focus-visible:outline-none",
        hasNew ? "border-primary/40 hover:border-primary/60" : "hover:border-primary/30",
      )}
    >
      <div className="flex items-start gap-3 p-5 pb-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary-strong">
          {student.firstName[0]}
          {student.lastName[0]}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-lg leading-tight font-semibold text-navy">
            {student.firstName} {student.lastName}
          </h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {course.name}
          </p>
        </div>
        {hasNew && (
          <StatusBadge tone="info" dot className="shrink-0">
            {unread.length === 1 ? "Nuevo" : `${unread.length} nuevos`}
          </StatusBadge>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-border px-5 py-4">
        <p className="text-sm text-foreground">
          {hasNew ? (
            <>
              <span className="font-semibold">
                {unread.length === 1
                  ? `${periodLabel(unread[0])} publicado.`
                  : `${unread.length} bimestres publicados sin leer.`}
              </span>{" "}
              Ábralo para leer las calificaciones y la observación del docente.
            </>
          ) : latest ? (
            <>
              Último publicado:{" "}
              <span className="font-semibold">{periodLabel(latest)}</span>.
              {latest !== "closing" && " Ya lo leyó."}
            </>
          ) : (
            "Todavía no hay bimestres publicados."
          )}
        </p>
        <ParentPeriodStrip steps={steps} />
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-border bg-primary-tint/60 px-5 py-3">
        <span className="text-[13px] text-muted-foreground tabular-nums">
          {item.publishedBimesters} de 4 bimestres publicados
        </span>
        <span
          className={cn(
            "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium whitespace-nowrap",
            hasNew
              ? "bg-primary text-primary-foreground group-hover:bg-primary-strong"
              : "text-primary-strong",
          )}
        >
          Ver boletín
          <ArrowRight
            className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5"
            aria-hidden
          />
        </span>
      </div>
    </Link>
  );
}
