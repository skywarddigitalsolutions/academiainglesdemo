import { describe, expect, it } from "vitest";
import type { ExamListItem } from "@/application/exams";
import type { Course } from "@/domain/course";
import type { Exam } from "@/domain/exam";
import {
  absenceRangeText,
  absencesByDay,
  absencesInMonth,
  courseColorIndex,
  initialMonth,
  itemsByDay,
  itemsInMonth,
  monthGrid,
  monthOf,
  monthTitle,
  shiftMonth,
  type AbsenceItem,
} from "./calendar-model";

function item(id: string, date: string, courseName: string): ExamListItem {
  const course = { id: `c-${courseName}`, name: courseName } as Course;
  const exam = { id, date, courseId: course.id, topic: id } as Exam;
  return {
    exam,
    course,
    status: "upcoming",
    stats: { total: 0, graded: 0, average: null, atPassMark: 0 },
  };
}

describe("month helpers", () => {
  it("extracts the month of a day", () => {
    expect(monthOf("2026-10-21")).toBe("2026-10");
  });

  it("shifts months across year boundaries", () => {
    expect(shiftMonth("2026-10", 1)).toBe("2026-11");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-03", -14)).toBe("2025-01");
  });

  it("titles a month in Spanish with a capital letter", () => {
    expect(monthTitle("2026-10")).toBe("Octubre 2026");
    expect(monthTitle("2027-03")).toBe("Marzo 2027");
  });

  it("starts on today's month", () => {
    expect(initialMonth([], "2026-10-18")).toBe("2026-10");
  });
});

describe("monthGrid", () => {
  it("covers full Monday-first weeks", () => {
    const grid = monthGrid("2026-10", "2026-10-18");
    expect(grid.every((week) => week.length === 7)).toBe(true);
    expect(grid[0][0].iso).toBe("2026-09-28");
    expect(grid.at(-1)?.[6].iso).toBe("2026-11-01");
    expect(grid).toHaveLength(5);
  });

  it("flags in-month, today and weekend days", () => {
    const days = monthGrid("2026-10", "2026-10-18").flat();
    const sep28 = days.find((d) => d.iso === "2026-09-28");
    const oct18 = days.find((d) => d.iso === "2026-10-18");
    expect(sep28).toMatchObject({ day: 28, inMonth: false, isToday: false, isWeekend: false });
    expect(oct18).toMatchObject({ day: 18, inMonth: true, isToday: true, isWeekend: true });
    expect(days.filter((d) => d.isToday)).toHaveLength(1);
  });

  it("has no today flag when today is outside the grid", () => {
    expect(monthGrid("2026-10", "2026-01-01").flat().some((d) => d.isToday)).toBe(false);
  });

  it("uses six weeks when the month needs them", () => {
    expect(monthGrid("2027-02", "2027-02-01")).toHaveLength(4);
    expect(monthGrid("2026-08", "2026-08-01")).toHaveLength(6);
  });
});

describe("exam grouping", () => {
  const items = [
    item("e1", "2026-10-21", "5° B"),
    item("e2", "2026-10-21", "4° A"),
    item("e3", "2026-11-02", "4° A"),
  ];

  it("groups by day sorted by course name", () => {
    const byDay = itemsByDay(items);
    expect(byDay.get("2026-10-21")?.map((i) => i.exam.id)).toEqual(["e2", "e1"]);
    expect(byDay.get("2026-11-02")).toHaveLength(1);
  });

  it("filters the items of one month", () => {
    expect(itemsInMonth(items, "2026-10").map((i) => i.exam.id)).toEqual(["e1", "e2"]);
    expect(itemsInMonth(items, "2026-12")).toEqual([]);
  });

  it("assigns stable color indexes by the given order", () => {
    const map = courseColorIndex(["c-b", "c-a", "c-c"]);
    expect(map.get("c-b")).toBe(0);
    expect(map.get("c-a")).toBe(1);
    expect(map.get("c-c")).toBe(2);
  });
});

describe("teacher absences", () => {
  const absence = (id: string, teacherName: string, from: string, to: string): AbsenceItem => ({
    absence: { id, teacherId: `t-${id}`, from, to, reason: "x", createdAt: "" },
    teacherName,
  });
  const list = [
    absence("a", "Javier Peralta", "2026-10-27", "2026-10-29"),
    absence("b", "Laura Benítez", "2026-10-28", "2026-10-28"),
    absence("c", "Ana Soto", "2026-10-30", "2026-11-02"),
  ];

  it("places a multi-day absence on every day it covers", () => {
    const byDay = absencesByDay(list);
    expect([...byDay.keys()].sort()).toEqual([
      "2026-10-27",
      "2026-10-28",
      "2026-10-29",
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
      "2026-11-02",
    ]);
    expect(byDay.get("2026-10-27")?.map((i) => i.absence.id)).toEqual(["a"]);
  });

  it("sorts each day by teacher name", () => {
    const names = absencesByDay(list).get("2026-10-28")?.map((i) => i.teacherName);
    expect(names).toEqual(["Javier Peralta", "Laura Benítez"]);
  });

  it("keeps the absences that overlap a month", () => {
    expect(absencesInMonth(list, "2026-11").map((i) => i.absence.id)).toEqual(["c"]);
    expect(absencesInMonth(list, "2026-10").map((i) => i.absence.id)).toEqual(["a", "b", "c"]);
    expect(absencesInMonth(list, "2026-09")).toEqual([]);
    expect(absencesInMonth(list, "2026-12")).toEqual([]);
  });

  it("writes the date range", () => {
    expect(absenceRangeText("2026-10-21", "2026-10-21")).toBe("21/10/2026");
    expect(absenceRangeText("2026-10-27", "2026-10-28")).toBe("del 27/10/2026 al 28/10/2026");
  });
});
