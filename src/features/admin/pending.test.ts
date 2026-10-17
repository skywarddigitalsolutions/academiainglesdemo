import { describe, expect, it } from "vitest";
import type { PeriodProgress } from "@/application/progress";
import type { ReportPeriod } from "@/domain/report-card";
import { pendingItems, type PendingCourse } from "./pending";

const PERIODS: ReportPeriod[] = [1, 2, 3, 4, "closing"];

/** Progress for one course: `rows` overrides periods by position. */
function progress(total: number, rows: Partial<Record<string, Partial<PeriodProgress>>> = {}) {
  return PERIODS.map((period) => ({
    period,
    total,
    complete: 0,
    published: 0,
    read: 0,
    ...rows[String(period)],
  }));
}

function course(id: string, name: string, p: PeriodProgress[]): PendingCourse {
  return { course: { id, name }, studentCount: p[0]?.total ?? 0, progress: p };
}

describe("pendingItems", () => {
  it("lists missing grades and unpublished drafts of each course's current period", () => {
    const items = pendingItems(
      [
        course("c-5a", "5° Grado A", progress(8, {
          1: { complete: 8, published: 8, read: 8 },
          2: { complete: 8, published: 8, read: 8 },
          3: { complete: 5, published: 0 },
        })),
        course("c-2a", "2° Grado A", progress(7, {
          1: { complete: 7, published: 7, read: 7 },
          2: { complete: 7, published: 7, read: 7 },
          3: { complete: 7, published: 2 },
        })),
      ],
      [],
    );
    expect(items).toEqual([
      {
        id: "missing:c-5a",
        text: "5° Grado A · 3° Bimestre: faltan cargar 3 alumnos",
        href: "/admin/grades/c-5a?periodo=3",
      },
      {
        id: "drafts:c-5a",
        text: "5° Grado A · 3° Bimestre: 5 borradores sin publicar",
        href: "/admin/grades/c-5a?periodo=3",
      },
      {
        id: "drafts:c-2a",
        text: "2° Grado A · 3° Bimestre: 5 borradores sin publicar",
        href: "/admin/grades/c-2a?periodo=3",
      },
    ]);
  });

  it("lists periods waiting for approval first, without repeating their drafts", () => {
    const items = pendingItems(
      [
        course("c-2a", "2° Grado A", progress(7, { 1: { complete: 2, published: 0 } })),
        {
          ...course("c-1y", "1° Año", progress(6, {
            1: { complete: 6, published: 6 },
            2: { complete: 6, published: 6 },
            3: { complete: 4, published: 0 },
          })),
          reviews: [{ period: 3, status: "pending" }],
        },
      ],
      [],
    );
    expect(items[0]).toEqual({
      id: "approval:c-1y:3",
      text: "1° Año · 3° Bimestre: pendiente de aprobación",
      href: "/admin/grades/c-1y?periodo=3",
    });
    expect(items.map((i) => i.id)).toEqual([
      "approval:c-1y:3",
      "missing:c-2a",
      "drafts:c-2a",
      "missing:c-1y",
    ]);
  });

  it("uses the singular for one student or one draft", () => {
    const items = pendingItems(
      [course("c-1y", "1° Año", progress(2, { 1: { complete: 1, published: 0 } }))],
      [],
    );
    expect(items.map((i) => i.text)).toEqual([
      "1° Año · 1° Bimestre: falta cargar 1 alumno",
      "1° Año · 1° Bimestre: 1 borrador sin publicar",
    ]);
  });

  it("skips courses without students and fully published courses", () => {
    const allDone = progress(3, {
      1: { complete: 3, published: 3 },
      2: { complete: 3, published: 3 },
      3: { complete: 3, published: 3 },
      4: { complete: 3, published: 3 },
      closing: { complete: 3, published: 3 },
    });
    expect(pendingItems([course("a", "A", progress(0)), course("b", "B", allDone)], [])).toEqual([]);
  });

  it("adds published bimesters that families have not read yet", () => {
    const overall: PeriodProgress[] = [
      { period: 1, total: 21, complete: 21, published: 21, read: 21 },
      { period: 2, total: 21, complete: 21, published: 21, read: 6 },
      { period: 3, total: 21, complete: 15, published: 0, read: 0 },
      { period: "closing", total: 21, complete: 0, published: 0, read: 0 },
    ];
    expect(pendingItems([], overall)).toEqual([
      {
        id: "unread:2",
        text: "2° Bimestre: 15 boletines publicados aún sin leer por las familias",
        href: "/admin/grades",
      },
    ]);
  });
});
