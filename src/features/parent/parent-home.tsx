"use client";

import Link from "next/link";
import { BellDot, ChevronRight, FileText } from "lucide-react";
import type { ChildSummary } from "@/application/parent-use-cases";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageHeader } from "@/components/layout/page-header";
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
      <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        No hay alumnos vinculados a su cuenta. Comuníquese con la secretaría del instituto.
      </p>
    );
  }
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {items.map(({ student, course, publishedBimesters, pendingAcknowledgements }) => (
        <li key={student.id}>
          <Link
            href={`/parent/report-cards/${student.id}`}
            className="group flex h-full flex-col rounded-2xl border bg-card p-5 shadow-sm transition hover:border-celeste hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-full bg-navy font-heading text-lg text-white">
                  {student.firstName[0]}
                  {student.lastName[0]}
                </span>
                <div>
                  <h2 className="text-xl font-semibold">
                    {student.firstName} {student.lastName}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {course.name} · {gradingTypeLabel(course.gradingType)}
                  </p>
                </div>
              </div>
              <ChevronRight className="mt-3 size-5 text-muted-foreground" aria-hidden />
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2 border-t pt-4 text-sm">
              <span className="inline-flex items-center gap-1.5 text-navy">
                <FileText className="size-4 text-celeste-strong" aria-hidden />
                {publishedBimesters} de 4 bimestres publicados
              </span>
              {pendingAcknowledgements > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-warning-bg px-2.5 py-0.5 text-xs font-semibold text-warning">
                  <BellDot className="size-3.5" aria-hidden />
                  {pendingAcknowledgements === 1
                    ? "1 bimestre sin leer"
                    : `${pendingAcknowledgements} bimestres sin leer`}
                </span>
              )}
            </div>
            <span className="mt-4 text-sm font-semibold text-celeste-strong group-hover:underline">
              Ver boletín
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
