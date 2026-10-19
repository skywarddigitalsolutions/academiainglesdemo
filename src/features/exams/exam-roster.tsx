import { Check, CircleDashed, TriangleAlert, X } from "lucide-react";
import { CONCEPTUAL_SCALE, type GradingType } from "@/domain/grading";
import { fullName, type Student } from "@/domain/student";
import { ReadOnlyValue, SelectCell, TextCell } from "@/features/grade-sheet/cells";
import { cn } from "@/lib/utils";
import { rowState, type RowState } from "./exam-detail-model";

const CONCEPTUAL_OPTIONS = CONCEPTUAL_SCALE.map((g) => ({ value: g, label: g }));

const PILLS: Record<RowState, { label: string; icon: typeof Check; className: string }> = {
  pass: { label: "Aprobado", icon: Check, className: "border-success-border bg-success-soft text-success" },
  fail: { label: "Desaprobado", icon: X, className: "border-danger-border bg-danger-soft text-danger" },
  empty: { label: "Sin nota", icon: CircleDashed, className: "border-slate-200 bg-slate-50 text-slate-600" },
  invalid: {
    label: "Nota inválida",
    icon: TriangleAlert,
    className: "border-danger-border bg-danger-soft text-danger",
  },
};

function StatePill({ state }: { state: RowState }) {
  const { label, icon: Icon, className } = PILLS[state];
  return (
    <span
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-[15px] font-medium whitespace-nowrap",
        className,
      )}
    >
      <Icon className="size-4" aria-hidden />
      {label}
    </span>
  );
}

function initials(student: Student): string {
  return `${student.firstName.charAt(0)}${student.lastName.charAt(0)}`.toUpperCase();
}

const GRID = "grid-cols-[2rem_minmax(0,1fr)] md:grid-cols-[3rem_minmax(0,1fr)_10rem_12rem]";

/** Students who will sit the exam (upcoming): names only, no grade column. */
export function UpcomingRoster({ students }: { students: Student[] }) {
  return (
    <section aria-label="Alumnos que rinden" className="surface-card overflow-hidden">
      <h2 className="border-b border-border px-5 py-3 text-base font-semibold text-navy">
        Alumnos que rinden ({students.length})
      </h2>
      <ol className="divide-y divide-border">
        {students.map((s, i) => (
          <li key={s.id} className="flex items-center gap-3 px-5 py-3 text-base">
            <span className="w-6 text-muted-foreground tabular-nums">{i + 1}</span>
            <span className="font-medium">{fullName(s)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export interface RosterProps {
  students: Student[];
  texts: Record<string, string>;
  gradingType: GradingType;
  /** Present only when grades can be edited. */
  onTextChange?: (studentId: string, text: string) => void;
  /** Students whose text differs from the saved grade. */
  unsaved: ReadonlySet<string>;
}

/** Roster with grade and live state per student; editable or read-only. */
export function ExamRoster({ students, texts, gradingType, onTextChange, unsaved }: RosterProps) {
  const numeric = gradingType === "numeric";

  function focusNext(index: number) {
    document.querySelector<HTMLElement>(`[data-cell="${index + 1}:grade"]`)?.focus();
  }

  return (
    <section aria-label="Notas del examen" className="surface-card overflow-hidden">
      {onTextChange && (
        <p className="border-b border-border bg-primary-tint px-5 py-3.5 text-[15px] leading-relaxed text-navy">
          {numeric
            ? "Escriba la nota del 1 al 10. Puede usar decimales (por ejemplo 7,5). Deje vacío si el alumno estuvo ausente."
            : "Elija la valoración de cada alumno. Deje vacío si estuvo ausente."}
        </p>
      )}
      <div
        className={cn(
          "hidden gap-3 border-b border-border px-5 py-2.5 text-sm font-semibold text-muted-foreground md:grid",
          GRID,
        )}
        aria-hidden
      >
        <span>#</span>
        <span>Alumno</span>
        <span>Nota</span>
        <span>Estado</span>
      </div>
      <ol>
        {students.map((student, i) => {
          const text = texts[student.id] ?? "";
          const state = rowState(text, gradingType);
          const name = fullName(student);
          const isUnsaved = unsaved.has(student.id);
          return (
            <li
              key={student.id}
              className={cn(
                "grid items-center gap-x-3 gap-y-3 border-b border-l-4 border-b-border px-5 py-4 last:border-b-0 md:py-3",
                GRID,
                isUnsaved ? "border-l-primary" : "border-l-transparent",
                (state === "fail" || state === "invalid") && "bg-danger-soft/60",
              )}
            >
              <span className="text-base text-muted-foreground tabular-nums">{i + 1}</span>
              <span className="flex min-w-0 items-center gap-3">
                <span
                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary-strong"
                  aria-hidden
                >
                  {initials(student)}
                </span>
                <span className="text-base font-medium break-words">{name}</span>
                {isUnsaved && <span className="sr-only">Cambio sin guardar</span>}
              </span>
              <div className="col-span-2 md:col-span-1">
                {!onTextChange ? (
                  <ReadOnlyValue value={text} hintLow className="text-base font-semibold" />
                ) : numeric ? (
                  <TextCell
                    cell={`${i}:grade`}
                    value={text}
                    aria-label={`Nota de ${name}`}
                    placeholder="—"
                    inputMode="decimal"
                    invalid={state === "invalid"}
                    onValueChange={(v) => onTextChange(student.id, v)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        focusNext(i);
                      }
                    }}
                    className="h-11 w-full text-base md:w-28"
                  />
                ) : (
                  <SelectCell
                    cell={`${i}:grade`}
                    value={text}
                    aria-label={`Nota de ${name}`}
                    options={CONCEPTUAL_OPTIONS}
                    onValueChange={(v) => onTextChange(student.id, v)}
                    className="w-full md:w-44 [&_select]:h-11 [&_select]:text-base"
                  />
                )}
              </div>
              <div className="col-span-2 md:col-span-1">
                <StatePill state={state} />
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
