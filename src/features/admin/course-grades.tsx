"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Check, Loader2, MessageSquarePlus, Undo2 } from "lucide-react";
import { toast } from "sonner";
import type { GradeSheet } from "@/application/grade-sheet";
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
import { gradingTypeLabel } from "@/domain/course";
import type { PeriodReview } from "@/domain/period-review";
import type { ReportPeriod } from "@/domain/report-card";
import { displayName, type User } from "@/domain/user";
import { CourseGradeSheet } from "@/features/grade-sheet/course-grade-sheet";
import { CourseNotesPanel } from "@/features/grade-sheet/course-notes";
import { Schedule } from "@/features/grade-sheet/course-picker";
import { ReviewBanner } from "@/features/grade-sheet/review-banner";
import { periodLabel } from "@/features/report-card/period";
import { errorMessage } from "@/lib/error-message";
import { getServices } from "@/providers/services";
import { useSession } from "@/providers/session-provider";
import { useAsyncData } from "@/providers/use-async-data";
import { NoteDialog } from "./note-dialog";

interface Data {
  sheet: GradeSheet;
  teachers: User[];
}

/** Container: grade sheet of one course for Dirección. */
export function CourseGradesContainer() {
  const { courseId } = useParams<{ courseId: string }>();
  const { data, error, loading, setData } = useAsyncData(
    `admin-course-grades:${courseId}`,
    async (s): Promise<Data> => {
      const [sheet, teachers] = await Promise.all([
        s.admin.getGradeSheet(courseId),
        s.admin.listTeachers(),
      ]);
      return {
        sheet,
        teachers: teachers
          .filter((t) => sheet.course.teacherIds.includes(t.teacher.id))
          .map((t) => t.teacher),
      };
    },
  );

  if (loading) return <LoadingState />;
  if (error || !data) {
    return <ErrorState message={error ?? "Curso no encontrado."} backHref="/admin/grades" />;
  }
  return (
    <CourseGrades
      key={courseId}
      data={data}
      onSheetChange={(sheet) => setData({ ...data, sheet })}
    />
  );
}

/* ------------------------------------------------------------------------- */

type DialogKind = "approve" | "return" | "note" | null;

function CourseGrades({
  data,
  onSheetChange,
}: {
  data: Data;
  onSheetChange: (sheet: GradeSheet) => void;
}) {
  const { sheet, teachers } = data;
  const { course, rows } = sheet;
  const teacherText = teachers.map(displayName).join(", ") || "Sin docente asignado";
  const { state } = useSession();
  const adminId = state.session?.userId ?? "";
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [busy, setBusy] = useState(false);
  const notes = useAsyncData(`admin-notes:${course.id}`, (s) => s.admin.listCourseNotes(course.id));

  async function approve(period: ReportPeriod) {
    setBusy(true);
    try {
      onSheetChange(await getServices().admin.approvePeriod(adminId, course.id, period));
      toast.success("Aprobado y publicado", {
        description: `${periodLabel(period)}: las familias ya pueden verlo.`,
      });
      setDialog(null);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function giveBack(period: ReportPeriod, text: string) {
    try {
      onSheetChange(await getServices().admin.returnPeriod(adminId, course.id, period, text));
      notes.reload();
      toast.success("Devuelto al docente", {
        description: `${periodLabel(period)}: el docente verá su observación.`,
      });
      return true;
    } catch (err) {
      toast.error(errorMessage(err));
      return false;
    }
  }

  async function writeNote(period: ReportPeriod, text: string, aboutPeriod: boolean) {
    try {
      await getServices().admin.addCourseNote(adminId, course.id, text, aboutPeriod ? period : null);
      notes.reload();
      toast.success("Nota enviada al docente");
      return true;
    } catch (err) {
      toast.error(errorMessage(err));
      return false;
    }
  }

  const pending = (review: PeriodReview | null) => review?.status === "pending";

  return (
    <CourseGradeSheet
      sheet={sheet}
      onSheetChange={onSheetChange}
      eyebrow="Notas"
      breadcrumbs={[{ label: "Notas", href: "/admin/grades" }, { label: course.name }]}
      description={
        <>
          <Schedule value={course.schedule} /> · {rows.length} alumnos
          <span className="hidden sm:inline"> · {teacherText}</span> ·{" "}
          <span className="whitespace-nowrap text-xs">{gradingTypeLabel(course.gradingType)}</span>
        </>
      }
      emptyDescription="Puede darlos de alta desde Alumnos."
      editNote="Puede corregir antes de aprobar. Los períodos publicados siguen publicados: las familias verán las correcciones."
      savePeriod={(period, changes) => getServices().admin.saveGradeSheet(course.id, period, changes)}
      savedDescription={(pendingPeriods) =>
        pendingPeriods.some((p) => p.touchesPublished)
          ? "Incluye boletines publicados: las familias ya ven las notas corregidas."
          : "Los períodos sin publicar quedan como borrador hasta su aprobación."
      }
      banner={({ review }) => <ReviewBanner review={review} viewer="admin" />}
      readActions={({ review }) =>
        pending(review) ? (
          <>
            <Button variant="outline" onClick={() => setDialog("return")} disabled={busy}>
              <Undo2 aria-hidden />
              <span className="md:hidden">Devolver</span>
              <span className="hidden md:inline">Devolver al docente</span>
            </Button>
            <Button onClick={() => setDialog("approve")} disabled={busy}>
              <Check aria-hidden />
              <span className="md:hidden">Aprobar</span>
              <span className="hidden md:inline">Aprobar y publicar</span>
            </Button>
          </>
        ) : null
      }
      renderName={(row, name) => (
        <Link
          href={`/admin/report-cards/${row.student.id}`}
          title="Ver boletín completo"
          className="-mx-1 block rounded-md px-1 py-0.5 hover:text-primary-strong hover:[&_span]:text-primary-strong focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
        >
          {name}
        </Link>
      )}
      aside={
        <CourseNotesPanel
          notes={notes.data ?? []}
          emptyText="Todavía no escribió notas para el docente de este curso."
          action={
            <Button variant="outline" size="sm" className="h-10 sm:h-8" onClick={() => setDialog("note")}>
              <MessageSquarePlus aria-hidden />
              Escribir nota al docente
            </Button>
          }
        />
      }
    >
      {({ period, review }) => (
        <>
          <AlertDialog open={dialog === "approve"} onOpenChange={(o) => !busy && setDialog(o ? "approve" : null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Aprobar y publicar?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se publicará el {periodLabel(period).toLowerCase()} de{" "}
                  {review?.studentIds.length === 1 ? "1 alumno" : `${review?.studentIds.length ?? 0} alumnos`}.
                  Las familias podrán verlo de inmediato.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  disabled={busy}
                  onClick={(e) => {
                    e.preventDefault();
                    void approve(period);
                  }}
                >
                  {busy && <Loader2 className="animate-spin" aria-hidden />}
                  Aprobar y publicar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <NoteDialog
            open={dialog === "return"}
            onOpenChange={(o) => setDialog(o ? "return" : null)}
            title="Devolver al docente"
            description={`Explique qué debe revisar en el ${periodLabel(period).toLowerCase()}. El docente podrá editarlo y volver a enviarlo.`}
            submitLabel="Devolver"
            placeholder="Por ejemplo: revise la nota de aplicación de…"
            onSubmit={(text) => giveBack(period, text)}
          />
          <NoteDialog
            open={dialog === "note"}
            onOpenChange={(o) => setDialog(o ? "note" : null)}
            title="Escribir nota al docente"
            description={`La verá ${teacherText === "Sin docente asignado" ? "el docente" : teacherText} en la planilla de ${course.name}.`}
            submitLabel="Enviar nota"
            placeholder="Escriba su mensaje para el docente."
            periodOption={periodLabel(period)}
            onSubmit={(text, aboutPeriod) => writeNote(period, text, aboutPeriod)}
          />
        </>
      )}
    </CourseGradeSheet>
  );
}
