import { describe, expect, it } from "vitest";
import { DomainError } from "./errors";
import {
  acknowledgeBimester,
  createEmptyReportCard,
  formatFinalResult,
  getBimester,
  getBimesterStatus,
  getClosingStatus,
  isBimesterComplete,
  publishBimester,
  publishClosing,
  toParentView,
  updateBimester,
  updateClosing,
  type ReportCard,
} from "./report-card";

const NOW = new Date("2026-06-10T12:00:00.000Z");
const LATER = new Date("2026-06-12T09:30:00.000Z");

function newCard(): ReportCard {
  return createEmptyReportCard({
    id: "rc-1",
    studentId: "s-1",
    courseId: "c-1",
    year: 2026,
  });
}

function filledCard(): ReportCard {
  return updateBimester(
    newCard(),
    1,
    { applicationGrade: 8, conductGrade: "Muy bueno", absences: 2 },
    "numeric",
  );
}

function publishedCard(): ReportCard {
  return publishBimester(filledCard(), 1, NOW);
}

describe("createEmptyReportCard", () => {
  it("creates four empty, unpublished bimesters and an empty closing", () => {
    const card = newCard();
    expect(card.bimesters).toHaveLength(4);
    expect(card.bimesters.map((b) => b.number)).toEqual([1, 2, 3, 4]);
    for (const b of card.bimesters) {
      expect(b.applicationGrade).toBeNull();
      expect(b.conductGrade).toBeNull();
      expect(b.absences).toBe(0);
      expect(b.publishedAt).toBeNull();
      expect(b.readAt).toBeNull();
      expect(getBimesterStatus(b)).toBe("empty");
    }
    expect(card.closing.cuatrimestralExam).toBeNull();
    expect(card.closing.result).toBeNull();
    expect(card.closing.publishedAt).toBeNull();
    expect(getClosingStatus(card.closing)).toBe("empty");
  });
});

describe("updateBimester", () => {
  it("records grades as a draft without mutating the original card", () => {
    const original = newCard();
    const updated = updateBimester(
      original,
      1,
      { applicationGrade: 7, conductGrade: "Bueno", observation: "Good work" },
      "numeric",
    );
    expect(getBimester(updated, 1).applicationGrade).toBe(7);
    expect(getBimester(updated, 1).observation).toBe("Good work");
    expect(getBimester(original, 1).applicationGrade).toBeNull();
    expect(getBimesterStatus(getBimester(updated, 1))).toBe("draft");
  });

  it("rejects an application grade that does not match the grading type", () => {
    expect(() =>
      updateBimester(newCard(), 1, { applicationGrade: "Bueno" }, "numeric"),
    ).toThrow(DomainError);
    expect(() =>
      updateBimester(newCard(), 1, { applicationGrade: 9 }, "conceptual"),
    ).toThrow(DomainError);
  });

  it("accepts conceptual application grades for conceptual courses", () => {
    const card = updateBimester(
      newCard(),
      2,
      { applicationGrade: "Excelente" },
      "conceptual",
    );
    expect(getBimester(card, 2).applicationGrade).toBe("Excelente");
  });

  it("always requires a conceptual conduct grade", () => {
    expect(() =>
      updateBimester(
        newCard(),
        1,
        { conductGrade: 8 as unknown as "Bueno" },
        "numeric",
      ),
    ).toThrow(DomainError);
  });

  it("rejects negative or fractional absences", () => {
    expect(() =>
      updateBimester(newCard(), 1, { absences: -1 }, "numeric"),
    ).toThrow(DomainError);
    expect(() =>
      updateBimester(newCard(), 1, { absences: 1.5 }, "numeric"),
    ).toThrow(DomainError);
  });

  it("allows clearing a grade with null", () => {
    const card = updateBimester(
      filledCard(),
      1,
      { applicationGrade: null },
      "numeric",
    );
    expect(getBimester(card, 1).applicationGrade).toBeNull();
  });

  it("lets the teacher edit a published bimester and keeps it published", () => {
    const edited = updateBimester(
      publishedCard(),
      1,
      { applicationGrade: 9 },
      "numeric",
    );
    const b = getBimester(edited, 1);
    expect(b.applicationGrade).toBe(9);
    expect(b.publishedAt).toBe(NOW.toISOString());
    expect(getBimesterStatus(b)).toBe("published");
  });
});

describe("bimester publication", () => {
  it("knows when a bimester has the grades required to publish", () => {
    expect(isBimesterComplete(getBimester(newCard(), 1))).toBe(false);
    expect(isBimesterComplete(getBimester(filledCard(), 1))).toBe(true);
  });

  it("publishes a complete bimester with a timestamp", () => {
    const b = getBimester(publishedCard(), 1);
    expect(b.publishedAt).toBe(NOW.toISOString());
    expect(getBimesterStatus(b)).toBe("published");
  });

  it("refuses to publish a bimester without application and conduct grades", () => {
    expect(() => publishBimester(newCard(), 1, NOW)).toThrow(DomainError);
  });

  it("keeps the first publication timestamp when published twice", () => {
    const again = publishBimester(publishedCard(), 1, LATER);
    expect(getBimester(again, 1).publishedAt).toBe(NOW.toISOString());
  });

  it("lets the parent mark only published bimesters as read", () => {
    expect(() => acknowledgeBimester(filledCard(), 1, LATER)).toThrow(
      DomainError,
    );
    const read = acknowledgeBimester(publishedCard(), 1, LATER);
    const b = getBimester(read, 1);
    expect(b.readAt).toBe(LATER.toISOString());
    expect(getBimesterStatus(b)).toBe("read");
  });

  it("keeps the first read timestamp when acknowledged twice", () => {
    const first = acknowledgeBimester(publishedCard(), 1, NOW);
    const second = acknowledgeBimester(first, 1, LATER);
    expect(getBimester(second, 1).readAt).toBe(NOW.toISOString());
  });
});

describe("closing section", () => {
  it("stores the cuatrimestral exam without computing anything", () => {
    const card = updateClosing(newCard(), { cuatrimestralExam: 4 }, "numeric");
    expect(card.closing.cuatrimestralExam).toBe(4);
    expect(card.closing.result).toBeNull();
    expect(getClosingStatus(card.closing)).toBe("draft");
  });

  it("validates the cuatrimestral exam against the grading type", () => {
    expect(() =>
      updateClosing(newCard(), { cuatrimestralExam: "Bueno" }, "numeric"),
    ).toThrow(DomainError);
  });

  it("records the result chosen by the teacher, even against low grades", () => {
    const card = updateClosing(
      newCard(),
      { cuatrimestralExam: 3, result: "Aprobado" },
      "numeric",
    );
    expect(card.closing.result).toBe("Aprobado");
  });

  it("keeps the final exam only when the student goes to a final exam", () => {
    const toFinal = updateClosing(
      newCard(),
      {
        result: "Va a examen final",
        finalExam: { modality: "Oral", grade: 7 },
      },
      "numeric",
    );
    expect(toFinal.closing.finalExam).toEqual({ modality: "Oral", grade: 7 });

    const approved = updateClosing(toFinal, { result: "Aprobado" }, "numeric");
    expect(approved.closing.finalExam).toBeNull();
  });

  it("validates the final exam grade", () => {
    expect(() =>
      updateClosing(
        newCard(),
        {
          result: "Va a examen final",
          finalExam: { modality: "Escrito", grade: 15 },
        },
        "numeric",
      ),
    ).toThrow(DomainError);
  });

  it("requires result and final result before publishing the closing", () => {
    expect(() => publishClosing(newCard(), NOW)).toThrow(DomainError);
    const ready = updateClosing(
      newCard(),
      {
        result: "Aprobado",
        finalResult: { kind: "promoted", nextCourseName: "6° Grado A" },
      },
      "numeric",
    );
    const published = publishClosing(ready, NOW);
    expect(published.closing.publishedAt).toBe(NOW.toISOString());
    expect(getClosingStatus(published.closing)).toBe("published");
  });

  it("lets the teacher edit a published closing", () => {
    const published = publishClosing(
      updateClosing(
        newCard(),
        { result: "Aprobado", finalResult: { kind: "march" } },
        "numeric",
      ),
      NOW,
    );
    const edited = updateClosing(
      published,
      { result: "Va a examen final" },
      "numeric",
    );
    expect(edited.closing.result).toBe("Va a examen final");
    expect(edited.closing.publishedAt).toBe(NOW.toISOString());
  });

  it("formats the final result in Spanish", () => {
    expect(
      formatFinalResult({ kind: "promoted", nextCourseName: "3° Grado A" }),
    ).toBe("Promovido a 3° Grado A");
    expect(formatFinalResult({ kind: "march" })).toBe("Debe rendir en marzo");
    expect(formatFinalResult(null)).toBe("—");
  });
});

describe("toParentView", () => {
  it("hides bimesters that were not published", () => {
    let card = publishedCard();
    card = updateBimester(
      card,
      2,
      { applicationGrade: 9, conductGrade: "Excelente" },
      "numeric",
    );

    const view = toParentView(card);
    expect(view.bimesters[0].visible).toBe(true);
    expect(view.bimesters[0].data?.applicationGrade).toBe(8);
    expect(view.bimesters[1].visible).toBe(false);
    expect(view.bimesters[1].data).toBeNull();
  });

  it("shows the closing only after it was published", () => {
    const ready = updateClosing(
      newCard(),
      {
        cuatrimestralExam: 8,
        result: "Aprobado",
        finalResult: { kind: "march" },
      },
      "numeric",
    );
    expect(toParentView(ready).closing).toBeNull();
    expect(toParentView(publishClosing(ready, NOW)).closing).not.toBeNull();
  });

  it("shows the cuatrimestral exam once bimester 2 is published", () => {
    let card = updateClosing(newCard(), { cuatrimestralExam: 8 }, "numeric");
    expect(toParentView(card).cuatrimestralExam).toBeNull();
    card = updateBimester(
      card,
      2,
      { applicationGrade: 8, conductGrade: "Bueno" },
      "numeric",
    );
    card = publishBimester(card, 2, NOW);
    expect(toParentView(card).cuatrimestralExam).toBe(8);
  });
});
