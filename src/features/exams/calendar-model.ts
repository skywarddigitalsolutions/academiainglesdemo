import type { ExamListItem } from "@/application/exams";
import { addDays } from "@/domain/exam";

/*
 * Pure model of the monthly exam calendar. Months are "yyyy-mm" strings and
 * days "yyyy-mm-dd"; nothing here depends on the browser time zone.
 */

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
export function initialMonth(_items: ExamListItem[], today: string): string {
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
export function itemsByDay(items: ExamListItem[]): Map<string, ExamListItem[]> {
  const byDay = new Map<string, ExamListItem[]>();
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

export function itemsInMonth(items: ExamListItem[], month: string): ExamListItem[] {
  return items.filter((i) => monthOf(i.exam.date) === month);
}

/** Position of each course in the palette, stable for the given order. */
export function courseColorIndex(courseIds: string[]): Map<string, number> {
  return new Map(courseIds.map((id, index) => [id, index]));
}
