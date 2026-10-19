import type { Course } from "@/domain/course";
import { courseColorIndex } from "./calendar-model";

/*
 * Fixed course palette shared by the calendar and the agenda cards. Class
 * names are literal so Tailwind can see them. Color never carries meaning on
 * its own: the course name is always written next to it.
 */
export interface CourseColor {
  /** Soft chip: background, strong left border and dark text. */
  chip: string;
  /** Solid color (swatches, bars, strips). */
  solid: string;
}

const PALETTE: CourseColor[] = [
  { chip: "border-l-sky-600 bg-sky-50 text-sky-950 hover:bg-sky-100", solid: "bg-sky-600" },
  { chip: "border-l-violet-600 bg-violet-50 text-violet-950 hover:bg-violet-100", solid: "bg-violet-600" },
  { chip: "border-l-amber-600 bg-amber-50 text-amber-950 hover:bg-amber-100", solid: "bg-amber-600" },
  { chip: "border-l-emerald-600 bg-emerald-50 text-emerald-950 hover:bg-emerald-100", solid: "bg-emerald-600" },
  { chip: "border-l-rose-600 bg-rose-50 text-rose-950 hover:bg-rose-100", solid: "bg-rose-600" },
  { chip: "border-l-teal-600 bg-teal-50 text-teal-950 hover:bg-teal-100", solid: "bg-teal-600" },
];

export function courseColorAt(index: number): CourseColor {
  return PALETTE[index % PALETTE.length];
}

/** Color lookup by course id, stable for the order of `courses`. */
export function courseColors(courses: Course[]): (courseId: string) => CourseColor {
  const indexes = courseColorIndex(courses.map((c) => c.id));
  return (courseId) => courseColorAt(indexes.get(courseId) ?? 0);
}
