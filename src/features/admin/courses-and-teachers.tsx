"use client";

import { CalendarDays, Mail, Users } from "lucide-react";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { gradingTypeLabel } from "@/domain/course";
import { displayName } from "@/domain/user";
import { useAsyncData } from "@/providers/use-async-data";

/** Read-only list of courses (grading type is configured per course). */
export function CoursesList() {
  const { data, error, loading } = useAsyncData("admin-courses", (s) => s.admin.listCourses());
  return (
    <>
      <PageHeader
        title="Cursos"
        description="El tipo de calificación se define por curso: conceptual o numérica."
      />
      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {data && (
        <ul className="grid gap-3 md:grid-cols-3">
          {data.map(({ course, teachers, studentCount }) => (
            <li key={course.id} className="rounded-2xl border bg-card p-5 shadow-sm">
              <h2 className="text-xl font-semibold">{course.name}</h2>
              <span className="mt-1 inline-block rounded-full bg-celeste-light px-2.5 py-0.5 text-xs font-medium text-navy">
                {gradingTypeLabel(course.gradingType)}
              </span>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="size-4" aria-hidden />
                  <dd>{course.schedule}</dd>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="size-4" aria-hidden />
                  <dd>{studentCount} alumnos</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Docente</dt>
                  <dd className="font-medium text-navy">{teachers.map(displayName).join(", ") || "Sin asignar"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Curso siguiente</dt>
                  <dd className="font-medium text-navy">{course.nextCourseName}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/** Read-only list of teachers and their courses. */
export function TeachersList() {
  const { data, error, loading } = useAsyncData("admin-teachers", (s) => s.admin.listTeachers());
  return (
    <>
      <PageHeader title="Docentes" description="Docentes del instituto y cursos asignados." />
      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {data && (
        <ul className="grid gap-3 md:grid-cols-2">
          {data.map(({ teacher, courses }) => (
            <li key={teacher.id} className="flex items-start gap-4 rounded-2xl border bg-card p-5 shadow-sm">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-navy font-heading text-lg text-white">
                {teacher.firstName[0]}
                {teacher.lastName[0]}
              </span>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold">{displayName(teacher)}</h2>
                <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Mail className="size-4" aria-hidden />
                  {teacher.email}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {courses.map((c) => (
                    <span
                      key={c.id}
                      className="rounded-full bg-celeste-light px-2.5 py-0.5 text-xs font-medium text-navy"
                    >
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
