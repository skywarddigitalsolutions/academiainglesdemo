"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import type { ExamListItem } from "@/application/exams";
import { EmptyState } from "@/components/feedback/empty-state";
import { SectionHeading } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Course } from "@/domain/course";
import type { ExamStatus } from "@/domain/exam";
import { formatDay, formatDayShort } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  initialMonth,
  itemsByDay,
  itemsInMonth,
  monthGrid,
  monthTitle,
  shiftMonth,
} from "./calendar-model";
import { courseColors } from "./course-colors";

const WEEKDAY_HEADERS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MAX_CHIPS = 3;

const STATUS_VISUAL: Record<ExamStatus, { label: string; icon: typeof Clock; className: string }> = {
  upcoming: { label: "Próximo", icon: Clock, className: "text-primary-strong" },
  "pending-grades": { label: "Para calificar", icon: AlertCircle, className: "text-warning" },
  published: { label: "Publicado", icon: CheckCircle2, className: "text-success" },
};

function StatusIcon({ status, className }: { status: ExamStatus; className?: string }) {
  const { icon: Icon, className: tone } = STATUS_VISUAL[status];
  return <Icon className={cn("size-4 shrink-0", tone, className)} aria-hidden />;
}

function examCount(n: number): string {
  return n === 1 ? "1 examen este mes" : `${n} exámenes este mes`;
}

function chipLabel(item: ExamListItem): string {
  return `${item.course.name}, ${item.exam.topic}, ${STATUS_VISUAL[item.status].label}, ${formatDay(item.exam.date)}`;
}

/**
 * Presentational: month view of exams, colored by course. A grid from md up,
 * a list of days with exams on phones.
 */
export function ExamCalendar({
  items,
  courses,
  today,
  hrefFor,
  title = "Calendario de exámenes",
  description,
}: {
  items: ExamListItem[];
  courses: Course[];
  today: string;
  hrefFor: (item: ExamListItem) => string;
  title?: string;
  description?: string;
}) {
  const [month, setMonth] = useState(() => initialMonth(items, today));
  const colorOf = courseColors(courses);
  const inMonth = itemsInMonth(items, month);
  const byDay = itemsByDay(inMonth);
  const weeks = monthGrid(month, today);
  const daysWithExams = [...byDay.keys()].sort();

  return (
    <section className="min-w-0" aria-label={title}>
      <SectionHeading title={title} description={description} />
      <div className="surface-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-serif text-xl font-semibold text-navy">{monthTitle(month)}</h3>
            <p className="text-[15px] text-muted-foreground" aria-live="polite">
              {examCount(inMonth.length)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="h-11 px-4 text-[15px]"
              onClick={() => setMonth(shiftMonth(month, -1))}
            >
              <ChevronLeft aria-hidden />
              Mes anterior
            </Button>
            <Button
              variant="outline"
              className="h-11 px-4 text-[15px]"
              onClick={() => setMonth(initialMonth(items, today))}
            >
              Hoy
            </Button>
            <Button
              variant="outline"
              className="h-11 px-4 text-[15px]"
              onClick={() => setMonth(shiftMonth(month, 1))}
            >
              Mes siguiente
              <ChevronRight aria-hidden />
            </Button>
          </div>
        </div>

        {/* md+: month grid */}
        <div
          role="grid"
          aria-label={`Calendario de ${monthTitle(month)}`}
          className="mt-4 hidden overflow-hidden rounded-lg border border-border md:block"
        >
          <div role="row" className="grid grid-cols-7 bg-primary-tint">
            {WEEKDAY_HEADERS.map((name) => (
              <div
                key={name}
                role="columnheader"
                className="px-2 py-2 text-center text-[13px] font-semibold tracking-wide text-navy/80 uppercase"
              >
                {name}
              </div>
            ))}
          </div>
          {weeks.map((week) => (
            <div key={week[0].iso} role="row" className="grid grid-cols-7 border-t border-border">
              {week.map((day) => {
                const dayItems = byDay.get(day.iso) ?? [];
                const shown = dayItems.slice(0, MAX_CHIPS);
                const hidden = dayItems.slice(MAX_CHIPS);
                return (
                  <div
                    key={day.iso}
                    role="gridcell"
                    aria-label={formatDay(day.iso)}
                    className={cn(
                      "flex min-h-[110px] min-w-0 flex-col gap-1 border-l border-border p-1.5 first:border-l-0",
                      day.isWeekend && "bg-muted/50",
                      !day.inMonth && "bg-muted/30 opacity-50",
                      day.isToday && "relative z-10 bg-primary-tint ring-2 ring-primary ring-inset",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "text-[15px] font-semibold tabular-nums",
                          day.isWeekend ? "text-muted-foreground" : "text-foreground",
                        )}
                      >
                        {day.day}
                      </span>
                      {day.isToday && (
                        <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                          Hoy
                        </span>
                      )}
                    </div>
                    {shown.map((item) => (
                      <Link
                        key={item.exam.id}
                        href={hrefFor(item)}
                        title={`${item.course.name}: ${item.exam.topic}`}
                        aria-label={chipLabel(item)}
                        className={cn(
                          "flex min-h-7 items-center gap-1 rounded-md border-l-4 py-1 pr-1.5 pl-1.5 text-[13px] leading-tight font-medium focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none",
                          colorOf(item.course.id).chip,
                        )}
                      >
                        <StatusIcon status={item.status} className="size-3.5" />
                        <span className="truncate">{item.exam.topic}</span>
                      </Link>
                    ))}
                    {hidden.length > 0 && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="min-h-7 rounded-md px-1.5 text-left text-[13px] font-semibold text-primary-strong underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
                          >
                            +{hidden.length} más
                          </button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="flex flex-col gap-2">
                          <p className="text-[15px] font-semibold text-navy">
                            {formatDayShort(day.iso)}
                          </p>
                          {dayItems.map((item) => (
                            <ExamRow
                              key={item.exam.id}
                              item={item}
                              href={hrefFor(item)}
                              colorClass={colorOf(item.course.id).solid}
                            />
                          ))}
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        {inMonth.length === 0 && (
          <p className="mt-4 hidden text-[15px] text-muted-foreground md:block">
            No hay exámenes en este mes.
          </p>
        )}

        {/* Phones: only the days with exams */}
        <div className="mt-4 md:hidden">
          {daysWithExams.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No hay exámenes en este mes"
              description="Use los botones para ver otros meses."
            />
          ) : (
            <ul className="flex flex-col gap-4">
              {daysWithExams.map((iso) => (
                <li key={iso}>
                  <h4 className="mb-2 text-[15px] font-semibold text-navy">{formatDayShort(iso)}</h4>
                  <ul className="flex flex-col gap-2">
                    {(byDay.get(iso) ?? []).map((item) => (
                      <li key={item.exam.id}>
                        <ExamRow
                          item={item}
                          href={hrefFor(item)}
                          colorClass={colorOf(item.course.id).solid}
                        />
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Legend courses={courses} colorOf={colorOf} />
      </div>
    </section>
  );
}

function ExamRow({
  item,
  href,
  colorClass,
}: {
  item: ExamListItem;
  href: string;
  colorClass: string;
}) {
  return (
    <Link
      href={href}
      aria-label={chipLabel(item)}
      className="flex min-h-12 items-stretch overflow-hidden rounded-lg border border-border bg-card text-[15px] hover:bg-primary-tint focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
    >
      <span className={cn("w-1.5 shrink-0", colorClass)} aria-hidden />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 px-3 py-2">
        <span className="font-semibold break-words text-foreground">{item.exam.topic}</span>
        <span className="text-muted-foreground">{item.course.name}</span>
        <span className="flex items-center gap-1.5 text-foreground">
          <StatusIcon status={item.status} />
          {STATUS_VISUAL[item.status].label}
        </span>
      </span>
    </Link>
  );
}

function Legend({
  courses,
  colorOf,
}: {
  courses: Course[];
  colorOf: (courseId: string) => { solid: string };
}) {
  return (
    <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4 text-[15px]">
      {courses.length > 0 && (
        <ul className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Colores por curso">
          {courses.map((c) => (
            <li key={c.id} className="flex items-center gap-2">
              <span className={cn("size-3.5 rounded-sm", colorOf(c.id).solid)} aria-hidden />
              {c.name}
            </li>
          ))}
        </ul>
      )}
      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-muted-foreground" aria-label="Estados">
        {(Object.keys(STATUS_VISUAL) as ExamStatus[]).map((status) => (
          <li key={status} className="flex items-center gap-1.5">
            <StatusIcon status={status} />
            {STATUS_VISUAL[status]?.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
