import { DomainError } from "./errors";
import {
  isConceptualGrade,
  isValidGrade,
  type ConceptualGrade,
  type GradeValue,
  type GradingType,
} from "./grading";

export const BIMESTER_NUMBERS = [1, 2, 3, 4] as const;
export type BimesterNumber = (typeof BIMESTER_NUMBERS)[number];

/** The cuatrimestral exam is taken after this bimester. */
export const CUATRIMESTRAL_AFTER_BIMESTER: BimesterNumber = 2;

export interface Signature {
  signed: boolean;
  at: string | null;
}

export interface BimesterSignatures {
  teacher: Signature;
  director: Signature;
  parent: Signature;
}

export interface Bimester {
  number: BimesterNumber;
  applicationGrade: GradeValue | null;
  conductGrade: ConceptualGrade | null;
  observation: string;
  absences: number;
  signatures: BimesterSignatures;
}

export type BimesterStatus =
  | "empty"
  | "draft"
  | "pending-approval"
  | "approved"
  | "acknowledged";

export const CLOSING_RESULTS = ["Aprobado", "Va a examen final"] as const;
export type ClosingResult = (typeof CLOSING_RESULTS)[number];

export const FINAL_EXAM_MODALITIES = ["Oral", "Escrito"] as const;
export type FinalExamModality = (typeof FINAL_EXAM_MODALITIES)[number];

export interface FinalExam {
  modality: FinalExamModality | null;
  grade: GradeValue | null;
}

export type FinalResult =
  | { kind: "promoted"; nextCourseName: string }
  | { kind: "march" };

export interface Closing {
  cuatrimestralExam: GradeValue | null;
  result: ClosingResult | null;
  finalExam: FinalExam | null;
  finalResult: FinalResult | null;
  directorSignature: Signature;
}

export interface ReportCard {
  id: string;
  studentId: string;
  courseId: string;
  year: number;
  bimesters: Bimester[];
  closing: Closing;
}

export type BimesterPatch = Partial<
  Pick<Bimester, "applicationGrade" | "conductGrade" | "observation" | "absences">
>;

export type ClosingPatch = Partial<Omit<Closing, "directorSignature">>;

const UNSIGNED: Signature = { signed: false, at: null };

function sign(now: Date): Signature {
  return { signed: true, at: now.toISOString() };
}

function emptyBimester(number: BimesterNumber): Bimester {
  return {
    number,
    applicationGrade: null,
    conductGrade: null,
    observation: "",
    absences: 0,
    signatures: { teacher: UNSIGNED, director: UNSIGNED, parent: UNSIGNED },
  };
}

export function createEmptyReportCard(params: {
  id: string;
  studentId: string;
  courseId: string;
  year: number;
}): ReportCard {
  return {
    ...params,
    bimesters: BIMESTER_NUMBERS.map(emptyBimester),
    closing: {
      cuatrimestralExam: null,
      result: null,
      finalExam: null,
      finalResult: null,
      directorSignature: UNSIGNED,
    },
  };
}

export function getBimester(card: ReportCard, number: BimesterNumber): Bimester {
  const bimester = card.bimesters.find((b) => b.number === number);
  if (!bimester) {
    throw new DomainError("bimester-not-found", "El bimestre no existe.");
  }
  return bimester;
}

export function getBimesterStatus(bimester: Bimester): BimesterStatus {
  const { teacher, director, parent } = bimester.signatures;
  if (director.signed && parent.signed) return "acknowledged";
  if (director.signed) return "approved";
  if (teacher.signed) return "pending-approval";
  const hasContent =
    bimester.applicationGrade !== null ||
    bimester.conductGrade !== null ||
    bimester.observation.trim() !== "" ||
    bimester.absences > 0;
  return hasContent ? "draft" : "empty";
}

export function isVisibleToParent(bimester: Bimester): boolean {
  return bimester.signatures.director.signed;
}

function replaceBimester(
  card: ReportCard,
  number: BimesterNumber,
  change: (b: Bimester) => Bimester,
): ReportCard {
  const current = getBimester(card, number);
  return {
    ...card,
    bimesters: card.bimesters.map((b) =>
      b.number === number ? change(current) : b,
    ),
  };
}

export function updateBimester(
  card: ReportCard,
  number: BimesterNumber,
  patch: BimesterPatch,
  gradingType: GradingType,
): ReportCard {
  const current = getBimester(card, number);
  if (current.signatures.teacher.signed) {
    throw new DomainError(
      "bimester-locked",
      "El bimestre ya fue firmado por el docente y no puede modificarse.",
    );
  }
  if (
    patch.applicationGrade !== undefined &&
    patch.applicationGrade !== null &&
    !isValidGrade(gradingType, patch.applicationGrade)
  ) {
    throw new DomainError(
      "invalid-application-grade",
      gradingType === "numeric"
        ? "La nota de aplicación debe ser un número entre 1 y 10."
        : "La nota de aplicación debe ser una calificación conceptual.",
    );
  }
  if (
    patch.conductGrade !== undefined &&
    patch.conductGrade !== null &&
    !isConceptualGrade(patch.conductGrade)
  ) {
    throw new DomainError(
      "invalid-conduct-grade",
      "La conducta debe ser una calificación conceptual.",
    );
  }
  if (
    patch.absences !== undefined &&
    (!Number.isInteger(patch.absences) || patch.absences < 0)
  ) {
    throw new DomainError(
      "invalid-absences",
      "Las inasistencias deben ser un número entero mayor o igual a 0.",
    );
  }
  return replaceBimester(card, number, (b) => ({ ...b, ...patch }));
}

export function signBimesterAsTeacher(
  card: ReportCard,
  number: BimesterNumber,
  now: Date,
): ReportCard {
  const current = getBimester(card, number);
  if (current.signatures.teacher.signed) return card;
  if (current.applicationGrade === null || current.conductGrade === null) {
    throw new DomainError(
      "bimester-incomplete",
      "Para firmar el bimestre cargue la nota de aplicación y la conducta.",
    );
  }
  return replaceBimester(card, number, (b) => ({
    ...b,
    signatures: { ...b.signatures, teacher: sign(now) },
  }));
}

export function reopenBimester(
  card: ReportCard,
  number: BimesterNumber,
): ReportCard {
  const current = getBimester(card, number);
  if (current.signatures.director.signed) {
    throw new DomainError(
      "bimester-approved",
      "El bimestre ya fue aprobado por Dirección y no puede reabrirse.",
    );
  }
  return replaceBimester(card, number, (b) => ({
    ...b,
    signatures: { ...b.signatures, teacher: UNSIGNED },
  }));
}

export function approveBimester(
  card: ReportCard,
  number: BimesterNumber,
  now: Date,
): ReportCard {
  const current = getBimester(card, number);
  if (!current.signatures.teacher.signed) {
    throw new DomainError(
      "bimester-not-signed",
      "El bimestre debe estar firmado por el docente antes de aprobarse.",
    );
  }
  if (current.signatures.director.signed) return card;
  return replaceBimester(card, number, (b) => ({
    ...b,
    signatures: { ...b.signatures, director: sign(now) },
  }));
}

export function acknowledgeBimester(
  card: ReportCard,
  number: BimesterNumber,
  now: Date,
): ReportCard {
  const current = getBimester(card, number);
  if (!current.signatures.director.signed) {
    throw new DomainError(
      "bimester-not-approved",
      "El bimestre todavía no fue aprobado por Dirección.",
    );
  }
  if (current.signatures.parent.signed) return card;
  return replaceBimester(card, number, (b) => ({
    ...b,
    signatures: { ...b.signatures, parent: sign(now) },
  }));
}

export function updateClosing(
  card: ReportCard,
  patch: ClosingPatch,
  gradingType: GradingType,
): ReportCard {
  if (card.closing.directorSignature.signed) {
    throw new DomainError(
      "closing-locked",
      "El cierre ya fue firmado por Dirección y no puede modificarse.",
    );
  }
  if (
    patch.cuatrimestralExam !== undefined &&
    patch.cuatrimestralExam !== null &&
    !isValidGrade(gradingType, patch.cuatrimestralExam)
  ) {
    throw new DomainError(
      "invalid-cuatrimestral",
      "La nota del examen cuatrimestral no es válida para este curso.",
    );
  }
  const next: Closing = { ...card.closing, ...patch };
  if (next.result !== "Va a examen final") {
    next.finalExam = null;
  } else if (
    next.finalExam?.grade !== undefined &&
    next.finalExam.grade !== null &&
    !isValidGrade(gradingType, next.finalExam.grade)
  ) {
    throw new DomainError(
      "invalid-final-exam",
      "La nota del examen final no es válida para este curso.",
    );
  }
  return { ...card, closing: next };
}

export function signClosingAsDirector(
  card: ReportCard,
  now: Date,
): ReportCard {
  if (card.closing.result === null || card.closing.finalResult === null) {
    throw new DomainError(
      "closing-incomplete",
      "Para firmar el cierre, el docente debe cargar el resultado y la situación final.",
    );
  }
  if (card.closing.directorSignature.signed) return card;
  return { ...card, closing: { ...card.closing, directorSignature: sign(now) } };
}

export function formatFinalResult(result: FinalResult | null): string {
  if (result === null) return "—";
  return result.kind === "promoted"
    ? `Promovido a ${result.nextCourseName}`
    : "Debe rendir en marzo";
}

export interface ParentBimesterView {
  number: BimesterNumber;
  visible: boolean;
  data: Bimester | null;
}

export interface ParentReportCardView {
  id: string;
  studentId: string;
  courseId: string;
  year: number;
  bimesters: ParentBimesterView[];
  cuatrimestralExam: GradeValue | null;
  closing: Closing | null;
}

/**
 * Projects a report card to what a parent may see:
 * only director-approved bimesters and a director-signed closing.
 */
export function toParentView(card: ReportCard): ParentReportCardView {
  const cuatrimestralVisible = isVisibleToParent(
    getBimester(card, CUATRIMESTRAL_AFTER_BIMESTER),
  );
  return {
    id: card.id,
    studentId: card.studentId,
    courseId: card.courseId,
    year: card.year,
    bimesters: card.bimesters.map((b) => ({
      number: b.number,
      visible: isVisibleToParent(b),
      data: isVisibleToParent(b) ? b : null,
    })),
    cuatrimestralExam: cuatrimestralVisible
      ? card.closing.cuatrimestralExam
      : null,
    closing: card.closing.directorSignature.signed ? card.closing : null,
  };
}
