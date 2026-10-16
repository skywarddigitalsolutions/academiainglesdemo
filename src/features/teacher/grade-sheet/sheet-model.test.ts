import { describe, expect, it } from "vitest";
import {
  createEmptyReportCard,
  updateBimester,
  updateClosing,
} from "@/domain/report-card";
import {
  bimesterValues,
  closingValues,
  isRowComplete,
  parseGradeText,
  toBimesterPatch,
  toClosingPatch,
  validateRow,
} from "./sheet-model";

const card = () =>
  createEmptyReportCard({ id: "rc", studentId: "s", courseId: "c", year: 2026 });

describe("grade sheet model", () => {
  it("turns a stored bimester into editable text values", () => {
    const filled = updateBimester(
      card(),
      1,
      { applicationGrade: 7.5, conductGrade: "Bueno", absences: 2, observation: "Ok" },
      "numeric",
    );
    expect(bimesterValues(filled, 1)).toEqual({
      application: "7,5",
      conduct: "Bueno",
      absences: "2",
      observation: "Ok",
    });
    expect(bimesterValues(card(), 1).absences).toBe("");
  });

  it("parses grades written with a decimal comma", () => {
    expect(parseGradeText("7,5", "numeric")).toEqual({ ok: true, value: 7.5 });
    expect(parseGradeText("", "numeric")).toEqual({ ok: true, value: null });
    expect(parseGradeText("11", "numeric").ok).toBe(false);
    expect(parseGradeText("abc", "numeric").ok).toBe(false);
    expect(parseGradeText("Bueno", "conceptual")).toEqual({ ok: true, value: "Bueno" });
  });

  it("flags invalid cells without throwing", () => {
    const errors = validateRow(
      1,
      { application: "12", conduct: "", absences: "-1", observation: "" },
      "numeric",
    );
    expect(errors).toEqual({ application: true, absences: true });
  });

  it("builds a bimester patch from text values", () => {
    expect(
      toBimesterPatch(
        { application: "8", conduct: "Muy bueno", absences: "", observation: " Bien " },
        "numeric",
      ),
    ).toEqual({
      applicationGrade: 8,
      conductGrade: "Muy bueno",
      absences: 0,
      observation: "Bien",
    });
  });

  it("builds a closing patch and drops the final exam when not needed", () => {
    const values = {
      cuatrimestral: "5",
      result: "Va a examen final",
      modality: "Oral",
      finalGrade: "7",
      finalResult: "promoted",
    };
    expect(toClosingPatch(values, "numeric", "6° Grado A")).toEqual({
      cuatrimestralExam: 5,
      result: "Va a examen final",
      finalExam: { modality: "Oral", grade: 7 },
      finalResult: { kind: "promoted", nextCourseName: "6° Grado A" },
    });
    expect(
      toClosingPatch({ ...values, result: "Aprobado" }, "numeric", "6° Grado A").finalExam,
    ).toBeNull();
  });

  it("reads the closing back into text values", () => {
    const closed = updateClosing(
      card(),
      { cuatrimestralExam: 8, result: "Aprobado", finalResult: { kind: "march" } },
      "numeric",
    );
    expect(closingValues(closed)).toEqual({
      cuatrimestral: "8",
      result: "Aprobado",
      modality: "",
      finalGrade: "",
      finalResult: "march",
    });
  });

  it("knows when a row can be published", () => {
    expect(
      isRowComplete(1, { application: "8", conduct: "Bueno", absences: "", observation: "" }),
    ).toBe(true);
    expect(
      isRowComplete(1, { application: "8", conduct: "", absences: "", observation: "" }),
    ).toBe(false);
    expect(
      isRowComplete("closing", {
        cuatrimestral: "",
        result: "Aprobado",
        modality: "",
        finalGrade: "",
        finalResult: "march",
      }),
    ).toBe(true);
  });
});
