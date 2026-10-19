import { DomainError } from "./errors";
import { addDays, isIsoDate } from "./exam";

/** A teacher who will not be at school between two calendar days (both included). */
export interface TeacherAbsence {
  id: string;
  teacherId: string;
  /** yyyy-mm-dd */
  from: string;
  /** yyyy-mm-dd, never before `from`. */
  to: string;
  reason: string;
  createdAt: string;
}

export const TEACHER_ABSENCE_REASON_MAX_LENGTH = 200;

export function createTeacherAbsence(params: {
  id: string;
  teacherId: string;
  from: string;
  to: string;
  reason: string;
  now: Date;
}): TeacherAbsence {
  if (!isIsoDate(params.from)) {
    throw new DomainError("absence-invalid-date", "Ingrese una fecha de inicio válida.");
  }
  if (!isIsoDate(params.to)) {
    throw new DomainError("absence-invalid-date", "Ingrese una fecha de fin válida.");
  }
  if (params.to < params.from) {
    throw new DomainError(
      "absence-invalid-range",
      "La fecha «Hasta» no puede ser anterior a la fecha «Desde».",
    );
  }
  const reason = params.reason.trim();
  if (reason === "") {
    throw new DomainError("absence-reason-empty", "Escriba el motivo de la ausencia.");
  }
  if (reason.length > TEACHER_ABSENCE_REASON_MAX_LENGTH) {
    throw new DomainError(
      "absence-reason-too-long",
      `El motivo puede tener hasta ${TEACHER_ABSENCE_REASON_MAX_LENGTH} caracteres.`,
    );
  }
  return {
    id: params.id,
    teacherId: params.teacherId,
    from: params.from,
    to: params.to,
    reason,
    createdAt: params.now.toISOString(),
  };
}

export function absenceCoversDay(absence: TeacherAbsence, day: string): boolean {
  return absence.from <= day && day <= absence.to;
}

/** Every calendar day of the absence, in order. */
export function absenceDays(absence: TeacherAbsence): string[] {
  const days: string[] = [];
  for (let day = absence.from; day <= absence.to; day = addDays(day, 1)) days.push(day);
  return days;
}
