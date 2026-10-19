"use client";

import type { KeyboardEvent, ReactNode } from "react";
import type { GradeSheetRow } from "@/application/grade-sheet";
import type { Course } from "@/domain/course";
import { CONCEPTUAL_SCALE } from "@/domain/grading";
import {
  CLOSING_RESULTS,
  FINAL_EXAM_MODALITIES,
  getBimester,
  getBimesterStatus,
  getClosingStatus,
  type ReportPeriod,
} from "@/domain/report-card";
import { fullName } from "@/domain/student";
import { StatusBadge } from "@/components/ui/status-badge";
import { BimesterStatusBadge } from "@/features/report-card/bimester-status-badge";
import { periodLabel } from "@/features/report-card/period";
import { cn } from "@/lib/utils";
import { ObservationCell, ReadOnlyValue, SelectCell, TextCell } from "./cells";
import type { BimesterRowValues, ClosingRowValues, RowErrors } from "./sheet-model";
import type { SheetRowView } from "./use-sheet-drafts";

/*
 * Course grade sheet table shared by the teacher and Dirección panels.
 * Read-only mode shows the stored values; edit mode renders spreadsheet cells.
 */

const CONCEPT_OPTIONS = CONCEPTUAL_SCALE.map((g) => ({ value: g, label: g }));
const RESULT_OPTIONS = CLOSING_RESULTS.map((r) => ({ value: r, label: r }));
const MODALITY_OPTIONS = FINAL_EXAM_MODALITIES.map((m) => ({ value: m, label: m }));
const TO_FINAL = "Va a examen final";

function finalResultOptions(course: Course) {
  return [
    { value: "promoted", label: `Promovido a ${course.nextCourseName}` },
    { value: "march", label: "Debe rendir en marzo" },
  ];
}

export function GradeSheetTable({
  course,
  period,
  view,
  editable,
  lockRow,
  pendingIds,
  onCellChange,
  renderName,
  renderActions,
}: {
  course: Course;
  period: ReportPeriod;
  view: SheetRowView[];
  editable: boolean;
  /** Rows that stay read-only while the sheet is editable. */
  lockRow?: (row: GradeSheetRow, period: ReportPeriod) => boolean;
  /** Students in a batch waiting for Dirección's approval. */
  pendingIds?: readonly string[];
  onCellChange: (studentId: string, field: string, value: string) => void;
  /** Custom content for the student cell (e.g. a link to the report card). */
  renderName?: (row: GradeSheetRow, name: ReactNode) => ReactNode;
  /** Optional trailing column with row actions. */
  renderActions?: (row: GradeSheetRow) => ReactNode;
}) {
  /** Spreadsheet navigation: Enter / arrows move between rows. */
  function handleKeyDown(e: KeyboardEvent<HTMLTableElement>) {
    const target = e.target as HTMLElement;
    const cell = target.dataset.cell;
    if (!cell) return;
    const isText = target instanceof HTMLInputElement;
    let delta = 0;
    if (e.key === "Enter") delta = e.shiftKey ? -1 : 1;
    else if (isText && e.key === "ArrowDown") delta = 1;
    else if (isText && e.key === "ArrowUp") delta = -1;
    if (delta === 0) return;
    const [r, c] = cell.split(":").map(Number);
    let next = r + delta;
    // Skip disabled cells (e.g. final exam when not needed).
    while (next >= 0 && next < view.length) {
      const el = e.currentTarget.querySelector<HTMLElement>(`[data-cell="${next}:${c}"]`);
      if (el && !(el as HTMLInputElement).disabled) {
        e.preventDefault();
        el.focus();
        return;
      }
      next += delta;
    }
  }

  const rows = view.map(({ row, values, errors, dirty }, index) => {
    const name = fullName(row.student);
    const nameNode = <StudentName name={name} dirty={dirty} />;
    const onChange = (field: string, value: string) => onCellChange(row.student.id, field, value);
    const rowEditable = editable && !lockRow?.(row, period);
    const cellProps = { index, course, name, errors, editable: rowEditable, onChange };
    const fields =
      period === "closing"
        ? closingFields({ ...cellProps, values: values as ClosingRowValues })
        : bimesterFields({ ...cellProps, values: values as BimesterRowValues });
    const status = pendingIds?.includes(row.student.id) ? (
      <StatusBadge tone="info" dot>
        En revisión
      </StatusBadge>
    ) : (
      <BimesterStatusBadge
        status={
          period === "closing"
            ? getClosingStatus(row.card.closing)
            : getBimesterStatus(getBimester(row.card, period))
        }
      />
    );
    return {
      row,
      dirty,
      editable: rowEditable,
      name: renderName ? renderName(row, nameNode) : nameNode,
      fields,
      status,
    };
  });

  return (
    <>
      {/* Phones and small tablets: one card per student, no sideways scroll. */}
      <ul className="divide-y divide-border md:hidden" aria-label={`Calificaciones de ${course.name}, ${periodLabel(period)}`}>
        {rows.map(({ row, dirty, editable: rowEditable, name, fields, status }) => (
          <li
            key={row.student.id}
            className={cn("px-4 py-3.5", dirty && "shadow-[inset_3px_0_0_var(--color-primary)]")}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">{name}</div>
              <div className="flex shrink-0 items-center gap-2">
                {status}
                {renderActions?.(row)}
              </div>
            </div>
            <dl
              className={cn(
                "mt-2.5 flex flex-col rounded-lg bg-primary-tint/70 px-3",
                rowEditable ? "gap-2 py-2.5" : "gap-1 py-2",
              )}
            >
              {fields.map((f) => (
                <div
                  key={f.key}
                  className={cn(
                    "flex items-center justify-between gap-3",
                    rowEditable ? "min-h-8" : "min-h-6",
                  )}
                >
                  <dt className="text-xs text-muted-foreground">{f.label}</dt>
                  <dd className="flex min-w-0 justify-end text-right">{f.node}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>

      {/* From md: the spreadsheet. */}
      <table
        className="hidden w-full border-separate border-spacing-0 text-sm md:table"
        onKeyDown={editable ? handleKeyDown : undefined}
      >
        <caption className="sr-only">
          Calificaciones de {course.name}, {periodLabel(period)}
        </caption>
        <thead>
          <tr>
            <Th sticky className="min-w-56 text-left">
              Alumno
            </Th>
            {period === "closing" ? (
              <>
                <Th>Ex. cuatrim.</Th>
                <Th>Resultado</Th>
                <Th>Examen final</Th>
                <Th>Resultado final</Th>
              </>
            ) : (
              <>
                <Th className="w-32">Aplicación</Th>
                <Th className="w-40">Conducta</Th>
                <Th className="w-20">Obs.</Th>
              </>
            )}
            <Th className={cn("text-left", !renderActions && "pr-4")}>Estado</Th>
            {renderActions && (
              <Th className="pr-4">
                <span className="sr-only">Acciones</span>
              </Th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ row, dirty, name, fields, status }) => (
            <tr key={row.student.id} className="group">
              <Td
                sticky
                className={cn("pl-4 text-left", dirty && "shadow-[inset_2px_0_0_var(--color-primary)]")}
              >
                {name}
              </Td>
              {fields.map((f) => (
                <Td key={f.key}>{f.node}</Td>
              ))}
              <Td className={cn("text-left", !renderActions && "pr-4")}>{status}</Td>
              {renderActions && <Td className="pr-4 text-right">{renderActions(row)}</Td>}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

/* ------------------------------------------------------------------------- */

interface CellsProps<V> {
  index: number;
  course: Course;
  name: string;
  values: V;
  errors: RowErrors;
  editable: boolean;
  onChange: (field: string, value: string) => void;
}

/** One grade field of a row: a table cell on desktop, a labeled line on phones. */
interface SheetField {
  key: string;
  label: string;
  node: ReactNode;
}

function bimesterFields({
  index,
  course,
  name,
  values,
  errors,
  editable,
  onChange,
}: CellsProps<BimesterRowValues>): SheetField[] {
  if (!editable) {
    return [
      { key: "application", label: "Aplicación", node: <ReadOnlyValue value={values.application} hintLow /> },
      { key: "conduct", label: "Conducta", node: <ReadOnlyValue value={values.conduct} /> },
      {
        key: "observation",
        label: "Observación",
        node: (
          <div className="flex justify-center">
            <ObservationCell
              cell={`${index}:2`}
              studentName={name}
              value={values.observation}
              readOnly
            />
          </div>
        ),
      },
    ];
  }
  return [
    {
      key: "application",
      label: "Aplicación",
      node:
        course.gradingType === "numeric" ? (
          <TextCell
            cell={`${index}:0`}
            inputMode="decimal"
            placeholder="—"
            aria-label={`Aplicación de ${name}`}
            value={values.application}
            onValueChange={(v) => onChange("application", v)}
            invalid={errors.application}
            hintLow
            className="mx-auto w-16"
          />
        ) : (
          <SelectCell
            cell={`${index}:0`}
            aria-label={`Aplicación de ${name}`}
            value={values.application}
            onValueChange={(v) => onChange("application", v)}
            options={CONCEPT_OPTIONS}
            hintLow
            className="w-36"
          />
        ),
    },
    {
      key: "conduct",
      label: "Conducta",
      node: (
        <SelectCell
          cell={`${index}:1`}
          aria-label={`Conducta de ${name}`}
          value={values.conduct}
          onValueChange={(v) => onChange("conduct", v)}
          options={CONCEPT_OPTIONS}
          className="w-36"
        />
      ),
    },
    {
      key: "observation",
      label: "Observación",
      node: (
        <div className="flex justify-center">
          <ObservationCell
            cell={`${index}:2`}
            studentName={name}
            value={values.observation}
            onValueChange={(v) => onChange("observation", v)}
          />
        </div>
      ),
    },
  ];
}

function closingFields({
  index,
  course,
  name,
  values,
  errors,
  editable,
  onChange,
}: CellsProps<ClosingRowValues>): SheetField[] {
  const toFinal = values.result === TO_FINAL;
  const finalOptions = finalResultOptions(course);

  if (!editable) {
    const finalLabel = finalOptions.find((o) => o.value === values.finalResult)?.label ?? "";
    return [
      {
        key: "cuatrimestral",
        label: "Ex. cuatrimestral",
        node: <ReadOnlyValue value={values.cuatrimestral} hintLow />,
      },
      { key: "result", label: "Resultado", node: <ReadOnlyValue value={values.result} /> },
      {
        key: "final",
        label: "Examen final",
        node: toFinal ? (
          <span className="inline-flex items-center gap-1.5">
            <ReadOnlyValue value={values.modality} />
            <span className="text-muted-foreground" aria-hidden>
              ·
            </span>
            <ReadOnlyValue value={values.finalGrade} hintLow />
          </span>
        ) : (
          <ReadOnlyValue value="" />
        ),
      },
      { key: "finalResult", label: "Resultado final", node: <ReadOnlyValue value={finalLabel} /> },
    ];
  }

  const gradeCell = (
    cell: string,
    field: "cuatrimestral" | "finalGrade",
    label: string,
    disabled = false,
  ) =>
    course.gradingType === "numeric" ? (
      <TextCell
        cell={cell}
        inputMode="decimal"
        placeholder="—"
        aria-label={label}
        value={values[field]}
        onValueChange={(v) => onChange(field, v)}
        invalid={errors[field]}
        hintLow
        disabled={disabled}
        className="w-16"
      />
    ) : (
      <SelectCell
        cell={cell}
        aria-label={label}
        value={values[field]}
        onValueChange={(v) => onChange(field, v)}
        options={CONCEPT_OPTIONS}
        hintLow
        disabled={disabled}
        className="w-32"
      />
    );

  return [
    {
      key: "cuatrimestral",
      label: "Ex. cuatrimestral",
      node: (
        <div className="flex justify-center">
          {gradeCell(`${index}:0`, "cuatrimestral", `Examen cuatrimestral de ${name}`)}
        </div>
      ),
    },
    {
      key: "result",
      label: "Resultado",
      node: (
        <SelectCell
          cell={`${index}:1`}
          aria-label={`Resultado de ${name}`}
          value={values.result}
          onValueChange={(v) => onChange("result", v)}
          options={RESULT_OPTIONS}
          className="w-40"
        />
      ),
    },
    {
      key: "final",
      label: "Examen final",
      node: (
        <div className={cn("flex flex-wrap items-center justify-end gap-2 md:flex-nowrap md:justify-start", !toFinal && "opacity-60")}>
          <SelectCell
            cell={`${index}:2`}
            aria-label={`Modalidad del examen final de ${name}`}
            value={values.modality}
            onValueChange={(v) => onChange("modality", v)}
            options={MODALITY_OPTIONS}
            placeholder="Modalidad"
            disabled={!toFinal}
            className="w-[6.5rem]"
          />
          {gradeCell(`${index}:3`, "finalGrade", `Nota del examen final de ${name}`, !toFinal)}
        </div>
      ),
    },
    {
      key: "finalResult",
      label: "Resultado final",
      node: (
        <SelectCell
          cell={`${index}:4`}
          aria-label={`Resultado final de ${name}`}
          value={values.finalResult}
          onValueChange={(v) => onChange("finalResult", v)}
          options={finalOptions}
          className="w-40 md:w-48"
        />
      ),
    },
  ];
}

/* ------------------------------------------------------------------------- */

function Th({
  children,
  className,
  sticky = false,
}: {
  children: ReactNode;
  className?: string;
  sticky?: boolean;
}) {
  return (
    <th
      scope="col"
      className={cn(
        "sticky top-0 z-20 h-9 border-b border-border bg-primary-tint px-3 text-center text-[11px] font-semibold tracking-[0.05em] whitespace-nowrap text-navy/75 uppercase",
        sticky && "left-0 z-30 pl-4 shadow-[1px_0_0_var(--color-border)]",
        className,
      )}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className,
  sticky = false,
}: {
  children: ReactNode;
  className?: string;
  sticky?: boolean;
}) {
  return (
    <td
      className={cn(
        "h-11 border-b border-slate-100 px-3 py-1.5 text-center whitespace-nowrap transition-colors duration-150 group-last:border-b-0 group-hover:bg-primary-tint/70",
        sticky &&
          "sticky left-0 z-10 bg-card shadow-[1px_0_0_var(--color-border)] group-hover:bg-primary-tint",
        className,
      )}
    >
      {children}
    </td>
  );
}

function StudentName({ name, dirty }: { name: string; dirty: boolean }) {
  const [last, first] = name.split(", ");
  return (
    <span className="flex items-center gap-2.5">
      <span className="hidden size-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[11px] font-semibold text-primary-strong sm:flex">
        {first?.[0]}
        {last?.[0]}
      </span>
      <span className="block truncate text-[13.5px]">
        <span className="font-medium text-foreground">{last}</span>
        <span className="text-muted-foreground">, {first}</span>
      </span>
      {dirty && <span className="sr-only">(con cambios sin guardar)</span>}
    </span>
  );
}

/** Low-grade legend shown above the sheet. */
export function LowGradeHint() {
  return (
    <p className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="size-3 rounded-[3px] border border-danger-border bg-danger-soft" aria-hidden />
      Menor a 6: solo referencia, la decisión es del docente
    </p>
  );
}
