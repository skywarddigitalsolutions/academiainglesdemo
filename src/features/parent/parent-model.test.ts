import { describe, expect, it } from "vitest";
import {
  acknowledgeBimester,
  createEmptyReportCard,
  publishBimester,
  publishClosing,
  toParentView,
  updateBimester,
  updateClosing,
  type BimesterNumber,
  type ReportCard,
} from "@/domain/report-card";
import {
  latestPublishedPeriod,
  newestPublishedFirst,
  parentBimesterRows,
  parentPeriodSteps,
  scrollTargetPeriod,
  unreadNotice,
  unreadPeriods,
} from "./parent-model";

const NOW = new Date("2026-10-15T13:00:00.000Z");

function publish(card: ReportCard, n: BimesterNumber) {
  return publishBimester(
    updateBimester(card, n, { applicationGrade: 8, conductGrade: "Bien" }, "numeric"),
    n,
    NOW,
  );
}

const empty = () =>
  createEmptyReportCard({ id: "rc", studentId: "s", courseId: "c", year: 2026 });

/** 1° read, 2° published (new), 3° draft only, 4° empty. */
function midYearCard() {
  let card = acknowledgeBimester(publish(empty(), 1), 1, NOW);
  card = publish(card, 2);
  card = updateBimester(card, 3, { applicationGrade: 7 }, "numeric");
  return updateClosing(card, { cuatrimestralExam: 9 }, "numeric");
}

const midYear = () => toParentView(midYearCard());

function closedYear() {
  let card = empty();
  for (const n of [1, 2, 3, 4] as const) card = acknowledgeBimester(publish(card, n), n, NOW);
  card = publishClosing(
    updateClosing(card, { result: "Aprobado", finalResult: { kind: "march" } }, "numeric"),
    NOW,
  );
  return toParentView(card);
}

describe("parent period steps (home cards)", () => {
  it("shows each period as read, new or not published yet", () => {
    expect(parentPeriodSteps(midYear()).map((s) => [s.period, s.state])).toEqual([
      [1, "read"],
      [2, "new"],
      [3, "pending"],
      [4, "pending"],
      ["closing", "pending"],
    ]);
  });

  it("shows a published closing as published and as the latest period", () => {
    const steps = parentPeriodSteps(closedYear());
    expect(steps.at(-1)).toMatchObject({ period: "closing", state: "published" });
    expect(latestPublishedPeriod(steps)).toBe("closing");
  });

  it("lists the unread periods in order", () => {
    expect(unreadPeriods(parentPeriodSteps(midYear()))).toEqual([2]);
  });

  it("has no latest period when nothing was published", () => {
    expect(latestPublishedPeriod(parentPeriodSteps(toParentView(empty())))).toBeNull();
  });
});

describe("parent year rows (report card page)", () => {
  it("lists the four bimesters in chronological order with their state", () => {
    const rows = parentBimesterRows(midYear());
    expect(rows.map((r) => [r.number, r.state])).toEqual([
      [1, "read"],
      [2, "new"],
      [3, "pending"],
      [4, "pending"],
    ]);
  });

  it("only exposes the data of published bimesters (drafts stay compact)", () => {
    const rows = parentBimesterRows(midYear());
    expect(rows[0].bimester?.applicationGrade).toBe(8);
    expect(rows[2].bimester).toBeNull();
    expect(rows[3].bimester).toBeNull();
  });

  it("attaches the cuatrimestral exam to the 2nd bimester once it is published", () => {
    const rows = parentBimesterRows(midYear());
    expect(rows.map((r) => r.cuatrimestralExam)).toEqual([null, 9, null, null]);

    const before = parentBimesterRows(
      toParentView(updateClosing(publish(empty(), 1), { cuatrimestralExam: 9 }, "numeric")),
    );
    expect(before.every((r) => r.cuatrimestralExam === null)).toBe(true);
  });

  it("orders published bimesters newest first for phones, then the pending ones", () => {
    const card = publish(publish(publish(empty(), 1), 2), 3);
    const ordered = newestPublishedFirst(parentBimesterRows(toParentView(card)));
    expect(ordered.map((r) => r.number)).toEqual([3, 2, 1, 4]);
    expect(newestPublishedFirst(parentBimesterRows(toParentView(empty()))).map((r) => r.number))
      .toEqual([1, 2, 3, 4]);
  });
});

describe("unread notice", () => {
  it("summarizes the new bimesters in one short line", () => {
    expect(unreadNotice(0)).toBeNull();
    expect(unreadNotice(1)).toBe("Tiene 1 bimestre nuevo.");
    expect(unreadNotice(2)).toBe("Tiene 2 bimestres nuevos.");
  });
});

describe("scroll target from an old ?periodo= link", () => {
  it("scrolls only to published periods", () => {
    const steps = parentPeriodSteps(midYear());
    expect(scrollTargetPeriod(steps, 2)).toBe(2);
    expect(scrollTargetPeriod(steps, 3)).toBeNull();
    expect(scrollTargetPeriod(steps, "closing")).toBeNull();
    expect(scrollTargetPeriod(steps, null)).toBeNull();
    expect(scrollTargetPeriod(parentPeriodSteps(closedYear()), "closing")).toBe("closing");
  });
});
