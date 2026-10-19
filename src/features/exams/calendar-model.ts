import type { Course } from "@/domain/course";
import { addDays, type Exam, type ExamStatus } from "@/domain/exam";
import { absenceDays, type TeacherAbsence } from "@/domain/teacher-absence";
import { formatDay } from "@/lib/format";

/*
 * Pure model of the monthly exam calendar. Months are "yyyy-mm" strings and
 * days "yyyy-mm-dd"; nothing here depends on the browser time zone.
 */

/** What the calendar needs of an exam: staff lists and the family view both fit. */
export interface CalendarExam {
  exam: Pick<Exam, "id" | "date" | "topic">;
  course: Course;
  status: ExamStatus;
}

export interface CalendarDay {
  iso: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
}

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function parseMonth(month: string): [number, number] {
  const [y, m] = month.split("-").map(Number);
  return [y, m];
}

export function monthOf(isoDay: string): string {
  return isoDay.slice(0, 7);
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = parseMonth(month);
  const index = y * 12 + (m - 1) + delta;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
}

/** "Octubre 2026". */
export function monthTitle(month: string): string {
  const [y, m] = parseMonth(month);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

/** Month shown first: the one that contains today. */
export function initialMonth(_items: CalendarExam[], today: string): string {
  return monthOf(today);
}

/** Weeks (Monday first) that cover every day of the month. */
export function monthGrid(month: string, today: string): CalendarDay[][] {
  const [y, m] = parseMonth(month);
  // 0 = Monday ... 6 = Sunday
  const offset = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const weekCount = Math.ceil((offset + daysInMonth) / 7);
  const start = addDays(`${month}-01`, -offset);

  return Array.from({ length: weekCount }, (_, week) =>
    Array.from({ length: 7 }, (_, col) => {
      const iso = addDays(start, week * 7 + col);
      return {
        iso,
        day: Number(iso.slice(8, 10)),
        inMonth: monthOf(iso) === month,
        isToday: iso === today,
        isWeekend: col >= 5,
      };
    }),
  );
}

/** Exams by calendar day; each day's list is sorted by course name. */
export function itemsByDay<T extends CalendarExam>(items: T[]): Map<string, T[]> {
  const byDay = new Map<string, T[]>();
  for (const item of items) {
    const list = byDay.get(item.exam.date) ?? [];
    list.push(item);
    byDay.set(item.exam.date, list);
  }
  for (const list of byDay.values()) {
    list.sort((a, b) => a.course.name.localeCompare(b.course.name, "es"));
  }
  return byDay;
}

export function itemsInMonth<T extends CalendarExam>(items: T[], month: string): T[] {
  return items.filter((i) => monthOf(i.exam.date) === month);
}

/** Position of each course in the palette, stable for the given order. */
export function courseColorIndex(courseIds: string[]): Map<string, number> {
  return new Map(courseIds.map((id, index) => [id, index]));
}

/** A teacher absence with the teacher's name, ready for the calendar. */
export interface AbsenceItem {
  absence: TeacherAbsence;
  teacherName: string;
}

/** Absences by calendar day: a multi-day absence appears on every day it covers. */
export function absencesByDay(items: AbsenceItem[]): Map<string, AbsenceItem[]> {
  const byDay = new Map<string, AbsenceItem[]>();
  for (const item of items) {
    for (const day of absenceDays(item.absence)) {
      const list = byDay.get(day) ?? [];
      list.push(item);
      byDay.set(day, list);
    }
  }
  for (const list of byDay.values()) {
    list.sort((a, b) => a.teacherName.localeCompare(b.teacherName, "es"));
  }
  return byDay;
}

/** Absences that cover at least one day of the month. */
export function absencesInMonth(items: AbsenceItem[], month: string): AbsenceItem[] {
  const first = `${month}-01`;
  const last = addDays(`${shiftMonth(month, 1)}-01`, -1);
  return items.filter((i) => i.absence.from <= last && i.absence.to >= first);
}

/** "21/10/2026" or "del 27/10/2026 al 28/10/2026". */
export function absenceRangeText(from: string, to: string): string {
  return from === to ? formatDay(from) : `del ${formatDay(from)} al ${formatDay(to)}`;
}
