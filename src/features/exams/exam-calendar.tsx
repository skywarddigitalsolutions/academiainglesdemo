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
  Trash2,
  UserPlus,
  UserX,
} from "lucide-react";
import { EmptyState } from "@/components/feedback/empty-state";
import { SectionHeading } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Course } from "@/domain/course";
import type { ExamStatus } from "@/domain/exam";
import { formatDay, formatDayShort } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  absenceRangeText,
  absencesByDay,
  absencesInMonth,
  initialMonth,
  itemsByDay,
  itemsInMonth,
  monthGrid,
  monthOf,
  monthTitle,
  shiftMonth,
  type AbsenceItem,
  type CalendarExam,
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

function monthSummary(exams: number, absences: number | null): string {
  const examText = exams === 1 ? "1 examen" : `${exams} exámenes`;
  if (absences === null) return `${examText} este mes`;
  const absenceText = absences === 1 ? "1 ausencia docente" : `${absences} ausencias docentes`;
  return `${examText} y ${absenceText} este mes`;
}

type StatusLabels = Partial<Record<ExamStatus, string>>;

function statusText(status: ExamStatus, labels?: StatusLabels): string {
  return labels?.[status] ?? STATUS_VISUAL[status].label;
}

function chipLabel(item: CalendarExam, labels?: StatusLabels): string {
  return `${item.course.name}, ${item.exam.topic}, ${statusText(item.status, labels)}, ${formatDay(item.exam.date)}`;
}

function absenceLabel(item: AbsenceItem): string {
  return `Ausente: ${item.teacherName}`;
}

/** What a day cell lists: teacher absences first, then exams. */
type Entry<T extends CalendarExam> =
  | { kind: "absence"; key: string; item: AbsenceItem }
  | { kind: "exam"; key: string; item: T };

/**
 * Presentational: month view of exams, colored by course, and (for Dirección)
 * teacher absences. A grid from md up, a list of days with something on them
 * on phones.
 */
export function ExamCalendar<T extends CalendarExam>({
  items,
  courses,
  today,
  hrefFor,
  title = "Calendario de exámenes",
  description,
  absences,
  onRegisterAbsence,
  onDeleteAbsence,
  statusLabels,
}: {
  items: T[];
  courses: Course[];
  today: string;
  hrefFor: (item: T) => string;
  /** Other wording for a status (families read "Nota publicada", not "Publicado"). */
  statusLabels?: StatusLabels;
  title?: string;
  description?: string;
  /** Teacher absences shown next to the exams (Dirección's Tablero only). */
  absences?: AbsenceItem[];
  onRegisterAbsence?: () => void;
  /** Asks to remove an absence; the caller confirms. */
  onDeleteAbsence?: (item: AbsenceItem) => void;
}) {
  const [month, setMonth] = useState(() => initialMonth(items, today));
  const colorOf = courseColors(courses);
  const inMonth = itemsInMonth(items, month);
  const byDay = itemsByDay(inMonth);
  const absencesMonth = absences ? absencesInMonth(absences, month) : [];
  const absenceByDay = absencesByDay(absences ?? []);
  const weeks = monthGrid(month, today);
  const entriesOf = (iso: string): Entry<T>[] => [
    ...(absenceByDay.get(iso) ?? []).map(
      (item): Entry<T> => ({ kind: "absence", key: `abs-${item.absence.id}`, item }),
    ),
    ...(byDay.get(iso) ?? []).map(
      (item): Entry<T> => ({ kind: "exam", key: `ex-${item.exam.id}`, item }),
    ),
  ];
  const daysWithEntries = [
    ...new Set([...byDay.keys(), ...[...absenceByDay.keys()].filter((d) => monthOf(d) === month)]),
  ].sort();
  const renderRow = (entry: Entry<T>) =>
    entry.kind === "absence" ? (
      <AbsenceRow item={entry.item} onDelete={onDeleteAbsence} />
    ) : (
      <ExamRow
        item={entry.item}
        labels={statusLabels}
        href={hrefFor(entry.item)}
        colorClass={colorOf(entry.item.course.id).solid}
      />
    );

  return (
    <section className="min-w-0" aria-label={title}>
      <SectionHeading
        title={title}
        description={description}
        actions={
          onRegisterAbsence && (
            <Button variant="outline" className="h-11 px-4 text-[15px]" onClick={onRegisterAbsence}>
              <UserPlus aria-hidden />
              Registrar ausencia docente
            </Button>
          )
        }
      />
      <div className="surface-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-serif text-xl font-semibold text-navy">{monthTitle(month)}</h3>
            <p className="text-[15px] text-muted-foreground" aria-live="polite">
              {monthSummary(inMonth.length, absences ? absencesMonth.length : null)}
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
                const entries = entriesOf(day.iso);
                const shown = entries.slice(0, MAX_CHIPS);
                const hidden = entries.slice(MAX_CHIPS);
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
                    {shown.map((entry) =>
                      entry.kind === "absence" ? (
                        <AbsenceChip key={entry.key} item={entry.item} onDelete={onDeleteAbsence} />
                      ) : (
                        <Link
                          key={entry.key}
                          href={hrefFor(entry.item)}
                          title={`${entry.item.course.name}: ${entry.item.exam.topic}`}
                          aria-label={chipLabel(entry.item, statusLabels)}
                          className={cn(
                            "flex min-h-7 items-center gap-1 rounded-md border-l-4 py-1 pr-1.5 pl-1.5 text-[13px] leading-tight font-medium focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none",
                            colorOf(entry.item.course.id).chip,
                          )}
                        >
                          <StatusIcon status={entry.item.status} className="size-3.5" />
                          <span className="truncate">{entry.item.exam.topic}</span>
                        </Link>
                      ),
                    )}
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
                          {entries.map((entry) => (
                            <div key={entry.key}>{renderRow(entry)}</div>
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
        {inMonth.length === 0 && absencesMonth.length === 0 && (
          <p className="mt-4 hidden text-[15px] text-muted-foreground md:block">
            {absences ? "No hay exámenes ni ausencias en este mes." : "No hay exámenes en este mes."}
          </p>
        )}

        {/* Phones: only the days with something on them */}
        <div className="mt-4 md:hidden">
          {daysWithEntries.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title={
                absences ? "No hay exámenes ni ausencias en este mes" : "No hay exámenes en este mes"
              }
              description="Use los botones para ver otros meses."
            />
          ) : (
            <ul className="flex flex-col gap-4">
              {daysWithEntries.map((iso) => (
                <li key={iso}>
                  <h4 className="mb-2 text-[15px] font-semibold text-navy">{formatDayShort(iso)}</h4>
                  <ul className="flex flex-col gap-2">
                    {entriesOf(iso).map((entry) => (
                      <li key={entry.key}>{renderRow(entry)}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Legend
          courses={courses}
          colorOf={colorOf}
          showAbsences={absences !== undefined}
          labels={statusLabels}
        />
      </div>
    </section>
  );
}

function ExamRow({
  item,
  href,
  colorClass,
  labels,
}: {
  item: CalendarExam;
  href: string;
  colorClass: string;
  labels?: StatusLabels;
}) {
  return (
    <Link
      href={href}
      aria-label={chipLabel(item, labels)}
      className="flex min-h-12 items-stretch overflow-hidden rounded-lg border border-border bg-card text-[15px] hover:bg-primary-tint focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
    >
      <span className={cn("w-1.5 shrink-0", colorClass)} aria-hidden />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 px-3 py-2">
        <span className="font-semibold break-words text-foreground">{item.exam.topic}</span>
        <span className="text-muted-foreground">{item.course.name}</span>
        <span className="flex items-center gap-1.5 text-foreground">
          <StatusIcon status={item.status} />
          {statusText(item.status, labels)}
        </span>
      </span>
    </Link>
  );
}

/** Chip of a day cell: dashed grey with a person icon, never confused with an exam. */
function AbsenceChip({
  item,
  onDelete,
}: {
  item: AbsenceItem;
  onDelete?: (item: AbsenceItem) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          title={`${absenceLabel(item)}. ${item.absence.reason}`}
          aria-label={`${absenceLabel(item)}, ${absenceRangeText(item.absence.from, item.absence.to)}. Ver detalle`}
          className="flex min-h-7 w-full items-center gap-1 rounded-md border border-dashed border-slate-400 bg-slate-100 py-1 pr-1.5 pl-1.5 text-left text-[13px] leading-tight font-medium text-slate-900 hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
        >
          <UserX className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">{absenceLabel(item)}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start">
        <AbsenceRow item={item} onDelete={onDelete} />
      </PopoverContent>
    </Popover>
  );
}

/** Full details of an absence: teacher, dates, reason and the remove action when allowed. */
function AbsenceRow({
  item,
  onDelete,
}: {
  item: AbsenceItem;
  onDelete?: (item: AbsenceItem) => void;
}) {
  const { absence, teacherName } = item;
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-dashed border-slate-400 bg-slate-100 px-3 py-2 text-[15px] text-slate-900">
      <p className="flex items-center gap-1.5 font-semibold">
        <UserX className="size-4 shrink-0" aria-hidden />
        {absenceLabel(item)}
      </p>
      <dl className="flex flex-col gap-0.5">
        <div>
          <dt className="inline font-medium">Docente: </dt>
          <dd className="inline">{teacherName}</dd>
        </div>
        <div>
          <dt className="inline font-medium">Fechas: </dt>
          <dd className="inline">{absenceRangeText(absence.from, absence.to)}</dd>
        </div>
        <div>
          <dt className="inline font-medium">Motivo: </dt>
          <dd className="inline break-words">{absence.reason}</dd>
        </div>
      </dl>
      {onDelete && (
        <Button
          type="button"
          variant="outline"
          className="h-10 self-start bg-card px-3 text-[15px]"
          onClick={() => onDelete(item)}
        >
          <Trash2 aria-hidden />
          Eliminar
        </Button>
      )}
    </div>
  );
}

function Legend({
  courses,
  colorOf,
  showAbsences,
  labels,
}: {
  courses: Course[];
  colorOf: (courseId: string) => { solid: string };
  showAbsences: boolean;
  labels?: StatusLabels;
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
            {statusText(status, labels)}
          </li>
        ))}
        {showAbsences && (
          <li className="flex items-center gap-1.5">
            <UserX className="size-4 shrink-0" aria-hidden />
            Ausencia docente
          </li>
        )}
      </ul>
    </div>
  );
}
