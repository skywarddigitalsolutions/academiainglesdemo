"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
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
import { displayName } from "@/domain/user";
import { absenceRangeText, type AbsenceItem } from "@/features/exams/calendar-model";
import { ExamCalendar } from "@/features/exams/exam-calendar";
import { errorMessage } from "@/lib/error-message";
import { getServices } from "@/providers/services";
import { useAsyncData } from "@/providers/use-async-data";
import { AbsenceDialog, type AbsenceFormState } from "./absence-dialog";

/** Container: Dirección's calendar with every exam and the registered teacher absences. */
export function AdminCalendar() {
  const exams = useAsyncData("admin-exams", (s) => s.admin.listExams());
  const absences = useAsyncData("admin-absences", async (s) => {
    const [list, teachers] = await Promise.all([s.admin.listTeacherAbsences(), s.admin.listTeachers()]);
    return { list, teachers: teachers.map((t) => t.teacher) };
  });
  const [registering, setRegistering] = useState(false);
  const [removing, setRemoving] = useState<AbsenceItem | null>(null);
  const [busy, setBusy] = useState(false);

  if (exams.loading || absences.loading) return <LoadingState variant="cards" />;
  if (exams.error || !exams.data) return <ErrorState message={exams.error ?? "No se pudo cargar el calendario."} />;
  if (absences.error || !absences.data) {
    return <ErrorState message={absences.error ?? "No se pudieron cargar las ausencias."} />;
  }
  const agenda = exams.data;
  const { list, teachers } = absences.data;
  const items: AbsenceItem[] = list.flatMap((absence) => {
    const teacher = teachers.find((t) => t.id === absence.teacherId);
    return teacher ? [{ absence, teacherName: displayName(teacher) }] : [];
  });

  async function register(form: AbsenceFormState) {
    await getServices().admin.saveTeacherAbsence(form);
    absences.reload();
    setRegistering(false);
    toast.success("Ausencia registrada", { description: "Ya figura en el calendario." });
  }

  async function remove(item: AbsenceItem) {
    setBusy(true);
    try {
      await getServices().admin.deleteTeacherAbsence(item.absence.id);
      absences.reload();
      setRemoving(null);
      toast.success("Ausencia eliminada");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <ExamCalendar
        title="Calendario"
        description="Exámenes de todos los cursos y ausencias de los docentes."
        items={agenda.items}
        courses={agenda.courses}
        today={agenda.today}
        hrefFor={(item) => `/admin/exams/${item.exam.id}`}
        absences={items}
        onRegisterAbsence={() => setRegistering(true)}
        onDeleteAbsence={setRemoving}
      />
      {registering && (
        <AbsenceDialog
          teachers={teachers}
          today={agenda.today}
          onClose={() => setRegistering(false)}
          onSubmit={register}
        />
      )}
      <AlertDialog open={removing !== null} onOpenChange={(open) => !open && !busy && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta ausencia?</AlertDialogTitle>
            <AlertDialogDescription>
              {removing &&
                `${removing.teacherName}, ${absenceRangeText(removing.absence.from, removing.absence.to)}: ${removing.absence.reason}. Dejará de figurar en el calendario.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                if (removing) void remove(removing);
              }}
            >
              {busy && <Loader2 className="animate-spin" aria-hidden />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
