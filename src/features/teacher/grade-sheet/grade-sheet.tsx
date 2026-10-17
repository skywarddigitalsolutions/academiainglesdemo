"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { Loader2, Send, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { isPeriodPublished, type GradeSheet } from "@/application/grade-sheet";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { gradingTypeLabel } from "@/domain/course";
import { isLockedForTeacher } from "@/domain/period-review";
import type { ReportPeriod } from "@/domain/report-card";
import { fullName } from "@/domain/student";
import { CourseGradeSheet } from "@/features/grade-sheet/course-grade-sheet";
import { CourseNotesPanel } from "@/features/grade-sheet/course-notes";
import { Schedule } from "@/features/grade-sheet/course-picker";
import { ReviewBanner } from "@/features/grade-sheet/review-banner";
import { publishCandidates } from "@/features/grade-sheet/sheet-summary";
import type { SheetRowView } from "@/features/grade-sheet/use-sheet-drafts";
import { periodLabel } from "@/features/report-card/period";
import { errorMessage } from "@/lib/error-message";
import { getServices } from "@/providers/services";
import { useAsyncData } from "@/providers/use-async-data";
import { useSession } from "@/providers/session-provider";

/** Container: loads the course grade sheet of the current teacher. */
export function GradeSheetContainer() {
  const { courseId } = useParams<{ courseId: string }>();
  const { state } = useSession();
  const teacherId = state.session?.userId ?? "";
  const { data, error, loading, setData } = useAsyncData(
    `grade-sheet:${teacherId}:${courseId}`,
    (s) => s.teacher.getGradeSheet(teacherId, courseId),
  );

  if (loading) return <GradeSheetSkeleton />;
  if (error || !data) {
    return <ErrorState message={error ?? "Curso no encontrado."} backHref="/teacher" />;
  }
  return (
    <TeacherGradeSheet key={courseId} sheet={data} teacherId={teacherId} onSheetChange={setData} />
  );
}

function GradeSheetSkeleton() {
  return (
    <div role="status">
      <span className="sr-only">Cargando planilla…</span>
      <Skeleton className="h-3 w-40" />
      <Skeleton className="mt-3 h-7 w-56" />
      <Skeleton className="mt-3 mb-8 h-4 w-80 max-w-full" />
      <LoadingState />
    </div>
  );
}

/* ------------------------------------------------------------------------- */

/**
 * Teacher sheet: read-only by default. Grades reach families only after
 * Dirección approves them: the teacher sends the period ("Enviar a
 * Dirección"), can take it back while pending, and edits again if returned.
 */
function TeacherGradeSheet({
  sheet,
  teacherId,
  onSheetChange,
}: {
  sheet: GradeSheet;
  teacherId: string;
  onSheetChange: (sheet: GradeSheet) => void;
}) {
  const { course, rows } = sheet;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const notes = useAsyncData(`teacher-notes:${teacherId}:${course.id}`, (s) =>
    s.teacher.listCourseNotes(teacherId, course.id),
  );

  async function handleSubmit(period: ReportPeriod) {
    setBusy(true);
    try {
      const services = getServices();
      const result = await services.teacher.submitForApproval(teacherId, course.id, period);
      onSheetChange(await services.teacher.getGradeSheet(teacherId, course.id));
      const n = result.submitted.length;
      toast.success("Enviado a Dirección", {
        description: `${periodLabel(period)}: ${n === 1 ? "1 alumno" : `${n} alumnos`}. Las familias lo verán cuando Dirección lo apruebe.`,
      });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
      setConfirmOpen(false);
    }
  }

  async function handleWithdraw(period: ReportPeriod) {
    setBusy(true);
    try {
      onSheetChange(await getServices().teacher.withdrawSubmission(teacherId, course.id, period));
      toast.success("Envío retirado", {
        description: `${periodLabel(period)}: volvió a borrador y puede editarlo.`,
      });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <CourseGradeSheet
      sheet={sheet}
      onSheetChange={onSheetChange}
      eyebrow="Notas"
      breadcrumbs={[{ label: "Mis cursos", href: "/teacher" }, { label: course.name }]}
      description={
        <>
          <Schedule value={course.schedule} /> · {rows.length} alumnos ·{" "}
          <span className="whitespace-nowrap text-xs">{gradingTypeLabel(course.gradingType)}</span>
        </>
      }
      saveLabel="Guardar borrador"
      editNote="Guarde los cambios y luego envíe el período a Dirección. Las notas publicadas solo las corrige Dirección."
      savePeriod={(period, changes) =>
        getServices().teacher.saveGradeSheet(teacherId, course.id, period, changes)
      }
      savedDescription={() => "Quedaron como borrador. Envíelos a Dirección cuando estén listos."}
      publishHint
      canEdit={({ review }) => !isLockedForTeacher(review)}
      lockRow={(row, period) => isPeriodPublished(row.card, period)}
      banner={({ review }) => <ReviewBanner review={review} viewer="teacher" />}
      readActions={({ period, view, review }) => {
        if (isLockedForTeacher(review)) {
          return (
            <Button variant="outline" onClick={() => void handleWithdraw(period)} disabled={busy}>
              {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Undo2 aria-hidden />}
              Retirar envío
            </Button>
          );
        }
        const { ready } = publishCandidates(view, period);
        return (
          <Button
            onClick={() => setConfirmOpen(true)}
            disabled={ready.length === 0 || busy}
            title={
              ready.length === 0
                ? "No hay alumnos completos sin publicar en este período."
                : undefined
            }
          >
            <Send aria-hidden />
            Enviar a Dirección
          </Button>
        );
      }}
      aside={
        notes.data ? (
          <CourseNotesPanel
            notes={notes.data}
            emptyText="Dirección todavía no dejó notas para este curso."
          />
        ) : null
      }
    >
      {({ period, view }) => (
        <SubmitDialog
          open={confirmOpen}
          onOpenChange={(open) => !busy && setConfirmOpen(open)}
          period={period}
          view={view}
          busy={busy}
          onConfirm={() => void handleSubmit(period)}
        />
      )}
    </CourseGradeSheet>
  );
}

function SubmitDialog({
  open,
  onOpenChange,
  period,
  view,
  busy,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  period: ReportPeriod;
  view: SheetRowView[];
  busy: boolean;
  onConfirm: () => void;
}) {
  const { ready, incomplete } = publishCandidates(view, period);
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Enviar a Dirección?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="flex flex-col gap-3">
              <p>
                Se enviará el {periodLabel(period).toLowerCase()} de{" "}
                <strong className="font-semibold text-foreground">
                  {ready.length === 1 ? "1 alumno completo" : `${ready.length} alumnos completos`}
                </strong>
                . Las familias lo verán cuando Dirección lo apruebe. Mientras tanto no podrá
                editarlo.
              </p>
              {incomplete.length > 0 && (
                <div>
                  <p>
                    Quedan como borrador, con datos incompletos ({incomplete.length}):
                  </p>
                  <ul className="mt-1 max-h-32 list-disc overflow-y-auto pl-5 text-foreground">
                    {incomplete.map((r) => (
                      <li key={r.row.student.id}>{fullName(r.row.student)}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
          >
            {busy && <Loader2 className="animate-spin" aria-hidden />}
            Enviar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
