"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ExamAgenda } from "@/application/exams";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ConfirmDelete } from "@/features/admin/confirm-delete";
import { ExamAgendaView } from "@/features/exams/exam-agenda";
import { ExamDetailView } from "@/features/exams/exam-detail";
import {
  editExamForm,
  ExamDialog,
  newExamForm,
  type ExamFormState,
} from "@/features/exams/exam-dialog";
import { errorMessage } from "@/lib/error-message";
import { getServices } from "@/providers/services";
import { useAsyncData } from "@/providers/use-async-data";
import { useSession } from "@/providers/session-provider";

/** Container: exam agenda of the teacher's courses, with create / edit / delete. */
export function TeacherExamsContainer() {
  const { state } = useSession();
  const teacherId = state.session?.userId ?? "";
  const { data, error, loading, reload } = useAsyncData(`teacher-exams:${teacherId}`, (s) =>
    s.teacher.listExams(teacherId),
  );
  const [form, setForm] = useState<ExamFormState | null>(null);

  function openNew(agenda: ExamAgenda) {
    const last = agenda.items.filter((i) => i.exam.date <= agenda.today).at(-1);
    setForm(newExamForm(agenda.courses[0]?.id ?? "", agenda.today, last?.exam.bimester ?? 1));
  }

  async function save(values: ExamFormState) {
    const { id, courseId, ...details } = values;
    const teacher = getServices().teacher;
    if (id) await teacher.updateExam(teacherId, id, details);
    else await teacher.createExam(teacherId, { courseId, ...details });
    toast.success(id ? "Examen actualizado" : "Examen creado");
    setForm(null);
    reload();
  }

  async function remove(examId: string) {
    try {
      await getServices().teacher.deleteExam(teacherId, examId);
      toast.success("Examen eliminado");
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  const newButton = data && data.courses.length > 0 && (
    <Button onClick={() => openNew(data)}>
      <Plus aria-hidden />
      Nuevo examen
    </Button>
  );

  return (
    <>
      <PageHeader
        title="Exámenes"
        description="Agenda de evaluaciones de sus cursos. Las notas de cada examen se publican a las familias sin aprobación de Dirección."
        actions={newButton}
      />
      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {data && (
        <ExamAgendaView
          agenda={data}
          hrefFor={(item) => `/teacher/exams/${item.exam.id}`}
          emptyAction={newButton}
          calendar={{
            title: "Calendario de exámenes",
            description: "Muestra los exámenes del curso elegido.",
          }}
          ctaLabel={(item) =>
            item.status === "pending-grades"
              ? "Cargar notas"
              : item.status === "upcoming"
                ? "Ver lista del curso"
                : "Ver notas"
          }
          renderActions={(item) => (
            <>
              <Button
                variant="ghost"
                className="h-11 min-w-11 gap-2 px-3 text-[15px]"
                aria-label={`Editar ${item.exam.topic}`}
                onClick={() => setForm(editExamForm(item.exam))}
              >
                <Pencil aria-hidden />
                <span className="hidden md:inline">Editar</span>
              </Button>
              <ConfirmDelete
                title="¿Eliminar el examen?"
                description={`Se eliminará "${item.exam.topic}" (${item.course.name}) con sus notas. Esta acción no se puede deshacer.`}
                onConfirm={() => void remove(item.exam.id)}
              >
                <Button
                  variant="ghost"
                  className="h-11 min-w-11 gap-2 px-3 text-[15px] text-muted-foreground hover:text-destructive"
                  aria-label={`Eliminar ${item.exam.topic}`}
                >
                  <Trash2 aria-hidden />
                  <span className="hidden md:inline">Eliminar</span>
                </Button>
              </ConfirmDelete>
            </>
          )}
        />
      )}
      {form && data && (
        <ExamDialog
          initial={form}
          courses={data.courses}
          onClose={() => setForm(null)}
          onSubmit={save}
        />
      )}
    </>
  );
}

/** Container: one exam of the teacher, with its grade sheet. */
export function TeacherExamContainer() {
  const { examId } = useParams<{ examId: string }>();
  const { state } = useSession();
  const teacherId = state.session?.userId ?? "";
  const { data, error, loading, setData } = useAsyncData(
    `teacher-exam:${teacherId}:${examId}`,
    (s) => s.teacher.getExam(teacherId, examId),
  );

  if (loading) return <LoadingState />;
  if (error || !data) {
    return <ErrorState message={error ?? "Examen no encontrado."} backHref="/teacher/exams" />;
  }
  return (
    <ExamDetailView
      key={`${data.exam.id}:${data.exam.updatedAt}`}
      detail={data}
      breadcrumbs={[{ label: "Exámenes", href: "/teacher/exams" }, { label: data.exam.topic }]}
      editing={{
        save: (changes) => getServices().teacher.saveExamGrades(teacherId, examId, changes),
        publish: () => getServices().teacher.publishExamGrades(teacherId, examId),
        onChange: setData,
      }}
    />
  );
}
