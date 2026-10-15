import type { GradingType } from "./grading";

export interface Course {
  id: string;
  name: string;
  /** Grading type is defined per course, not by school grade. */
  gradingType: GradingType;
  teacherIds: string[];
  /** Name of the course the student is promoted to (suggestion for the closing). */
  nextCourseName: string;
  schedule: string;
}

export function gradingTypeLabel(type: GradingType): string {
  return type === "conceptual" ? "Conceptual" : "Numérica (1 a 10)";
}
