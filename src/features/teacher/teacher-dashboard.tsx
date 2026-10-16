"use client";

import Link from "next/link";
import { BookOpen, CalendarDays, ChevronRight, Users } from "lucide-react";
import type { TeacherCourseSummary } from "@/application/teacher-use-cases";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
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
        breadcrumbs={[{ label: "Inicio" }]}
      />
      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {data && (
        <>
          <Summary courses={data} />
          <h2 className="mb-3 text-sm font-semibold">Mis cursos</h2>
          <CourseGrid courses={data} />
        </>
      )}
    </>
  );
}

function Summary({ courses }: { courses: TeacherCourseSummary[] }) {
  const sum = (pick: (c: TeacherCourseSummary) => number) =>
    courses.reduce((total, c) => total + pick(c), 0);
  const stats = [
    { label: "Cursos", value: courses.length },
    { label: "Alumnos", value: sum((c) => c.studentCount) },
    { label: "Bimestres en borrador", value: sum((c) => c.drafts) },
    { label: "Esperando aprobación", value: sum((c) => c.awaitingApproval) },
  ];
  return (
    <dl className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-lg border bg-card p-4 shadow-xs">
          <dt className="text-sm text-muted-foreground">{stat.label}</dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums">{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Presentational: grid of course cards. */
function CourseGrid({ courses }: { courses: TeacherCourseSummary[] }) {
  if (courses.length === 0) {
    return <EmptyState icon={BookOpen} title="No tiene cursos asignados" />;
  }
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map(({ course, studentCount, drafts, awaitingApproval }) => (
        <li key={course.id}>
          <Link
            href={`/teacher/courses/${course.id}`}
            className="group flex h-full flex-col rounded-lg border bg-card p-5 shadow-xs transition-colors hover:border-slate-300 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold">{course.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {gradingTypeLabel(course.gradingType)}
                </p>
              </div>
              <ChevronRight
                className="size-4 text-slate-400 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </div>
            <div className="mt-4 flex flex-col gap-1.5 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="size-4" aria-hidden />
                {course.schedule}
              </span>
              <span className="inline-flex items-center gap-2">
                <Users className="size-4" aria-hidden />
                {studentCount} alumnos
              </span>
            </div>
            <div className="mt-auto flex flex-wrap gap-2 pt-4">
              <StatusBadge>{drafts} en borrador</StatusBadge>
              <StatusBadge tone={awaitingApproval > 0 ? "warning" : "neutral"}>
                {awaitingApproval} esperando aprobación
              </StatusBadge>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
