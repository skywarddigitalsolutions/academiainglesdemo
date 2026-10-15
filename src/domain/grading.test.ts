import { describe, expect, it } from "vitest";
import {
  CONCEPTUAL_SCALE,
  PASS_MARK,
  formatGrade,
  isBelowPassMark,
  isConceptualGrade,
  isValidGrade,
  isValidNumericGrade,
} from "./grading";

describe("grading", () => {
  it("defines the conceptual scale from best to worst", () => {
    expect(CONCEPTUAL_SCALE).toEqual([
      "Excelente",
      "Muy bueno",
      "Bueno",
      "Regular",
      "Insuficiente",
    ]);
  });

  it("uses 6 as the numeric pass mark", () => {
    expect(PASS_MARK).toBe(6);
  });

  it("accepts numeric grades between 1 and 10", () => {
    expect(isValidNumericGrade(1)).toBe(true);
    expect(isValidNumericGrade(10)).toBe(true);
    expect(isValidNumericGrade(7.5)).toBe(true);
  });

  it("rejects numeric grades out of range or not finite", () => {
    expect(isValidNumericGrade(0)).toBe(false);
    expect(isValidNumericGrade(11)).toBe(false);
    expect(isValidNumericGrade(Number.NaN)).toBe(false);
  });

  it("recognizes conceptual grades", () => {
    expect(isConceptualGrade("Muy bueno")).toBe(true);
    expect(isConceptualGrade("Sobresaliente")).toBe(false);
    expect(isConceptualGrade(8)).toBe(false);
  });

  it("validates a grade against the course grading type", () => {
    expect(isValidGrade("conceptual", "Bueno")).toBe(true);
    expect(isValidGrade("conceptual", 8)).toBe(false);
    expect(isValidGrade("numeric", 8)).toBe(true);
    expect(isValidGrade("numeric", "Bueno")).toBe(false);
  });

  it("flags numeric grades below the pass mark as a hint only", () => {
    expect(isBelowPassMark(5)).toBe(true);
    expect(isBelowPassMark(6)).toBe(false);
    expect(isBelowPassMark("Insuficiente")).toBe(false);
    expect(isBelowPassMark(null)).toBe(false);
  });

  it("formats grades for display", () => {
    expect(formatGrade(null)).toBe("—");
    expect(formatGrade(7)).toBe("7");
    expect(formatGrade(7.5)).toBe("7,5");
    expect(formatGrade("Excelente")).toBe("Excelente");
  });
});
