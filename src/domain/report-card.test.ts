import { describe, expect, it } from "vitest";
import { DomainError } from "./errors";
import {
  acknowledgeBimester,
  approveBimester,
  createEmptyReportCard,
  formatFinalResult,
  getBimester,
  getBimesterStatus,
  reopenBimester,
  signBimesterAsTeacher,
  signClosingAsDirector,
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

describe("createEmptyReportCard", () => {
  it("creates four empty, unsigned bimesters and an empty closing", () => {
    const card = newCard();
    expect(card.bimesters).toHaveLength(4);
    expect(card.bimesters.map((b) => b.number)).toEqual([1, 2, 3, 4]);
    for (const b of card.bimesters) {
      expect(b.applicationGrade).toBeNull();
      expect(b.conductGrade).toBeNull();
      expect(b.absences).toBe(0);
      expect(b.signatures.teacher.signed).toBe(false);
      expect(getBimesterStatus(b)).toBe("empty");
    }
    expect(card.closing.cuatrimestralExam).toBeNull();
    expect(card.closing.result).toBeNull();
    expect(card.closing.directorSignature.signed).toBe(false);
  });
});

describe("updateBimester", () => {
  it("records grades without mutating the original card", () => {
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

  it("locks the bimester once the teacher signed it", () => {
    const signed = signBimesterAsTeacher(filledCard(), 1, NOW);
    expect(() =>
      updateBimester(signed, 1, { absences: 3 }, "numeric"),
    ).toThrow(DomainError);
  });
});

describe("bimester signature workflow", () => {
  it("lets the teacher sign a complete bimester with a timestamp", () => {
    const card = signBimesterAsTeacher(filledCard(), 1, NOW);
    const b = getBimester(card, 1);
    expect(b.signatures.teacher).toEqual({
      signed: true,
      at: NOW.toISOString(),
    });
    expect(getBimesterStatus(b)).toBe("pending-approval");
  });

  it("refuses to sign a bimester without application and conduct grades", () => {
    expect(() => signBimesterAsTeacher(newCard(), 1, NOW)).toThrow(
      DomainError,
    );
  });

  it("requires the teacher signature before the director approves", () => {
    expect(() => approveBimester(filledCard(), 1, NOW)).toThrow(DomainError);
  });

  it("lets the director approve a signed bimester", () => {
    const signed = signBimesterAsTeacher(filledCard(), 1, NOW);
    const approved = approveBimester(signed, 1, LATER);
    const b = getBimester(approved, 1);
    expect(b.signatures.director).toEqual({
      signed: true,
      at: LATER.toISOString(),
    });
    expect(getBimesterStatus(b)).toBe("approved");
  });

  it("allows the teacher to reopen a bimester only before approval", () => {
    const signed = signBimesterAsTeacher(filledCard(), 1, NOW);
    const reopened = reopenBimester(signed, 1);
    expect(getBimester(reopened, 1).signatures.teacher.signed).toBe(false);

    const approved = approveBimester(signed, 1, LATER);
    expect(() => reopenBimester(approved, 1)).toThrow(DomainError);
  });

  it("lets the parent acknowledge only approved bimesters", () => {
    const signed = signBimesterAsTeacher(filledCard(), 1, NOW);
    expect(() => acknowledgeBimester(signed, 1, LATER)).toThrow(DomainError);

    const approved = approveBimester(signed, 1, NOW);
    const read = acknowledgeBimester(approved, 1, LATER);
    expect(getBimester(read, 1).signatures.parent).toEqual({
      signed: true,
      at: LATER.toISOString(),
    });
    expect(getBimesterStatus(getBimester(read, 1))).toBe("acknowledged");
  });

  it("keeps the first acknowledgement timestamp when acknowledged twice", () => {
    const approved = approveBimester(
      signBimesterAsTeacher(filledCard(), 1, NOW),
      1,
      NOW,
    );
    const first = acknowledgeBimester(approved, 1, NOW);
    const second = acknowledgeBimester(first, 1, LATER);
    expect(getBimester(second, 1).signatures.parent.at).toBe(
      NOW.toISOString(),
    );
  });
});

describe("closing section", () => {
  it("stores the cuatrimestral exam without computing anything", () => {
    const card = updateClosing(newCard(), { cuatrimestralExam: 4 }, "numeric");
    expect(card.closing.cuatrimestralExam).toBe(4);
    expect(card.closing.result).toBeNull();
    expect(getBimester(card, 2).applicationGrade).toBeNull();
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

  it("requires result and final result before the director signs", () => {
    expect(() => signClosingAsDirector(newCard(), NOW)).toThrow(DomainError);
    const ready = updateClosing(
      newCard(),
      {
        result: "Aprobado",
        finalResult: { kind: "promoted", nextCourseName: "6° Grado A" },
      },
      "numeric",
    );
    const signed = signClosingAsDirector(ready, NOW);
    expect(signed.closing.directorSignature).toEqual({
      signed: true,
      at: NOW.toISOString(),
    });
  });

  it("locks the closing once the director signed it", () => {
    const signed = signClosingAsDirector(
      updateClosing(
        newCard(),
        { result: "Aprobado", finalResult: { kind: "march" } },
        "numeric",
      ),
      NOW,
    );
    expect(() =>
      updateClosing(signed, { result: "Va a examen final" }, "numeric"),
    ).toThrow(DomainError);
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
  it("hides bimesters not approved by the director", () => {
    let card = filledCard();
    card = signBimesterAsTeacher(card, 1, NOW);
    card = approveBimester(card, 1, NOW);
    card = updateBimester(
      card,
      2,
      { applicationGrade: 9, conductGrade: "Excelente" },
      "numeric",
    );
    card = signBimesterAsTeacher(card, 2, NOW);

    const view = toParentView(card);
    expect(view.bimesters[0].visible).toBe(true);
    expect(view.bimesters[0].data?.applicationGrade).toBe(8);
    expect(view.bimesters[1].visible).toBe(false);
    expect(view.bimesters[1].data).toBeNull();
  });

  it("shows the closing only after the director signed it", () => {
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
    expect(
      toParentView(signClosingAsDirector(ready, NOW)).closing,
    ).not.toBeNull();
  });

  it("shows the cuatrimestral exam once bimester 2 is approved", () => {
    let card = updateClosing(newCard(), { cuatrimestralExam: 8 }, "numeric");
    expect(toParentView(card).cuatrimestralExam).toBeNull();
    card = updateBimester(
      card,
      2,
      { applicationGrade: 8, conductGrade: "Bueno" },
      "numeric",
    );
    card = approveBimester(signBimesterAsTeacher(card, 2, NOW), 2, NOW);
    expect(toParentView(card).cuatrimestralExam).toBe(8);
  });
});
