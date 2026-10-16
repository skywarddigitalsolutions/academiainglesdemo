"use client";

import Link from "next/link";
import { ChevronRight, FileText, Users } from "lucide-react";
import type { ChildSummary } from "@/application/parent-use-cases";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { gradingTypeLabel } from "@/domain/course";
import { useAsyncData } from "@/providers/use-async-data";
import { useSession } from "@/providers/session-provider";

/** Container: loads the children of the logged-in parent. */
export function ParentHome() {
  const { state } = useSession();
  const parentId = state.session?.userId ?? "";
  const { data, error, loading } = useAsyncData(`children:${parentId}`, (s) =>
    s.parent.listChildren(parentId),
  );

  return (
    <>
      <PageHeader
        title="Mis hijos"
        description="Consulte el boletín de calificaciones de cada uno de sus hijos."
      />
      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {data && <ChildrenList items={data} />}
    </>
  );
}

/** Presentational: one card per child. */
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
    <ul className="grid gap-4 sm:grid-cols-2">
      {items.map(({ student, course, publishedBimesters, pendingAcknowledgements }) => (
        <li key={student.id}>
          <Link
            href={`/parent/report-cards/${student.id}`}
            className="group flex h-full flex-col rounded-lg border bg-card p-5 shadow-xs transition-colors hover:border-slate-300 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                {student.firstName[0]}
                {student.lastName[0]}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-semibold">
                  {student.firstName} {student.lastName}
                </h2>
                <p className="truncate text-sm text-muted-foreground">
                  {course.name} · {gradingTypeLabel(course.gradingType)}
                </p>
              </div>
              <ChevronRight
                className="size-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-sm">
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <FileText className="size-4" aria-hidden />
                {publishedBimesters} de 4 bimestres publicados
              </span>
              {pendingAcknowledgements > 0 && (
                <StatusBadge tone="warning" dot>
                  {pendingAcknowledgements === 1
                    ? "1 bimestre sin leer"
                    : `${pendingAcknowledgements} bimestres sin leer`}
                </StatusBadge>
              )}
            </div>
            <span className="mt-4 text-sm font-medium text-primary group-hover:underline">
              Ver boletín
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
