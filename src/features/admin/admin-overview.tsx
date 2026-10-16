"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  GraduationCap,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import type { CourseOverview } from "@/application/admin-use-cases";
import type { PeriodProgress } from "@/application/progress";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageHeader, SectionHeading } from "@/components/layout/page-header";
import { gradingTypeLabel } from "@/domain/course";
import { displayName } from "@/domain/user";
import { periodShortLabel } from "@/features/report-card/period";
import {
  PeriodProgressList,
  ProgressBar,
  ProgressLegend,
} from "@/features/report-card/period-progress";
import { cn } from "@/lib/utils";
import { useAsyncData } from "@/providers/use-async-data";

/** Container: institution overview for Dirección. */
export function AdminOverview() {
  const { data, error, loading } = useAsyncData("admin-overview", (s) =>
    s.admin.getOverview(),
  );

  return (
    <>
      <PageHeader
        title="Inicio"
        description="Estado de los boletines del ciclo lectivo en todo el instituto."
      />
      {loading && <LoadingState variant="cards" />}
      {error && <ErrorState message={error} />}
      {data && (
        <div className="flex flex-col gap-10">
          <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Alumnos" value={data.totals.students} icon={Users} href="/admin/students" />
            <StatCard label="Familias" value={data.totals.parents} icon={UsersRound} href="/admin/parents" />
            <StatCard label="Docentes" value={data.totals.teachers} icon={GraduationCap} href="/admin/teachers" />
            <StatCard label="Cursos" value={data.totals.courses} icon={BookOpen} href="/admin/courses" />
          </ul>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <section className="flex flex-col">
              <SectionHeading title="Publicación por período" />
              <div className="surface-card flex-1 px-5 py-4">
                <PeriodProgressList progress={data.progress} />
                <ProgressLegend className="mt-3 border-t border-slate-100 pt-3" />
              </div>
            </section>
            <ReadingCard progress={data.progress} />
          </div>

          <CourseTable courses={data.courses} />
        </div>
      )}
    </>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  href,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  href: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="group surface-card flex h-full flex-col p-5 transition-[border-color,box-shadow] duration-150 hover:border-slate-300 hover:shadow-raised focus-visible:ring-4 focus-visible:ring-primary/15 focus-visible:outline-none"
      >
        <div className="flex items-center justify-between">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary-soft text-primary ring-1 ring-sky-100 ring-inset">
            <Icon className="size-[18px]" aria-hidden />
          </span>
          <ArrowUpRight
            className="size-4 text-slate-300 transition-colors duration-150 group-hover:text-slate-500"
            aria-hidden
          />
        </div>
        <span className="mt-5 text-[1.75rem] leading-none font-semibold tracking-[-0.02em] tabular-nums">
          {value}
        </span>
        <span className="mt-1.5 text-sm text-muted-foreground">{label}</span>
      </Link>
    </li>
  );
}

/** Published bimesters already read by families. */
function ReadingCard({ progress }: { progress: PeriodProgress[] }) {
  const bimesters = progress.filter((p) => p.period !== "closing");
  return (
    <section className="flex flex-col">
      <SectionHeading title="Lectura de las familias" />
      <div className="surface-card grid flex-1 grid-cols-2 divide-slate-100 sm:grid-cols-4 sm:divide-x">
        {bimesters.map((p) => {
          const pct = p.published === 0 ? null : Math.round((p.read / p.published) * 100);
          return (
            <div key={String(p.period)} className="flex flex-col justify-between p-5">
              <p className="text-[13px] font-medium text-slate-600">{periodShortLabel(p.period)}</p>
              <p
                className={cn(
                  "mt-3 text-2xl font-semibold tracking-[-0.02em] tabular-nums",
                  pct === null && "text-slate-300",
                )}
              >
                {pct === null ? "—" : `${pct}%`}
              </p>
              <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                {p.published === 0 ? "Sin publicar" : `${p.read} de ${p.published} leídos`}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CourseTable({ courses }: { courses: CourseOverview[] }) {
  return (
    <section>
      <SectionHeading title="Cursos" description="Alumnos con notas publicadas en cada período." />
      <div className="surface-card overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-slate-50/80">
            <tr className="border-b border-slate-200">
              <th className="h-9 px-4 text-left text-[11px] font-medium tracking-[0.04em] text-slate-500 uppercase">
                Curso
              </th>
              <th className="h-9 px-4 text-left text-[11px] font-medium tracking-[0.04em] text-slate-500 uppercase">
                Docente
              </th>
              {courses[0]?.progress.map((p) => (
                <th
                  key={String(p.period)}
                  className="h-9 px-3 text-left text-[11px] font-medium tracking-[0.04em] text-slate-500 uppercase"
                >
                  {periodShortLabel(p.period)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {courses.map(({ course, teachers, studentCount, progress }) => (
              <tr key={course.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/students?course=${course.id}`}
                    className="font-medium text-foreground hover:text-primary"
                  >
                    {course.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {gradingTypeLabel(course.gradingType)} · {studentCount} alumnos
                  </p>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                  {teachers.map(displayName).join(", ") || "Sin asignar"}
                </td>
                {progress.map((p) => (
                  <td key={String(p.period)} className="px-3 py-3">
                    <div className="w-24">
                      <p className="mb-1.5 text-xs text-slate-600 tabular-nums">
                        <span className="font-medium text-foreground">{p.published}</span>/{p.total}
                      </p>
                      <ProgressBar complete={p.complete} published={p.published} total={p.total} />
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
