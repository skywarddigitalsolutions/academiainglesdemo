import type { ReactNode } from "react";
import { CheckCheck, Clock } from "lucide-react";
import { LogoCrest } from "@/components/brand/logo";
import { gradingTypeLabel, type Course } from "@/domain/course";
import type { GradeValue } from "@/domain/grading";
import {
  formatFinalResult,
  type Bimester,
  type BimesterNumber,
  type Closing,
} from "@/domain/report-card";
import { fullName, type Student } from "@/domain/student";
import { bimesterLabel, formatDateTime } from "@/lib/format";
import { GradeText } from "./grade-text";

export interface SheetBimester {
  number: BimesterNumber;
  visible: boolean;
  data: Bimester | null;
}

interface ReportCardSheetProps {
  student: Student;
  course: Course;
  teacherNames: string[];
  year: number;
  bimesters: SheetBimester[];
  cuatrimestralExam: GradeValue | null;
  closing: Closing | null;
  /** Text shown for hidden (not yet published) data. */
  hiddenText?: string;
  /** Explains why a bimester is hidden. */
  hiddenDescription?: string;
  renderBimesterBadge?: (bimester: SheetBimester) => ReactNode;
  /** Families do not see the grading scale name. */
  showGradingType?: boolean;
}

function Hidden({ text }: { text: string }) {
  return (
    <span className="text-xs font-normal text-muted-foreground">
      <span aria-hidden className="sm:hidden">—</span>
      <span className="sr-only sm:not-sr-only">{text}</span>
    </span>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium tracking-[0.04em] text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-1 truncate text-sm font-medium text-foreground">{children}</dd>
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-3 text-[11px] font-semibold tracking-[0.08em] text-navy/80 uppercase">
      {children}
    </h2>
  );
}

/**
 * Presentational component: the report card laid out like the printed
 * "boletín". Used by families (read-only) and by Dirección.
 */
export function ReportCardSheet({
  student,
  course,
  teacherNames,
  year,
  bimesters,
  cuatrimestralExam,
  closing,
  hiddenText = "Pendiente",
  hiddenDescription = "Las calificaciones de este bimestre estarán disponibles cuando el instituto las publique.",
  renderBimesterBadge,
  showGradingType = true,
}: ReportCardSheetProps) {
  const rows: { label: string; render: (b: Bimester) => ReactNode }[] = [
    { label: "Nota de aplicación", render: (b) => <GradeText value={b.applicationGrade} /> },
    { label: "Conducta", render: (b) => <GradeText value={b.conductGrade} /> },
    { label: "Inasistencias", render: (b) => b.absences },
  ];

  return (
    <article className="print-sheet surface-card overflow-hidden">
      {/* Letterhead */}
      <header className="relative flex flex-col gap-4 border-b border-border px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-center gap-3.5">
          <LogoCrest decorative className="h-14 shrink-0" />
          <div className="leading-tight">
            <p className="font-semibold tracking-[-0.01em] text-foreground">
              Instituto Inmaculada Concepción
            </p>
            <p className="text-sm text-muted-foreground">Instituto de Inglés</p>
          </div>
        </div>
        <div className="sm:text-right">
          <p className="font-serif text-lg font-semibold text-navy">Boletín de calificaciones</p>
          <p className="text-sm text-muted-foreground tabular-nums">Ciclo lectivo {year}</p>
        </div>
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-[-1px] h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent"
        />
      </header>

      <div className="px-5 py-6 sm:px-8 sm:py-8">
        {/* Student data */}
        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 rounded-lg bg-primary-tint p-4 ring-1 ring-primary/10 ring-inset lg:grid-cols-4">
          <Field label="Alumno/a">{fullName(student)}</Field>
          <Field label="Curso">{course.name}</Field>
          <Field label="Docente">{teacherNames.join(", ") || "—"}</Field>
          {showGradingType && (
            <Field label="Calificación">{gradingTypeLabel(course.gradingType)}</Field>
          )}
        </dl>

        {/* Grades table */}
        <section className="mt-8">
          <SectionTitle>Calificaciones</SectionTitle>
          <div className="relative overflow-x-auto rounded-lg border border-border">
            <table className="w-full border-collapse text-sm sm:min-w-[520px]">
              <caption className="sr-only">Calificaciones por bimestre</caption>
              <thead className="bg-primary-tint">
                <tr className="border-b border-border">
                  <th
                    scope="col"
                    className="h-9 bg-primary-tint px-3 text-left text-[11px] font-medium tracking-[0.04em] text-navy/75 uppercase sm:px-4"
                  >
                    Concepto
                  </th>
                  {bimesters.map((b) => (
                    <th
                      key={b.number}
                      scope="col"
                      className="h-9 px-1 text-center text-[11px] font-medium tracking-[0.04em] text-navy/75 uppercase sm:px-4"
                    >
                      <span aria-hidden className="sm:hidden">{b.number}° B.</span>
                      <span className="sr-only sm:not-sr-only">{bimesterLabel(b.number)}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label} className="border-b border-border last:border-b-0">
                    <th
                      scope="row"
                      className="bg-card px-2.5 py-3 text-left text-[13px] leading-snug font-medium text-foreground/80 sm:px-4 sm:text-sm"
                    >
                      {row.label}
                    </th>
                    {bimesters.map((b) => (
                      <td
                        key={b.number}
                        className="px-1 py-3 text-center text-[13px] font-medium break-words text-foreground tabular-nums sm:px-4 sm:text-sm"
                      >
                        {b.visible && b.data ? row.render(b.data) : <Hidden text={hiddenText} />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Observations */}
        <section className="mt-8">
          <SectionTitle>Observaciones</SectionTitle>
          <div className="divide-y divide-border rounded-lg border border-border">
            {bimesters.map((b) => (
              <div
                key={b.number}
                className="grid gap-3 p-4 break-inside-avoid md:grid-cols-[10rem_1fr] md:gap-6"
              >
                <div className="flex items-center justify-between gap-2 md:flex-col md:items-start md:justify-start">
                  <h3 className="text-sm font-semibold">{bimesterLabel(b.number)}</h3>
                  {renderBimesterBadge?.(b)}
                </div>
                <div className="flex min-w-0 flex-col gap-3">
                  {b.visible && b.data ? (
                    <>
                      <p className="text-sm leading-relaxed text-foreground/85">
                        {b.data.observation || (
                          <span className="text-muted-foreground">Sin observaciones.</span>
                        )}
                      </p>
                      <PublicationMeta bimester={b.data} />
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">{hiddenDescription}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Closing */}
        <section className="mt-8">
          <SectionTitle>Cierre del ciclo lectivo</SectionTitle>
          <div className="grid divide-y divide-border rounded-lg border border-border md:grid-cols-3 md:divide-x md:divide-y-0">
            <div className="p-4 break-inside-avoid">
              <p className="text-sm font-semibold">Examen cuatrimestral</p>
              <p className="text-xs text-muted-foreground">Rendido luego del 2° bimestre</p>
              <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">
                {cuatrimestralExam === null ? (
                  <Hidden text={hiddenText} />
                ) : (
                  <GradeText value={cuatrimestralExam} />
                )}
              </p>
            </div>
            <div className="p-4 break-inside-avoid md:col-span-2">
              <p className="text-sm font-semibold">Resultado final</p>
              {closing ? (
                <dl className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Resultado">{closing.result ?? "—"}</Field>
                  {closing.result === "Va a examen final" && (
                    <Field label="Examen final">
                      {closing.finalExam?.modality ?? "Modalidad a definir"} ·{" "}
                      <GradeText value={closing.finalExam?.grade ?? null} />
                    </Field>
                  )}
                  <Field label="Situación final">{formatFinalResult(closing.finalResult)}</Field>
                </dl>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  El resultado final se publicará al terminar el ciclo lectivo.
                </p>
              )}
            </div>
          </div>
        </section>

        <p className="mt-6 hidden text-center text-[10px] text-muted-foreground print:block">
          Documento generado desde el boletín digital del Instituto Inmaculada Concepción.
        </p>
      </div>
    </article>
  );
}

function PublicationMeta({ bimester }: { bimester: Bimester }) {
  if (!bimester.publishedAt) return null;
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <Clock className="size-3.5" aria-hidden />
        Publicado el {formatDateTime(bimester.publishedAt)}
      </span>
      {bimester.readAt && (
        <span className="inline-flex items-center gap-1.5 text-success">
          <CheckCheck className="size-3.5" aria-hidden />
          Leído por la familia el {formatDateTime(bimester.readAt)}
        </span>
      )}
    </p>
  );
}
