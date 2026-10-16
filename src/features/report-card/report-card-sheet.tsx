import type { ReactNode } from "react";
import { Crest } from "@/components/brand/crest";
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
import { SignatureLine } from "./signature-line";

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
  /** Text shown for hidden (not yet approved) data. */
  hiddenText?: string;
  renderBimesterActions?: (bimester: SheetBimester) => ReactNode;
  renderBimesterBadge?: (bimester: SheetBimester) => ReactNode;
  closingActions?: ReactNode;
}

function Hidden({ text }: { text: string }) {
  return <span className="text-xs text-slate-400">{text}</span>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium text-foreground">{children}</dd>
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
      {children}
    </h2>
  );
}

/**
 * Presentational component: the report card laid out like the printed
 * "boletín". Used by parents (read-only) and by the director.
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
  renderBimesterActions,
  renderBimesterBadge,
  closingActions,
}: ReportCardSheetProps) {
  const rows: { label: string; render: (b: Bimester) => ReactNode }[] = [
    { label: "Nota de aplicación", render: (b) => <GradeText value={b.applicationGrade} /> },
    { label: "Conducta", render: (b) => <GradeText value={b.conductGrade} /> },
    { label: "Inasistencias", render: (b) => b.absences },
  ];

  return (
    <article className="print-sheet rounded-lg border bg-card p-5 shadow-xs sm:p-8">
      {/* Letterhead */}
      <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Crest className="h-9 text-foreground" />
          <div className="leading-tight">
            <p className="font-semibold text-foreground">Instituto Inmaculada Concepción</p>
            <p className="text-sm text-muted-foreground">Instituto de Inglés</p>
          </div>
        </div>
        <div className="sm:text-right">
          <p className="font-semibold text-foreground">Boletín de calificaciones</p>
          <p className="text-sm text-muted-foreground">Ciclo lectivo {year}</p>
        </div>
      </header>

      {/* Student data */}
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 py-6 text-sm lg:grid-cols-4">
        <Field label="Alumno/a">{fullName(student)}</Field>
        <Field label="Curso">{course.name}</Field>
        <Field label="Docente">{teacherNames.join(", ") || "—"}</Field>
        <Field label="Calificación">{gradingTypeLabel(course.gradingType)}</Field>
      </dl>

      {/* Grades table */}
      <section>
        <SectionTitle>Calificaciones</SectionTitle>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <caption className="sr-only">Calificaciones por bimestre</caption>
            <thead className="bg-slate-50">
              <tr className="border-b">
                <th
                  scope="col"
                  className="px-4 py-2.5 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase"
                >
                  Concepto
                </th>
                {bimesters.map((b) => (
                  <th
                    key={b.number}
                    scope="col"
                    className="px-4 py-2.5 text-center text-xs font-medium tracking-wide text-muted-foreground uppercase"
                  >
                    {bimesterLabel(b.number)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b last:border-b-0">
                  <th scope="row" className="px-4 py-3 text-left font-medium text-foreground">
                    {row.label}
                  </th>
                  {bimesters.map((b) => (
                    <td key={b.number} className="px-4 py-3 text-center tabular-nums">
                      {b.visible && b.data ? row.render(b.data) : <Hidden text={hiddenText} />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Observations and signatures */}
      <section className="mt-8">
        <SectionTitle>Observaciones y firmas</SectionTitle>
        <div className="divide-y rounded-lg border">
          {bimesters.map((b) => (
            <div
              key={b.number}
              className="grid gap-3 p-4 break-inside-avoid md:grid-cols-[11rem_1fr] md:gap-6"
            >
              <div className="flex items-center justify-between gap-2 md:flex-col md:items-start md:justify-start">
                <h3 className="text-sm font-semibold">{bimesterLabel(b.number)}</h3>
                {renderBimesterBadge?.(b)}
              </div>
              <div className="flex min-w-0 flex-col gap-3">
                {b.visible && b.data ? (
                  <>
                    <p className="text-sm leading-relaxed text-slate-700">
                      {b.data.observation || (
                        <span className="text-muted-foreground">Sin observaciones.</span>
                      )}
                    </p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <SignatureLine label="Docente" signature={b.data.signatures.teacher} />
                      <SignatureLine label="Dirección" signature={b.data.signatures.director} />
                      <SignatureLine
                        label="Familia · Leído / Notificado"
                        signature={b.data.signatures.parent}
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Las calificaciones de este bimestre estarán disponibles cuando
                    Dirección las apruebe.
                  </p>
                )}
                {renderBimesterActions && (
                  <div className="print:hidden">{renderBimesterActions(b)}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Closing */}
      <section className="mt-8">
        <SectionTitle>Cierre del ciclo lectivo</SectionTitle>
        <div className="grid divide-y rounded-lg border md:grid-cols-3 md:divide-x md:divide-y-0">
          <div className="p-4 break-inside-avoid">
            <p className="text-sm font-semibold">Examen cuatrimestral</p>
            <p className="text-xs text-muted-foreground">Rendido luego del 2° bimestre</p>
            <p className="mt-3 text-2xl font-semibold tabular-nums">
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
              <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <Field label="Resultado">{closing.result ?? "—"}</Field>
                {closing.result === "Va a examen final" && (
                  <Field label="Examen final">
                    {closing.finalExam?.modality ?? "Modalidad a definir"} ·{" "}
                    <GradeText value={closing.finalExam?.grade ?? null} />
                  </Field>
                )}
                <Field label="Situación final">{formatFinalResult(closing.finalResult)}</Field>
                <Field label="Firma de Dirección">
                  {closing.directorSignature.signed
                    ? formatDateTime(closing.directorSignature.at)
                    : "Pendiente"}
                </Field>
              </dl>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                El cierre se publicará al finalizar el ciclo lectivo, con la firma de
                Dirección.
              </p>
            )}
            {closingActions && <div className="mt-4 print:hidden">{closingActions}</div>}
          </div>
        </div>
      </section>

      <p className="mt-6 hidden text-center text-[10px] text-muted-foreground print:block">
        Documento generado desde el boletín en línea del Instituto Inmaculada Concepción.
      </p>
    </article>
  );
}
