"use client";

import Link from "next/link";
import { ArrowRight, ClipboardCheck, GraduationCap, Users, UsersRound } from "lucide-react";
import type { CourseOverview } from "@/application/admin-use-cases";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { gradingTypeLabel } from "@/domain/course";
import { displayName } from "@/domain/user";
import { useAsyncData } from "@/providers/use-async-data";

/** Container: institution overview for the director. */
export function AdminOverview() {
  const { data, error, loading } = useAsyncData("admin-overview", (s) =>
    s.admin.getOverview(),
  );

  return (
    <>
      <PageHeader
        title="Resumen de Dirección"
        description="Estado general de los boletines del ciclo lectivo."
        actions={
          <Button asChild size="lg" className="font-semibold">
            <Link href="/admin/approvals">
              <ClipboardCheck aria-hidden />
              Revisar aprobaciones
            </Link>
          </Button>
        }
      />
      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {data && (
        <>
          <StatGrid totals={data.totals} />
          <CourseTable courses={data.courses} />
        </>
      )}
    </>
  );
}

function StatGrid({
  totals,
}: {
  totals: { students: number; parents: number; teachers: number; pendingApprovals: number };
}) {
  const stats = [
    {
      label: "Aprobaciones pendientes",
      value: totals.pendingApprovals,
      icon: ClipboardCheck,
      href: "/admin/approvals",
      highlight: totals.pendingApprovals > 0,
    },
    { label: "Alumnos", value: totals.students, icon: Users, href: "/admin/students" },
    { label: "Familias", value: totals.parents, icon: UsersRound, href: "/admin/parents" },
    { label: "Docentes", value: totals.teachers, icon: GraduationCap, href: "/admin/teachers" },
  ];
  return (
    <ul className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map(({ label, value, icon: Icon, href, highlight }) => (
        <li key={label}>
          <Link
            href={href}
            className={
              "flex h-full flex-col gap-2 rounded-2xl border bg-card p-4 shadow-sm transition hover:border-celeste sm:p-5 " +
              (highlight ? "border-celeste bg-celeste-light/50" : "")
            }
          >
            <Icon className="size-5 text-celeste-strong" aria-hidden />
            <span className="font-heading text-3xl font-semibold text-navy">{value}</span>
            <span className="text-sm text-muted-foreground">{label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function CourseTable({ courses }: { courses: CourseOverview[] }) {
  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold">Cursos</h2>
      <ul className="grid gap-3 md:grid-cols-3">
        {courses.map(({ course, teachers, studentCount, pendingApprovals }) => (
          <li key={course.id} className="flex flex-col rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-semibold">{course.name}</h3>
              {pendingApprovals > 0 && (
                <span className="rounded-full bg-celeste-light px-2 py-0.5 text-xs font-semibold text-navy ring-1 ring-celeste">
                  {pendingApprovals} por aprobar
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{gradingTypeLabel(course.gradingType)}</p>
            <dl className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Docente</dt>
                <dd className="text-right font-medium text-navy">
                  {teachers.map(displayName).join(", ") || "Sin asignar"}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Alumnos</dt>
                <dd className="font-medium text-navy">{studentCount}</dd>
              </div>
            </dl>
            <Link
              href={`/admin/students?course=${course.id}`}
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-celeste-strong hover:underline"
            >
              Ver alumnos <ArrowRight className="size-4" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
