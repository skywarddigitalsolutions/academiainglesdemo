"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCheck, CheckCircle2, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { PendingApproval } from "@/application/admin-use-cases";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { fullName } from "@/domain/student";
import { GradeText } from "@/features/report-card/grade-text";
import { errorMessage } from "@/lib/error-message";
import { bimesterLabel, formatDateTime } from "@/lib/format";
import { getServices } from "@/providers/services";
import { useAsyncData } from "@/providers/use-async-data";

/** Container: bimesters signed by teachers that wait for approval. */
export function Approvals() {
  const { data, error, loading, reload } = useAsyncData("admin-approvals", (s) =>
    s.admin.listPendingApprovals(),
  );
  const [busy, setBusy] = useState<string | null>(null);

  async function approve(items: PendingApproval[], key: string) {
    setBusy(key);
    try {
      for (const item of items) {
        await getServices().admin.approveBimester(item.student.id, item.bimester);
      }
      toast.success(
        items.length === 1
          ? `${bimesterLabel(items[0].bimester)} de ${items[0].student.firstName} aprobado y publicado.`
          : `${items.length} bimestres aprobados y publicados a las familias.`,
      );
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(null);
      reload();
    }
  }

  return (
    <>
      <PageHeader
        title="Aprobaciones pendientes"
        description="Bimestres firmados por los docentes. Al aprobarlos, se publican a las familias."
        actions={
          data && data.length > 0 ? (
            <ApproveAllButton
              count={data.length}
              busy={busy === "all"}
              disabled={busy !== null}
              onConfirm={() => approve(data, "all")}
            />
          ) : null
        }
      />
      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {data && (
        <PendingList
          items={data}
          busyKey={busy}
          onApprove={(item) => approve([item], `${item.student.id}:${item.bimester}`)}
        />
      )}
    </>
  );
}

function ApproveAllButton({
  count,
  busy,
  disabled,
  onConfirm,
}: {
  count: number;
  busy: boolean;
  disabled: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="lg" className="font-semibold" disabled={disabled}>
          {busy ? <Loader2 className="animate-spin" aria-hidden /> : <CheckCheck aria-hidden />}
          Aprobar todos ({count})
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Aprobar {count} bimestres?</AlertDialogTitle>
          <AlertDialogDescription>
            Las calificaciones quedarán publicadas y las familias podrán verlas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Aprobar todos</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Presentational: pending bimesters grouped by course. */
function PendingList({
  items,
  busyKey,
  onApprove,
}: {
  items: PendingApproval[];
  busyKey: string | null;
  onApprove: (item: PendingApproval) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border bg-card px-6 py-12 text-center">
        <CheckCircle2 className="size-10 text-success" aria-hidden />
        <p className="font-heading text-xl text-navy">No hay bimestres pendientes</p>
        <p className="text-sm text-muted-foreground">
          Todos los bimestres firmados por los docentes ya fueron aprobados.
        </p>
      </div>
    );
  }

  const courses = [...new Map(items.map((i) => [i.course.id, i.course])).values()];

  return (
    <div className="flex flex-col gap-8">
      {courses.map((course) => {
        const group = items.filter((i) => i.course.id === course.id);
        return (
          <section key={course.id}>
            <h2 className="mb-1 text-xl font-semibold">{course.name}</h2>
            <p className="mb-3 text-sm text-muted-foreground">
              Docente: {group[0].teacherNames.join(", ") || "—"} · {group.length} pendientes
            </p>
            <ul className="grid gap-3 lg:grid-cols-2">
              {group.map((item) => {
                const key = `${item.student.id}:${item.bimester}`;
                return (
                  <li key={key} className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-navy">{fullName(item.student)}</p>
                        <p className="text-xs text-muted-foreground">
                          {bimesterLabel(item.bimester)} · Firmado el{" "}
                          {formatDateTime(item.data.signatures.teacher.at)}
                        </p>
                      </div>
                      <dl className="flex gap-4 text-sm">
                        <div>
                          <dt className="text-xs text-muted-foreground">Aplicación</dt>
                          <dd className="font-semibold text-navy">
                            <GradeText value={item.data.applicationGrade} />
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">Conducta</dt>
                          <dd className="font-semibold text-navy">{item.data.conductGrade}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">Faltas</dt>
                          <dd className="font-semibold text-navy">{item.data.absences}</dd>
                        </div>
                      </dl>
                    </div>
                    {item.data.observation && (
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        “{item.data.observation}”
                      </p>
                    )}
                    <div className="flex flex-col gap-2 border-t pt-3 sm:flex-row sm:justify-end">
                      <Button asChild variant="outline" size="lg">
                        <Link href={`/admin/report-cards/${item.student.id}`}>
                          <Eye aria-hidden />
                          Ver boletín
                        </Link>
                      </Button>
                      <Button
                        size="lg"
                        className="font-semibold"
                        disabled={busyKey !== null}
                        onClick={() => onApprove(item)}
                      >
                        {busyKey === key ? (
                          <Loader2 className="animate-spin" aria-hidden />
                        ) : (
                          <CheckCheck aria-hidden />
                        )}
                        Aprobar
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
