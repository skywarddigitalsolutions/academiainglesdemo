"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import type { CourseOverview } from "@/application/admin-use-cases";
import type { PeriodProgress } from "@/application/progress";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageBand, SectionHeading } from "@/components/layout/page-header";
import { gradingTypeLabel } from "@/domain/course";
import { displayName } from "@/domain/user";
import { periodShortLabel } from "@/features/report-card/period";
import {
  PeriodProgressList,
  ProgressBar,
  ProgressLegend,
} from "@/features/report-card/period-progress";
import { cn } from "@/lib/utils";
import { DashboardSections } from "./dashboard/dashboard-sections";
import { formatLongDay } from "./dashboard/dashboard-model";
import { useAsyncData } from "@/providers/use-async-data";
import { pendingItems, type PendingItem } from "./pending";

/** Container: Dirección's Tablero. Academic metrics first, period management after. */
export function AdminOverview() {
  const overview = useAsyncData("admin-overview", (s) => s.admin.getOverview());
  const dashboard = useAsyncData("admin-dashboard", (s) => s.admin.getDashboard());
  const exams = useAsyncData("admin-exams", (s) => s.admin.listExams());
  const data = overview.data;
  const metrics = dashboard.data;

  return (
    <>
      <PageBand
        eyebrow="Dirección"
        title="Tablero"
        description={
          metrics
            ? `Resumen académico del ciclo ${metrics.year} al ${formatLongDay(metrics.today)}.`
            : "Resumen académico del ciclo lectivo."
        }
        stats={
          data
            ? [
                { label: "Alumnos", value: data.totals.students, href: "/admin/students" },
                { label: "Familias", value: data.totals.parents, href: "/admin/parents" },
                { label: "Docentes", value: data.totals.teachers, href: "/admin/teachers" },
                { label: "Cursos", value: data.totals.courses, href: "/admin/courses" },
              ]
            : undefined
        }
      />
      <div className="flex flex-col gap-10">
        {dashboard.loading && <LoadingState variant="cards" />}
        {dashboard.error && <ErrorState message={dashboard.error} />}
        {metrics && (
          <DashboardSections
            metrics={metrics}
            exams={{ agenda: exams.data, loading: exams.loading, error: exams.error }}
          />
        )}

        {overview.loading && !dashboard.loading && <LoadingState variant="cards" />}
        {overview.error && <ErrorState message={overview.error} />}
        {data && (
          <div className="flex flex-col gap-10">
            <SectionHeading
              title="Gestión del período"
              description="Pendientes, publicación de boletines y lectura de las familias."
            />
            <PendingCard items={pendingItems(data.courses, data.progress)} />
            <div className="grid items-start gap-6 lg:grid-cols-2">
              <section className="flex min-w-0 flex-col">
                <SectionHeading title="Publicación por período" />
                <div className="surface-card px-5 py-4">
                  <PeriodProgressList progress={data.progress} />
                  <ProgressLegend className="mt-3 border-t border-slate-100 pt-3" />
                </div>
              </section>
              <ReadingCard progress={data.progress} />
            </div>

            <CourseTable courses={data.courses} />
          </div>
        )}
      </div>
    </>
  );
}

/** Published bimesters already read by families: one compact row per bimester. */
function ReadingCard({ progress }: { progress: PeriodProgress[] }) {
  const bimesters = progress.filter((p) => p.period !== "closing");
  return (
    <section className="flex min-w-0 flex-col">
      <SectionHeading title="Lectura de las familias" />
      <ul className="surface-card flex flex-col gap-3 px-5 py-4">
        {bimesters.map((p) => {
          const pct = p.published === 0 ? null : Math.round((p.read / p.published) * 100);
          return (
            <li
              key={String(p.period)}
              className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-3 text-[13px]"
            >
              <span className="font-medium text-slate-600">{periodShortLabel(p.period)}</span>
              <span className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                <span
                  className="block h-full rounded-full bg-success"
                  style={{ width: `${pct ?? 0}%` }}
                />
              </span>
              <span className="text-right text-muted-foreground tabular-nums">
                {pct === null ? (
                  "Sin publicar"
                ) : (
                  <>
                    <span className="font-semibold text-foreground">{pct}%</span> · {p.read} de{" "}
                    {p.published}
                  </>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Dirección's to-do list, derived from the overview. */
function PendingCard({ items }: { items: PendingItem[] }) {
  return (
    <section className="min-w-0">
      <SectionHeading title="Pendientes" />
      {items.length === 0 ? (
        <p className="surface-card flex items-center gap-2 px-5 py-4 text-sm text-success">
          <CheckCircle2 className="size-4" aria-hidden />
          No hay pendientes.
        </p>
      ) : (
        <ul className="surface-card divide-y divide-border overflow-hidden">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="group flex min-h-12 items-center justify-between gap-3 px-5 py-3 text-sm text-foreground transition-colors hover:bg-primary-tint focus-visible:bg-primary-tint focus-visible:outline-none"
              >
                <span className="flex min-w-0 items-start gap-2.5">
                  <span
                    aria-hidden
                    className={cn(
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      item.id.startsWith("approval")
                        ? "bg-navy ring-2 ring-primary/30"
                        : item.id.startsWith("unread")
                          ? "bg-success"
                          : item.id.startsWith("drafts")
                            ? "bg-primary"
                            : "bg-warning",
                    )}
                  />
                  {item.text}
                </span>
                <ArrowRight
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function teacherText(teachers: CourseOverview["teachers"]) {
  return teachers.map(displayName).join(", ") || "Sin asignar";
}

function CourseTable({ courses }: { courses: CourseOverview[] }) {
  return (
    <section className="min-w-0">
      <SectionHeading title="Cursos" description="Alumnos con notas publicadas en cada período." />

      {/* Phones: one card per course. */}
      <ul className="flex flex-col gap-3 md:hidden">
        {courses.map(({ course, teachers, studentCount, progress }) => (
          <li key={course.id} className="surface-card overflow-hidden">
            <Link
              href={`/admin/grades/${course.id}`}
              className="block border-b border-border bg-primary-tint px-4 py-3 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none focus-visible:ring-inset"
            >
              <span className="font-serif text-base font-semibold text-navy">{course.name}</span>
              <span className="block text-xs text-muted-foreground">
                {studentCount} alumnos · {teacherText(teachers)} ·{" "}
                <span className="whitespace-nowrap">{gradingTypeLabel(course.gradingType)}</span>
              </span>
            </Link>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 px-4 py-3">
              {progress.map((p) => (
                <div key={String(p.period)}>
                  <dt className="flex items-baseline justify-between text-xs text-muted-foreground">
                    {periodShortLabel(p.period)}
                    <span className="tabular-nums">
                      <span className="font-medium text-foreground">{p.published}</span>/{p.total}
                    </span>
                  </dt>
                  <dd className="mt-1.5">
                    <ProgressBar complete={p.complete} published={p.published} total={p.total} />
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>

      {/* From md: the full table. */}
      <div className="surface-card relative hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead className="bg-primary-tint">
            <tr className="border-b border-slate-200">
              <th className="h-9 px-4 text-left text-[11px] font-semibold tracking-[0.05em] text-navy/75 uppercase">
                Curso
              </th>
              <th className="h-9 px-4 text-left text-[11px] font-semibold tracking-[0.05em] text-navy/75 uppercase">
                Docente
              </th>
              {courses[0]?.progress.map((p) => (
                <th
                  key={String(p.period)}
                  className="h-9 px-3 text-left text-[11px] font-semibold tracking-[0.05em] text-navy/75 uppercase"
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
                    href={`/admin/grades/${course.id}`}
                    className="font-medium text-foreground hover:text-primary"
                  >
                    {course.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {gradingTypeLabel(course.gradingType)} · {studentCount} alumnos
                  </p>
                </td>
                <td className="px-4 py-3 text-slate-700">{teacherText(teachers)}</td>
                {progress.map((p) => (
                  <td key={String(p.period)} className="px-3 py-3">
                    <div className="w-20 lg:w-24">
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
