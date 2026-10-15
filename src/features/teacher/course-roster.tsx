"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import type { CourseRoster as Roster } from "@/application/teacher-use-cases";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { gradingTypeLabel } from "@/domain/course";
import { fullName } from "@/domain/student";
import { BimesterStatusBadge } from "@/features/report-card/bimester-status-badge";
import { useAsyncData } from "@/providers/use-async-data";
import { useSession } from "@/providers/session-provider";

/** Container: loads the roster of a course for the current teacher. */
export function CourseRosterContainer() {
  const { courseId } = useParams<{ courseId: string }>();
  const { state } = useSession();
  const teacherId = state.session?.userId ?? "";
  const { data, error, loading } = useAsyncData(`roster:${teacherId}:${courseId}`, (s) =>
    s.teacher.getCourseRoster(teacherId, courseId),
  );

  if (loading) return <LoadingState />;
  if (error || !data) {
    return <ErrorState message={error ?? "Curso no encontrado."} backHref="/teacher" />;
  }
  return <CourseRosterView roster={data} />;
}

/** Presentational: students of a course with their bimester statuses. */
function CourseRosterView({ roster }: { roster: Roster }) {
  const { course, students } = roster;
  return (
    <>
      <PageHeader
        title={course.name}
        backHref="/teacher"
        backLabel="Mis cursos"
        description={`${gradingTypeLabel(course.gradingType)} · ${course.schedule} · ${students.length} alumnos`}
      />

      {/* Mobile: cards */}
      <ul className="flex flex-col gap-3 md:hidden">
        {students.map(({ student, statuses }) => (
          <li key={student.id}>
            <Link
              href={`/teacher/students/${student.id}`}
              className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm"
            >
              <div className="min-w-0">
                <p className="font-semibold text-navy">{fullName(student)}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {statuses.map((status, i) => (
                    <span key={i} className="inline-flex items-center gap-1 text-xs">
                      <span className="font-medium text-muted-foreground">B{i + 1}</span>
                      <BimesterStatusBadge status={status} compact />
                    </span>
                  ))}
                </div>
              </div>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>

      {/* Desktop: table */}
      <div className="hidden overflow-hidden rounded-2xl border bg-card shadow-sm md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/70 text-left">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold text-navy">
                Alumno/a
              </th>
              {[1, 2, 3, 4].map((n) => (
                <th key={n} scope="col" className="px-3 py-3 text-center font-semibold text-navy">
                  {n}° Bim.
                </th>
              ))}
              <th scope="col" className="px-4 py-3">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {students.map(({ student, statuses }) => (
              <tr key={student.id} className="border-t hover:bg-celeste-light/40">
                <td className="px-4 py-3 font-medium text-navy">{fullName(student)}</td>
                {statuses.map((status, i) => (
                  <td key={i} className="px-3 py-3 text-center">
                    <BimesterStatusBadge status={status} compact />
                  </td>
                ))}
                <td className="px-4 py-3 text-right">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/teacher/students/${student.id}`}>Abrir boletín</Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
