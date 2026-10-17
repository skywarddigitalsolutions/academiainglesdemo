"use client";

import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageBand } from "@/components/layout/page-header";
import { CoursePicker } from "@/features/grade-sheet/course-picker";
import { useAsyncData } from "@/providers/use-async-data";
import { useSession } from "@/providers/session-provider";

/** Container: the teacher starts by choosing one of their courses. */
export function TeacherDashboard() {
  const { state } = useSession();
  const teacherId = state.session?.userId ?? "";
  const { data, error, loading } = useAsyncData(`teacher-courses:${teacherId}`, (s) =>
    s.teacher.listCourses(teacherId),
  );
  const firstName = state.session?.displayName.split(" ")[0] ?? "";

  return (
    <>
      <PageBand
        eyebrow={firstName ? `Hola, ${firstName}` : "Docente"}
        title="Mis cursos"
        description="Elija un curso para ver y cargar las calificaciones de cada período."
        breadcrumbs={[{ label: "Mis cursos" }]}
        stats={
          data && data.length > 0
            ? [
                { label: data.length === 1 ? "Curso asignado" : "Cursos asignados", value: data.length },
                { label: "Alumnos", value: data.reduce((n, c) => n + c.studentCount, 0) },
              ]
            : undefined
        }
      />
      {loading && <LoadingState variant="cards" />}
      {error && <ErrorState message={error} />}
      {data && (
        <CoursePicker
          courses={data}
          hrefFor={(id) => `/teacher/courses/${id}`}
          title="Cursos asignados"
          actionVerb="Cargar notas"
          emptyTitle="No tiene cursos asignados."
        />
      )}
    </>
  );
}
