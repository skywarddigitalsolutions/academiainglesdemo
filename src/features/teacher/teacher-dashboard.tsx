"use client";

import Link from "next/link";
import { CalendarDays, ChevronRight, ClipboardEdit, Clock, Users } from "lucide-react";
import type { TeacherCourseSummary } from "@/application/teacher-use-cases";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { gradingTypeLabel } from "@/domain/course";
import { useAsyncData } from "@/providers/use-async-data";
import { useSession } from "@/providers/session-provider";

/** Container: loads the teacher's courses. */
export function TeacherDashboard() {
  const { state } = useSession();
  const teacherId = state.session?.userId ?? "";
  const { data, error, loading } = useAsyncData(`teacher-courses:${teacherId}`, (s) =>
    s.teacher.listCourses(teacherId),
  );
  const firstName = state.session?.displayName.split(" ")[0] ?? "";

  return (
    <>
      <PageHeader
        title={`Hola, ${firstName}`}
        description="Seleccione un curso para cargar las calificaciones del bimestre."
      />
      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {data && <CourseGrid courses={data} />}
    </>
  );
}

/** Presentational: grid of course cards. */
function CourseGrid({ courses }: { courses: TeacherCourseSummary[] }) {
  if (courses.length === 0) {
    return <p className="text-sm text-muted-foreground">No tiene cursos asignados.</p>;
  }
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map(({ course, studentCount, drafts, awaitingApproval }) => (
        <li key={course.id}>
          <Link
            href={`/teacher/courses/${course.id}`}
            className="group flex h-full flex-col rounded-2xl border bg-card p-5 shadow-sm transition hover:border-celeste hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-xl font-semibold">{course.name}</h2>
                <span className="mt-1 inline-block rounded-full bg-celeste-light px-2.5 py-0.5 text-xs font-medium text-navy">
                  {gradingTypeLabel(course.gradingType)}
                </span>
              </div>
              <ChevronRight
                className="size-5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-navy"
                aria-hidden
              />
            </div>
            <dl className="mt-4 grid gap-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="size-4" aria-hidden />
                <dd>{course.schedule}</dd>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="size-4" aria-hidden />
                <dd>{studentCount} alumnos</dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap gap-2 border-t pt-4 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full bg-warning-bg px-2 py-0.5 font-medium text-warning">
                <ClipboardEdit className="size-3.5" aria-hidden />
                {drafts} en borrador
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-celeste-light px-2 py-0.5 font-medium text-navy">
                <Clock className="size-3.5" aria-hidden />
                {awaitingApproval} esperando aprobación
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
