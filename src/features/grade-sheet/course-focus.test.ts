import { describe, expect, it } from "vitest";
import type { PeriodProgress } from "@/application/progress";
import { courseFocus } from "./course-focus";

const p = (period: PeriodProgress["period"], total: number, complete: number, published: number): PeriodProgress => ({
  period,
  total,
  complete,
  published,
  read: 0,
});

describe("courseFocus", () => {
  it("points at the first period that is not fully published", () => {
    expect(courseFocus([p(1, 7, 7, 7), p(2, 7, 7, 7), p(3, 7, 5, 0), p(4, 7, 0, 0)])).toEqual({
      state: "current",
      period: 3,
      total: 7,
      complete: 5,
      published: 0,
    });
  });

  it("reports a finished course when every period is published", () => {
    expect(courseFocus([p(1, 3, 3, 3), p("closing", 3, 3, 3)])).toEqual({ state: "done" });
  });

  it("reports an empty course when it has no students", () => {
    expect(courseFocus([p(1, 0, 0, 0)])).toEqual({ state: "empty" });
    expect(courseFocus([])).toEqual({ state: "empty" });
  });
});
