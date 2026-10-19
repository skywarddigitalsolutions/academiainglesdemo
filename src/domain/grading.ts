export type GradingType = "conceptual" | "numeric";

export const CONCEPTUAL_SCALE = [
  "Excelente",
  "Muy bien +",
  "Muy bien",
  "Bien +",
  "Bien",
  "Regular",
  "Desaprobado",
] as const;

export type ConceptualGrade = (typeof CONCEPTUAL_SCALE)[number];

/** A grade is either a conceptual label or a numeric value (1-10). */
export type GradeValue = ConceptualGrade | number;

export const PASS_MARK = 6;
export const MIN_NUMERIC_GRADE = 1;
export const MAX_NUMERIC_GRADE = 10;

export function isValidNumericGrade(value: number): boolean {
  return (
    Number.isFinite(value) &&
    value >= MIN_NUMERIC_GRADE &&
    value <= MAX_NUMERIC_GRADE
  );
}

export function isConceptualGrade(value: unknown): value is ConceptualGrade {
  return (
    typeof value === "string" &&
    (CONCEPTUAL_SCALE as readonly string[]).includes(value)
  );
}

export function isValidGrade(type: GradingType, value: unknown): boolean {
  if (type === "conceptual") return isConceptualGrade(value);
  return typeof value === "number" && isValidNumericGrade(value);
}

/**
 * Visual hint only: the system never decides a result on its own.
 */
export function isBelowPassMark(value: GradeValue | null): boolean {
  return typeof value === "number" && value < PASS_MARK;
}

export function formatGrade(value: GradeValue | null): string {
  if (value === null) return "—";
  if (typeof value === "number") return String(value).replace(".", ",");
  return value;
}
