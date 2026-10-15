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
import { cn } from "@/lib/utils";
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
  return <span className="text-xs italic text-muted-foreground">{text}</span>;
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
    <article className="print-sheet rounded-2xl border bg-card p-4 shadow-sm sm:p-8">
      {/* Letterhead */}
      <header className="flex flex-col items-center gap-3 border-b-2 border-gold pb-5 text-center sm:flex-row sm:text-left">
        <Crest className="h-16" />
        <div className="flex-1">
          <p className="font-heading text-xl font-semibold text-navy sm:text-2xl">
            Instituto Inmaculada Concepción
          </p>
          <p className="text-xs tracking-[0.2em] text-celeste-strong uppercase">
            Instituto de Inglés
          </p>
        </div>
        <div className="sm:text-right">
          <p className="font-heading text-lg text-navy">Boletín de calificaciones</p>
          <p className="text-sm text-muted-foreground">Ciclo lectivo {year}</p>
        </div>
      </header>

      {/* Student data */}
      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 py-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-xs text-muted-foreground">Alumno/a</dt>
          <dd className="font-semibold text-navy">{fullName(student)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Curso</dt>
          <dd className="font-semibold text-navy">{course.name}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Docente</dt>
          <dd className="font-semibold text-navy">{teacherNames.join(", ") || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Calificación</dt>
          <dd className="font-semibold text-navy">{gradingTypeLabel(course.gradingType)}</dd>
        </div>
      </dl>

      {/* Grades table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <caption className="sr-only">Calificaciones por bimestre</caption>
          <thead>
            <tr className="bg-navy text-white">
              <th scope="col" className="px-3 py-2 text-left font-medium">
                Concepto
              </th>
              {bimesters.map((b) => (
                <th key={b.number} scope="col" className="px-3 py-2 text-center font-medium">
                  {bimesterLabel(b.number)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.label} className={cn(i % 2 === 1 && "bg-muted/60")}>
                <th scope="row" className="px-3 py-2.5 text-left font-medium text-navy">
                  {row.label}
                </th>
                {bimesters.map((b) => (
                  <td key={b.number} className="px-3 py-2.5 text-center">
                    {b.visible && b.data ? row.render(b.data) : <Hidden text={hiddenText} />}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Observations and signatures */}
      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold">Observaciones y firmas</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {bimesters.map((b) => (
            <div
              key={b.number}
              className="flex flex-col gap-3 rounded-xl border p-4 break-inside-avoid"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold">{bimesterLabel(b.number)}</h3>
                {renderBimesterBadge?.(b)}
              </div>
              {b.visible && b.data ? (
                <>
                  <p className="text-sm leading-relaxed text-foreground">
                    {b.data.observation || (
                      <span className="text-muted-foreground">Sin observaciones.</span>
                    )}
                  </p>
                  <div className="grid grid-cols-1 gap-2 border-t pt-3 sm:grid-cols-3">
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
          ))}
        </div>
      </section>

      {/* Closing */}
      <section className="mt-6 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border p-4 break-inside-avoid">
          <h2 className="text-base font-semibold">Examen cuatrimestral</h2>
          <p className="mt-1 text-xs text-muted-foreground">Rendido luego del 2° bimestre</p>
          <p className="mt-3 font-heading text-3xl text-navy">
            {cuatrimestralExam === null ? (
              <Hidden text={hiddenText} />
            ) : (
              <GradeText value={cuatrimestralExam} />
            )}
          </p>
        </div>
        <div className="rounded-xl border p-4 break-inside-avoid md:col-span-2">
          <h2 className="text-base font-semibold">Cierre del ciclo lectivo</h2>
          {closing ? (
            <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Resultado</dt>
                <dd className="font-semibold text-navy">{closing.result ?? "—"}</dd>
              </div>
              {closing.result === "Va a examen final" && (
                <div>
                  <dt className="text-xs text-muted-foreground">Examen final</dt>
                  <dd className="font-semibold text-navy">
                    {closing.finalExam?.modality ?? "Modalidad a definir"} ·{" "}
                    <GradeText value={closing.finalExam?.grade ?? null} />
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-muted-foreground">Situación final</dt>
                <dd className="font-semibold text-navy">
                  {formatFinalResult(closing.finalResult)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Firma de Dirección</dt>
                <dd className="font-semibold text-navy">
                  {closing.directorSignature.signed
                    ? formatDateTime(closing.directorSignature.at)
                    : "Pendiente"}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              El cierre se publicará al finalizar el ciclo lectivo, con la firma de
              Dirección.
            </p>
          )}
          {closingActions && <div className="mt-4 print:hidden">{closingActions}</div>}
        </div>
      </section>

      <p className="mt-6 hidden text-center text-[10px] text-muted-foreground print:block">
        Documento generado desde el boletín en línea del Instituto Inmaculada Concepción.
      </p>
    </article>
  );
}
