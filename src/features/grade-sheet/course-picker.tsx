"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, MessageSquareText } from "lucide-react";
import type { PeriodProgress } from "@/application/progress";
import { EmptyState } from "@/components/feedback/empty-state";
import { SectionHeading } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { gradingTypeLabel, type Course } from "@/domain/course";
import type { ReviewStatus } from "@/domain/period-review";
import type { ReportPeriod } from "@/domain/report-card";
import { displayName, type User } from "@/domain/user";
import { periodLabel, periodParam } from "@/features/report-card/period";
import { ProgressBar, ProgressLegend } from "@/features/report-card/period-progress";
import { cn } from "@/lib/utils";
import { courseFocus } from "./course-focus";

export interface CourseCardData {
  course: Course;
  studentCount: number;
  progress: PeriodProgress[];
  /** Shown for Dirección; the teacher's own courses omit it. */
  teachers?: User[];
  reviews?: { period: ReportPeriod; status: ReviewStatus }[];
  /** Teacher: notes from Dirección not opened yet. */
  unreadNotes?: number;
}

/** "Lunes y miércoles · 14:00 a 15:30": the time range never splits. */
export function Schedule({ value, className }: { value: string; className?: string }) {
  const [days, time] = value.split(" · ");
  return (
    <span className={className}>
      {days}
      {time && (
        <>
          {" · "}
          <span className="whitespace-nowrap tabular-nums">{time}</span>
        </>
      )}
    </span>
  );
}

/** Presentational: one card per course, led by the period in progress. */
export function CoursePicker({
  courses,
  hrefFor,
  title = "Cursos",
  emptyTitle = "Todavía no hay cursos cargados.",
  actionVerb = "Ver notas",
}: {
  courses: CourseCardData[];
  hrefFor: (courseId: string) => string;
  title?: string;
  emptyTitle?: string;
  /** Start of the main button label, e.g. "Cargar notas" → "Cargar notas del 3° Bimestre". */
  actionVerb?: string;
}) {
  if (courses.length === 0) {
    return <EmptyState icon={BookOpen} title={emptyTitle} />;
  }
  return (
    <section>
      <SectionHeading title={title} actions={<ProgressLegend />} />
      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((overview) => (
          <li key={overview.course.id}>
            <CourseCard data={overview} href={hrefFor(overview.course.id)} actionVerb={actionVerb} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function withPeriod(href: string, period: ReportPeriod) {
  return `${href}${href.includes("?") ? "&" : "?"}periodo=${periodParam(period)}`;
}

function CourseCard({
  data,
  href,
  actionVerb,
}: {
  data: CourseCardData;
  href: string;
  actionVerb: string;
}) {
  const { course, teachers, studentCount } = data;
  const focus = courseFocus(data.progress);
  const pendingReview = data.reviews?.find((r) => r.status === "pending");
  const focusReview =
    focus.state === "current" ? data.reviews?.find((r) => r.period === focus.period) : undefined;
  const awaiting = focusReview?.status === "pending";
  const unread = data.unreadNotes ?? 0;
  const students = studentCount === 1 ? "1 alumno" : `${studentCount} alumnos`;

  return (
    <article className="surface-card flex h-full flex-col overflow-hidden">
      <header className="border-b border-border px-5 pt-4 pb-3.5">
        {(pendingReview || focusReview?.status === "returned" || unread > 0) && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {pendingReview && (
              <StatusBadge tone="info" dot>
                Pendiente de aprobación
              </StatusBadge>
            )}
            {focusReview?.status === "returned" && (
              <StatusBadge tone="danger" dot>
                Devuelto
              </StatusBadge>
            )}
            {unread > 0 && (
              <StatusBadge tone="warning">
                <MessageSquareText className="size-3" aria-hidden />
                {unread === 1 ? "1 nota nueva" : `${unread} notas nuevas`}
              </StatusBadge>
            )}
          </div>
        )}
        <h3 className="font-serif text-lg leading-tight font-semibold text-navy">
          <Link
            href={href}
            className="rounded-sm hover:text-primary-strong focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
          >
            {course.name}
          </Link>
        </h3>
        <p className="mt-1 text-[13px] leading-snug text-muted-foreground">
          <Schedule value={course.schedule} /> · {students}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground/90">
          {teachers && <>{teachers.map(displayName).join(", ") || "Sin docente asignado"} · </>}
          <span className="whitespace-nowrap">{gradingTypeLabel(course.gradingType)}</span>
        </p>
      </header>

      <div className="flex flex-1 flex-col gap-3 bg-primary-tint/50 px-5 py-4">
        {focus.state === "current" && (
          <>
            <p className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <span className="font-serif text-base font-semibold text-navy">
                {periodLabel(focus.period)}
                <span className="font-sans text-[13px] font-normal text-muted-foreground"> · en curso</span>
              </span>
              <span className="text-[13px] text-muted-foreground tabular-nums">
                <span className="font-medium text-foreground">{focus.published}/{focus.total}</span> publicados ·{" "}
                <span className="font-medium text-foreground">{focus.complete}/{focus.total}</span> cargados
              </span>
            </p>
            <ProgressBar complete={focus.complete} published={focus.published} total={focus.total} />
            <Link
              href={withPeriod(href, focus.period)}
              className={cn(
                buttonVariants({ variant: awaiting ? "outline" : "default" }),
                "mt-auto w-full justify-center sm:w-auto sm:self-start",
              )}
            >
              {awaiting ? "Ver notas" : actionVerb} del {periodLabel(focus.period)}
              <ArrowRight aria-hidden />
            </Link>
          </>
        )}
        {focus.state === "done" && (
          <>
            <p className="flex items-center gap-2 text-sm font-medium text-success">
              <CheckCircle2 className="size-4" aria-hidden />
              Todo publicado
            </p>
            <Link href={href} className={cn(buttonVariants({ variant: "outline" }), "mt-auto self-start")}>
              Ver notas
              <ArrowRight aria-hidden />
            </Link>
          </>
        )}
        {focus.state === "empty" && (
          <p className="text-sm text-muted-foreground">Este curso todavía no tiene alumnos.</p>
        )}
      </div>
    </article>
  );
}
