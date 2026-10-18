"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { CalendarDays } from "lucide-react";
import type { ExamAgenda, ExamListItem } from "@/application/exams";
import { EmptyState } from "@/components/feedback/empty-state";
import { SectionHeading } from "@/components/layout/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { examTypeLabel, splitAgenda } from "@/domain/exam";
import { bimesterLabel, formatDayShort } from "@/lib/format";
import { cn } from "@/lib/utils";
import { examStatusBadge, formatStatsSummary, relativeDayLabel } from "./exam-model";

const ALL = "all";

/**
 * Presentational: exams of several courses split into "Próximos" (from today,
 * ascending) and "Anteriores" (descending), with a course filter.
 */
export function ExamAgendaView({
  agenda,
  hrefFor,
  renderActions,
  emptyAction,
}: {
  agenda: ExamAgenda;
  hrefFor: (item: ExamListItem) => string;
  /** Row actions (e.g. edit / delete for the teacher). */
  renderActions?: (item: ExamListItem) => ReactNode;
  emptyAction?: ReactNode;
}) {
  const [courseId, setCourseId] = useState(ALL);
  const filtered = agenda.items.filter((i) => courseId === ALL || i.course.id === courseId);
  const { upcoming, past } = splitAgenda(
    filtered.map((item) => ({ ...item, date: item.exam.date })),
    agenda.today,
  );

  return (
    <div className="flex flex-col gap-8">
      {agenda.courses.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="exam-course-filter" className="text-sm text-muted-foreground">
            Curso
          </label>
          <Select value={courseId} onValueChange={setCourseId}>
            <SelectTrigger id="exam-course-filter" className="h-10 w-full sm:w-64">
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

      {filtered.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Todavía no hay exámenes cargados."
          description="Los exámenes aparecerán aquí con su fecha y su estado."
          action={emptyAction}
        />
      ) : (
        <>
          <section aria-label="Próximos exámenes">
            <SectionHeading
              title="Próximos"
              description={
                upcoming.length === 0 ? "No hay exámenes programados desde hoy." : undefined
              }
            />
            <ExamList items={upcoming} today={agenda.today} hrefFor={hrefFor} renderActions={renderActions} />
          </section>
          <section aria-label="Exámenes anteriores">
            <SectionHeading
              title="Anteriores"
              description={past.length === 0 ? "Todavía no se tomaron exámenes." : undefined}
            />
            <ExamList items={past} today={agenda.today} hrefFor={hrefFor} renderActions={renderActions} />
          </section>
        </>
      )}
    </div>
  );
}

function ExamList({
  items,
  today,
  hrefFor,
  renderActions,
}: {
  items: ExamListItem[];
  today: string;
  hrefFor: (item: ExamListItem) => string;
  renderActions?: (item: ExamListItem) => ReactNode;
}) {
  if (items.length === 0) return null;
  return (
    <ul className="surface-card divide-y divide-border overflow-hidden">
      {items.map((item) => (
        <li key={item.exam.id}>
          <ExamRow item={item} today={today} href={hrefFor(item)} actions={renderActions?.(item)} />
        </li>
      ))}
    </ul>
  );
}

function ExamRow({
  item,
  today,
  href,
  actions,
}: {
  item: ExamListItem;
  today: string;
  href: string;
  actions?: ReactNode;
}) {
  const { exam, course, status, stats } = item;
  const badge = examStatusBadge(status);
  const relative = relativeDayLabel(exam.date, today);
  return (
    <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
      <div className="flex w-24 shrink-0 flex-row items-baseline gap-2 sm:flex-col sm:gap-0.5">
        <span className="font-serif text-base font-semibold text-navy tabular-nums">
          {formatDayShort(exam.date)}
        </span>
        {relative && (
          <span className={cn("text-xs", relative === "Hoy" ? "font-semibold text-primary-strong" : "text-muted-foreground")}>
            {relative}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <Link
          href={href}
          className="rounded-sm text-[15px] font-semibold break-words text-foreground hover:text-primary-strong focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
        >
          {exam.topic}
        </Link>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted-foreground">
          <span>{course.name}</span>
          <span aria-hidden>·</span>
          <StatusBadge>{examTypeLabel(exam.type)}</StatusBadge>
          <span aria-hidden>·</span>
          <span>{bimesterLabel(exam.bimester)}</span>
          {status !== "upcoming" && (
            <>
              <span aria-hidden>·</span>
              <span>{formatStatsSummary(stats).join(" · ")}</span>
            </>
          )}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <StatusBadge tone={badge.tone} dot>
          {badge.label}
        </StatusBadge>
        {actions}
      </div>
    </div>
  );
}
