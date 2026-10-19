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

/** A grade sheet period: one of the bimesters or the year closing. */
export type ReportPeriod = BimesterNumber | "closing";
export const REPORT_PERIODS: readonly ReportPeriod[] = [...BIMESTER_NUMBERS, "closing"];

/** The cuatrimestral exam is taken after this bimester. */
export const CUATRIMESTRAL_AFTER_BIMESTER: BimesterNumber = 2;

export interface Bimester {
  number: BimesterNumber;
  applicationGrade: GradeValue | null;
  conductGrade: ConceptualGrade | null;
  observation: string;
  /** When the teacher published it to families (null = draft or empty). */
  publishedAt: string | null;
  /** When a family marked it as read. */
  readAt: string | null;
}

export type BimesterStatus = "empty" | "draft" | "published" | "read";
export type ClosingStatus = "empty" | "draft" | "published";

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
  /** When the teacher published the closing to families. */
  publishedAt: string | null;
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
  Pick<Bimester, "applicationGrade" | "conductGrade" | "observation">
>;

export type ClosingPatch = Partial<Omit<Closing, "publishedAt">>;

function emptyBimester(number: BimesterNumber): Bimester {
  return {
    number,
    applicationGrade: null,
    conductGrade: null,
    observation: "",
    publishedAt: null,
    readAt: null,
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
      publishedAt: null,
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

function hasBimesterContent(bimester: Bimester): boolean {
  return (
    bimester.applicationGrade !== null ||
    bimester.conductGrade !== null ||
    bimester.observation.trim() !== ""
  );
}

export function getBimesterStatus(bimester: Bimester): BimesterStatus {
  if (bimester.publishedAt !== null) {
    return bimester.readAt !== null ? "read" : "published";
  }
  return hasBimesterContent(bimester) ? "draft" : "empty";
}

/** Application and conduct grades are required to publish a bimester. */
export function isBimesterComplete(bimester: Bimester): boolean {
  return bimester.applicationGrade !== null && bimester.conductGrade !== null;
}

export function isVisibleToParent(bimester: Bimester): boolean {
  return bimester.publishedAt !== null;
}

export function getClosingStatus(closing: Closing): ClosingStatus {
  if (closing.publishedAt !== null) return "published";
  const hasContent =
    closing.cuatrimestralExam !== null ||
    closing.result !== null ||
    closing.finalResult !== null;
  return hasContent ? "draft" : "empty";
}

/** Result and final result are required to publish the closing. */
export function isClosingComplete(closing: Closing): boolean {
  return closing.result !== null && closing.finalResult !== null;
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
  return replaceBimester(card, number, (b) => ({ ...b, ...patch }));
}

/** Makes the bimester visible to families. Published bimesters stay editable. */
export function publishBimester(
  card: ReportCard,
  number: BimesterNumber,
  now: Date,
): ReportCard {
  const current = getBimester(card, number);
  if (current.publishedAt !== null) return card;
  if (!isBimesterComplete(current)) {
    throw new DomainError(
      "bimester-incomplete",
      "Para publicar el bimestre cargue la nota de aplicación y la conducta.",
    );
  }
  return replaceBimester(card, number, (b) => ({
    ...b,
    publishedAt: now.toISOString(),
  }));
}

export function acknowledgeBimester(
  card: ReportCard,
  number: BimesterNumber,
  now: Date,
): ReportCard {
  const current = getBimester(card, number);
  if (current.publishedAt === null) {
    throw new DomainError(
      "bimester-not-published",
      "El bimestre todavía no fue publicado.",
    );
  }
  if (current.readAt !== null) return card;
  return replaceBimester(card, number, (b) => ({
    ...b,
    readAt: now.toISOString(),
  }));
}

export function updateClosing(
  card: ReportCard,
  patch: ClosingPatch,
  gradingType: GradingType,
): ReportCard {
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

/** Makes the closing visible to families. It stays editable afterwards. */
export function publishClosing(card: ReportCard, now: Date): ReportCard {
  if (card.closing.publishedAt !== null) return card;
  if (!isClosingComplete(card.closing)) {
    throw new DomainError(
      "closing-incomplete",
      "Para publicar el cierre cargue el resultado y la situación final.",
    );
  }
  return {
    ...card,
    closing: { ...card.closing, publishedAt: now.toISOString() },
  };
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
 * only published bimesters and a published closing.
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
    closing: card.closing.publishedAt !== null ? card.closing : null,
  };
}
