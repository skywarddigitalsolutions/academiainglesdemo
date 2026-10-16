"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, CalendarDays, Users } from "lucide-react";
import type { TeacherCourseSummary } from "@/application/teacher-use-cases";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageHeader, SectionHeading } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { gradingTypeLabel } from "@/domain/course";
import { periodLabel, periodParam } from "@/features/report-card/period";
import { PeriodProgressList, ProgressLegend } from "@/features/report-card/period-progress";
import { useAsyncData } from "@/providers/use-async-data";
import { useSession } from "@/providers/session-provider";

/** Container: loads the teacher's courses with their loading progress. */
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
        description="Elija un curso y un período para cargar las notas de todos sus alumnos en una sola planilla."
        breadcrumbs={[{ label: "Inicio" }]}
      />
      {loading && <LoadingState variant="cards" />}
      {error && <ErrorState message={error} />}
      {data && <CourseGrid courses={data} />}
    </>
  );
}

function currentPeriod(course: TeacherCourseSummary) {
  return course.progress.find((p) => p.published < p.total) ?? course.progress[0];
}

/** Presentational: one card per course with progress per period. */
function CourseGrid({ courses }: { courses: TeacherCourseSummary[] }) {
  if (courses.length === 0) {
    return <EmptyState icon={BookOpen} title="No tiene cursos asignados." />;
  }
  return (
    <section>
      <SectionHeading title="Mis cursos" actions={<ProgressLegend />} />
      <ul className="grid gap-4 lg:grid-cols-2">
        {courses.map((summary) => {
          const { course, studentCount, progress } = summary;
          const current = currentPeriod(summary);
          const base = `/teacher/courses/${course.id}`;
          return (
            <li key={course.id} className="surface-card flex flex-col">
              <div className="flex items-start justify-between gap-4 p-5 pb-4">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold tracking-[-0.01em]">{course.name}</h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="size-3.5" aria-hidden />
                      {course.schedule}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="size-3.5" aria-hidden />
                      {studentCount} alumnos
                    </span>
                  </div>
                </div>
                <StatusBadge>{gradingTypeLabel(course.gradingType)}</StatusBadge>
              </div>
              <div className="border-t border-slate-100 px-5 py-3">
                <PeriodProgressList
                  progress={progress}
                  hrefFor={(p) => `${base}?periodo=${periodParam(p.period)}`}
                />
              </div>
              <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
                <span className="text-[13px] text-muted-foreground">
                  En curso: <span className="font-medium text-foreground">{periodLabel(current.period)}</span>
                </span>
                <Button asChild size="sm">
                  <Link href={`${base}?periodo=${periodParam(current.period)}`}>
                    Cargar notas
                    <ArrowRight aria-hidden />
                  </Link>
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
