"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Clock,
  FileText,
} from "lucide-react";
import type { ExamAgenda, ExamListItem } from "@/application/exams";
import { EmptyState } from "@/components/feedback/empty-state";
import { SectionHeading } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StatusTone } from "@/components/ui/status-badge";
import { examTypeLabel } from "@/domain/exam";
import { bimesterLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { courseColors } from "./course-colors";
import { ExamCalendar } from "./exam-calendar";
import {
  agendaSummary,
  dateBlockParts,
  defaultCtaLabel,
  examStatusInfo,
  groupAgenda,
} from "./exam-model";

const ALL = "all";
const PUBLISHED_PREVIEW = 6;

const TONE_ICON: Record<StatusTone, typeof Clock> = {
  info: Clock,
  warning: AlertCircle,
  success: CheckCircle2,
  danger: AlertCircle,
  neutral: Clock,
};
const TONE_CLASS: Record<StatusTone, string> = {
  info: "text-primary-strong",
  warning: "text-warning",
  success: "text-success",
  danger: "text-destructive",
  neutral: "text-foreground",
};

function examCountLabel(n: number): string {
  return n === 1 ? "1 examen" : `${n} exámenes`;
}

/**
 * Presentational: exams of several courses as cards grouped by what needs
 * attention ("Para calificar", "Próximos", "Publicados"), with a course filter.
 */
export function ExamAgendaView({
  agenda,
  hrefFor,
  renderActions,
  emptyAction,
  calendar,
  ctaLabel = (item) => defaultCtaLabel(item.status),
}: {
  agenda: ExamAgenda;
  hrefFor: (item: ExamListItem) => string;
  /** Extra card actions (e.g. edit / delete for the teacher), shown in the footer. */
  renderActions?: (item: ExamListItem) => ReactNode;
  emptyAction?: ReactNode;
  /** Shows a month calendar of the filtered exams above the list. */
  calendar?: { title?: string; description?: string };
  /** Verb on each card's main button. */
  ctaLabel?: (item: ExamListItem) => string;
}) {
  const [courseId, setCourseId] = useState(ALL);
  const [showAllPublished, setShowAllPublished] = useState(false);
  const filtered = agenda.items.filter((i) => courseId === ALL || i.course.id === courseId);
  const groups = groupAgenda(filtered);
  const summary = agendaSummary(groups);
  const colorOf = courseColors(agenda.courses);
  const shownPublished = showAllPublished
    ? groups.published
    : groups.published.slice(0, PUBLISHED_PREVIEW);

  const list = (items: ExamListItem[]) => (
    <ExamCardList
      items={items}
      today={agenda.today}
      hrefFor={hrefFor}
      renderActions={renderActions}
      ctaLabel={ctaLabel}
      colorOf={colorOf}
    />
  );

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        {agenda.courses.length > 1 && (
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="exam-course-filter" className="text-[15px] font-medium text-foreground">
              Ver exámenes de
            </label>
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger
                id="exam-course-filter"
                className="h-11 w-full text-[15px] sm:w-auto sm:min-w-[260px]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos los cursos</SelectItem>
                {agenda.courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {summary.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Resumen de exámenes">
            {summary.map((text) => (
              <li
                key={text}
                className="rounded-full border border-border bg-card px-3.5 py-1.5 text-[15px] font-medium text-foreground"
              >
                {text}
              </li>
            ))}
          </ul>
        )}
      </div>

      {calendar && (
        <ExamCalendar
          title={calendar.title}
          description={calendar.description}
          items={filtered}
          courses={agenda.courses}
          today={agenda.today}
          hrefFor={hrefFor}
        />
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Todavía no hay exámenes cargados."
          description="Los exámenes aparecerán aquí con su fecha y su estado."
          action={emptyAction}
        />
      ) : (
        <>
          {groups.pending.length > 0 && (
            <section aria-label="Exámenes para calificar">
              <SectionHeading
                title="Para calificar"
                description="Exámenes ya tomados que todavía no tienen todas las notas publicadas."
                actions={<CountText>{examCountLabel(groups.pending.length)}</CountText>}
              />
              {list(groups.pending)}
            </section>
          )}
          {groups.upcoming.length > 0 && (
            <section aria-label="Próximos exámenes">
              <SectionHeading
                title="Próximos"
                description="Exámenes agendados para los próximos días."
                actions={<CountText>{examCountLabel(groups.upcoming.length)}</CountText>}
              />
              {list(groups.upcoming)}
            </section>
          )}
          {groups.published.length > 0 && (
            <section aria-label="Exámenes publicados">
              <SectionHeading
                title="Publicados"
                description="Notas ya visibles para las familias."
                actions={<CountText>{examCountLabel(groups.published.length)}</CountText>}
              />
              {list(shownPublished)}
              {groups.published.length > PUBLISHED_PREVIEW && !showAllPublished && (
                <Button
                  variant="outline"
                  className="mt-4 h-11 px-5 text-[15px]"
                  onClick={() => setShowAllPublished(true)}
                >
                  Ver todos los publicados ({groups.published.length})
                </Button>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}

function CountText({ children }: { children: ReactNode }) {
  return <span className="text-[15px] text-muted-foreground">{children}</span>;
}

function ExamCardList({
  items,
  today,
  hrefFor,
  renderActions,
  ctaLabel,
  colorOf,
}: {
  items: ExamListItem[];
  today: string;
  hrefFor: (item: ExamListItem) => string;
  renderActions?: (item: ExamListItem) => ReactNode;
  ctaLabel: (item: ExamListItem) => string;
  colorOf: (courseId: string) => { solid: string };
}) {
  return (
    <ul className="grid gap-4 lg:grid-cols-2">
      {items.map((item) => (
        <li key={item.exam.id} className="min-w-0">
          <ExamCard
            item={item}
            today={today}
            href={hrefFor(item)}
            cta={ctaLabel(item)}
            colorClass={colorOf(item.course.id).solid}
            actions={renderActions?.(item)}
          />
        </li>
      ))}
    </ul>
  );
}

function ExamCard({
  item,
  today,
  href,
  cta,
  colorClass,
  actions,
}: {
  item: ExamListItem;
  today: string;
  href: string;
  cta: string;
  colorClass: string;
  actions?: ReactNode;
}) {
  const { exam, course, status, stats } = item;
  const info = examStatusInfo(status, exam.date, stats, today);
  const date = dateBlockParts(exam.date);
  const ToneIcon = TONE_ICON[info.tone];

  return (
    <article
      className={cn(
        "surface-card flex h-full flex-col gap-4 p-4 sm:p-5",
        status === "pending-grades" && "border-warning-border",
      )}
    >
      <div className="flex gap-4">
        <div
          className="w-[72px] shrink-0 self-start overflow-hidden rounded-lg border border-border bg-card text-center"
          aria-hidden
        >
          <div className={cn("h-2", colorClass)} />
          <div className="px-1 pt-1.5 text-xs font-semibold tracking-wide text-muted-foreground">
            {date.weekday}
          </div>
          <div className="font-serif text-3xl leading-none font-semibold text-navy tabular-nums">
            {date.day}
          </div>
          <div className="pt-0.5 pb-1.5 text-sm font-medium text-muted-foreground uppercase">
            {date.month}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg leading-snug font-semibold break-words">
            <Link
              href={href}
              className="rounded-sm text-foreground hover:text-primary-strong hover:underline focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
            >
              {exam.topic}
            </Link>
          </h3>
          <ul className="mt-2 flex flex-col gap-1.5 text-[15px] text-muted-foreground">
            <MetaLine icon={BookOpen}>{course.name}</MetaLine>
            <MetaLine icon={FileText}>{examTypeLabel(exam.type)}</MetaLine>
            <MetaLine icon={CalendarRange}>{bimesterLabel(exam.bimester)}</MetaLine>
          </ul>
        </div>
      </div>

      <div className="rounded-lg bg-muted/50 px-3.5 py-3">
        <p className={cn("flex items-start gap-2 text-base font-semibold", TONE_CLASS[info.tone])}>
          <ToneIcon className="mt-0.5 size-5 shrink-0" aria-hidden />
          <span>{info.headline}</span>
        </p>
        {info.detail && <p className="mt-1 pl-7 text-[15px] text-foreground">{info.detail}</p>}
        {info.progress && info.progress.total > 0 && (
          <div className="mt-2 pl-7">
            <div
              role="progressbar"
              aria-label="Alumnos calificados"
              aria-valuemin={0}
              aria-valuemax={info.progress.total}
              aria-valuenow={info.progress.graded}
              className="h-2.5 overflow-hidden rounded-full bg-muted"
            >
              <div
                className="h-full rounded-full bg-warning"
                style={{ width: `${(info.progress.graded / info.progress.total) * 100}%` }}
              />
            </div>
            <p className="mt-1 text-sm text-muted-foreground tabular-nums">
              {info.progress.graded} de {info.progress.total} calificados
            </p>
          </div>
        )}
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
        <Button
          asChild
          variant={status === "pending-grades" ? "default" : "outline"}
          className="h-11 px-5 text-[15px]"
        >
          <Link href={href}>{cta}</Link>
        </Button>
        {actions && <div className="flex items-center gap-1">{actions}</div>}
      </div>
    </article>
  );
}

function MetaLine({ icon: Icon, children }: { icon: typeof BookOpen; children: ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <Icon className="size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </li>
  );
}
