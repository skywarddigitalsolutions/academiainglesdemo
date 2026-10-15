import { DomainError } from "./errors";

export const MAX_GUARDIANS = 2;

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  courseId: string;
  /** Parent user ids (up to two guardians). */
  guardianIds: string[];
}

export function fullName(person: { firstName: string; lastName: string }) {
  return `${person.lastName}, ${person.firstName}`;
}

export function validateStudent(student: Student): Student {
  if (!student.firstName.trim() || !student.lastName.trim()) {
    throw new DomainError(
      "invalid-student-name",
      "Ingrese nombre y apellido del alumno.",
    );
  }
  if (!student.courseId) {
    throw new DomainError("invalid-student-course", "Seleccione un curso.");
  }
  if (student.guardianIds.length > MAX_GUARDIANS) {
    throw new DomainError(
      "too-many-guardians",
      `Un alumno puede tener como máximo ${MAX_GUARDIANS} responsables.`,
    );
  }
  return student;
}

export function linkGuardian(student: Student, parentId: string): Student {
  if (student.guardianIds.includes(parentId)) return student;
  if (student.guardianIds.length >= MAX_GUARDIANS) {
    throw new DomainError(
      "too-many-guardians",
      `Un alumno puede tener como máximo ${MAX_GUARDIANS} responsables.`,
    );
  }
  return { ...student, guardianIds: [...student.guardianIds, parentId] };
}

export function unlinkGuardian(student: Student, parentId: string): Student {
  return {
    ...student,
    guardianIds: student.guardianIds.filter((id) => id !== parentId),
  };
}
