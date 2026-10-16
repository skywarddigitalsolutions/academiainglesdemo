"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCheck, CheckCircle2, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { PendingApproval } from "@/application/admin-use-cases";
import { EmptyState } from "@/components/feedback/empty-state";
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
import {
  Table,
  TableBody,
  TableCard,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
        description="Bimestres firmados por los profesores. Al aprobarlos, se publican a las familias."
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
        <Button disabled={disabled}>
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
      <EmptyState
        icon={CheckCircle2}
        title="No hay bimestres pendientes"
        description="Todos los bimestres firmados por los profesores ya fueron aprobados."
      />
    );
  }

  const courses = [...new Map(items.map((i) => [i.course.id, i.course])).values()];

  return (
    <div className="flex flex-col gap-8">
      {courses.map((course) => {
        const group = items.filter((i) => i.course.id === course.id);
        return (
          <section key={course.id}>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-sm font-semibold">{course.name}</h2>
              <p className="text-sm text-muted-foreground">
                Profesor/a: {group[0].teacherNames.join(", ") || "—"} · {group.length} pendientes
              </p>
            </div>
            <TableCard>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alumno/a</TableHead>
                    <TableHead>Bimestre</TableHead>
                    <TableHead className="text-center">Aplicación</TableHead>
                    <TableHead className="text-center">Conducta</TableHead>
                    <TableHead className="text-center">Faltas</TableHead>
                    <TableHead>Firmado</TableHead>
                    <TableHead>
                      <span className="sr-only">Acciones</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.map((item) => {
                    const key = `${item.student.id}:${item.bimester}`;
                    return (
                      <TableRow key={key}>
                        <TableCell className="max-w-72">
                          <p className="font-medium whitespace-nowrap">{fullName(item.student)}</p>
                          {item.data.observation && (
                            <p className="truncate text-xs text-muted-foreground" title={item.data.observation}>
                              {item.data.observation}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{bimesterLabel(item.bimester)}</TableCell>
                        <TableCell className="text-center tabular-nums">
                          <GradeText value={item.data.applicationGrade} />
                        </TableCell>
                        <TableCell className="text-center">{item.data.conductGrade ?? "—"}</TableCell>
                        <TableCell className="text-center tabular-nums">{item.data.absences}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                          {formatDateTime(item.data.signatures.teacher.at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/admin/report-cards/${item.student.id}`}>
                                <Eye aria-hidden />
                                Ver
                              </Link>
                            </Button>
                            <Button
                              size="sm"
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
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableCard>
          </section>
        );
      })}
    </div>
  );
}
