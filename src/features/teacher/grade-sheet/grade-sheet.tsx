"use client";

import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import { CheckCircle2, Loader2, Send, Users } from "lucide-react";
import { toast } from "sonner";
import { summarizePeriod } from "@/application/progress";
import type { GradeSheet, GradeSheetRow } from "@/application/teacher-use-cases";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { gradingTypeLabel, type Course } from "@/domain/course";
import { CONCEPTUAL_SCALE } from "@/domain/grading";
import {
  CLOSING_RESULTS,
  FINAL_EXAM_MODALITIES,
  getBimester,
  getBimesterStatus,
  getClosingStatus,
  REPORT_PERIODS,
  type ReportPeriod,
} from "@/domain/report-card";
import { fullName } from "@/domain/student";
import { BimesterStatusBadge } from "@/features/report-card/bimester-status-badge";
import {
  parsePeriodParam,
  periodLabel,
  periodParam,
  periodShortLabel,
} from "@/features/report-card/period";
import { errorMessage } from "@/lib/error-message";
import { cn } from "@/lib/utils";
import { getServices } from "@/providers/services";
import { useAsyncData } from "@/providers/use-async-data";
import { useSession } from "@/providers/session-provider";
import { ObservationCell, SelectCell, TextCell } from "./cells";
import {
  isRowComplete,
  rowValues,
  toBimesterPatch,
  toClosingPatch,
  validateRow,
  type BimesterRowValues,
  type ClosingRowValues,
  type RowErrors,
  type RowValues,
} from "./sheet-model";

const CONCEPT_OPTIONS = CONCEPTUAL_SCALE.map((g) => ({ value: g, label: g }));
const RESULT_OPTIONS = CLOSING_RESULTS.map((r) => ({ value: r, label: r }));
const MODALITY_OPTIONS = FINAL_EXAM_MODALITIES.map((m) => ({ value: m, label: m }));

type Drafts = Partial<Record<string, Record<string, Partial<RowValues>>>>;

/** First period that still has students without publishing. */
function defaultPeriod(sheet: GradeSheet): ReportPeriod {
  const cards = sheet.rows.map((r) => r.card);
  return (
    REPORT_PERIODS.find((p) => {
      const progress = summarizePeriod(cards, p);
      return progress.published < progress.total;
    }) ?? 1
  );
}

function isPublished(row: GradeSheetRow, period: ReportPeriod): boolean {
  return period === "closing"
    ? row.card.closing.publishedAt !== null
    : getBimester(row.card, period).publishedAt !== null;
}

/* ------------------------------------------------------------------------- */

/** Container: loads the course grade sheet of the current teacher. */
export function GradeSheetContainer() {
  const { courseId } = useParams<{ courseId: string }>();
  const { state } = useSession();
  const teacherId = state.session?.userId ?? "";
  const { data, error, loading, setData } = useAsyncData(
    `grade-sheet:${teacherId}:${courseId}`,
    (s) => s.teacher.getGradeSheet(teacherId, courseId),
  );

  if (loading) return <GradeSheetSkeleton />;
  if (error || !data) {
    return <ErrorState message={error ?? "Curso no encontrado."} backHref="/teacher" />;
  }
  return (
    <GradeSheetEditor key={courseId} sheet={data} teacherId={teacherId} onSheetChange={setData} />
  );
}

function GradeSheetSkeleton() {
  return (
    <div role="status">
      <span className="sr-only">Cargando planilla…</span>
      <Skeleton className="h-3 w-40" />
      <Skeleton className="mt-3 h-7 w-56" />
      <Skeleton className="mt-3 mb-8 h-4 w-80 max-w-full" />
      <LoadingState />
    </div>
  );
}

/* ------------------------------------------------------------------------- */

function GradeSheetEditor({
  sheet,
  teacherId,
  onSheetChange,
}: {
  sheet: GradeSheet;
  teacherId: string;
  onSheetChange: (sheet: GradeSheet) => void;
}) {
  const { course, rows } = sheet;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const period = parsePeriodParam(searchParams.get("periodo")) ?? defaultPeriod(sheet);
  const periodKey = String(period);

  const [drafts, setDrafts] = useState<Drafts>({});
  const [busy, setBusy] = useState<"save" | "publish" | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const periodDrafts = useMemo(() => drafts[periodKey] ?? {}, [drafts, periodKey]);
  const dirtyIds = Object.keys(periodDrafts);
  const dirty = dirtyIds.length > 0;

  const view = useMemo(
    () =>
      rows.map((row) => {
        const base = rowValues(row.card, period);
        const values = { ...base, ...(periodDrafts[row.student.id] ?? {}) } as RowValues;
        const errors = validateRow(period, values, course.gradingType);
        return { row, base, values, errors, published: isPublished(row, period) };
      }),
    [rows, period, periodDrafts, course.gradingType],
  );

  const hasErrors = view.some((v) => Object.keys(v.errors).length > 0);
  const ready = view.filter(
    (v) => !v.published && isRowComplete(period, v.values) && Object.keys(v.errors).length === 0,
  );
  const incomplete = view.filter((v) => !v.published && !isRowComplete(period, v.values));
  const progress = summarizePeriod(
    rows.map((r) => r.card),
    period,
  );
  const editingPublished = view.some((v) => v.published && dirtyIds.includes(v.row.student.id));

  // Warn before leaving the page with unsaved changes.
  const anyDirty = Object.values(drafts).some((d) => d && Object.keys(d).length > 0);
  useEffect(() => {
    if (!anyDirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [anyDirty]);

  function selectPeriod(next: ReportPeriod) {
    router.replace(`${pathname}?periodo=${periodParam(next)}`, { scroll: false });
  }

  function setCell(studentId: string, field: string, value: string) {
    const base = view.find((v) => v.row.student.id === studentId)?.base as
      | Record<string, string>
      | undefined;
    if (!base) return;
    setDrafts((current) => {
      const forPeriod = { ...(current[periodKey] ?? {}) };
      const row = { ...(forPeriod[studentId] ?? {}) } as Record<string, string>;
      if (base[field] === value) delete row[field];
      else row[field] = value;
      // Closing: leaving "Va a examen final" clears the final exam cells.
      if (field === "result" && value !== "Va a examen final") {
        for (const key of ["modality", "finalGrade"]) {
          if (base[key] === "") delete row[key];
          else row[key] = "";
        }
      }
      if (Object.keys(row).length === 0) delete forPeriod[studentId];
      else forPeriod[studentId] = row as Partial<RowValues>;
      return { ...current, [periodKey]: forPeriod };
    });
  }

  async function persistDrafts(): Promise<boolean> {
    if (!dirty) return true;
    if (hasErrors) {
      toast.error("Revise las celdas marcadas en rojo antes de guardar.");
      return false;
    }
    const changes = view
      .filter((v) => dirtyIds.includes(v.row.student.id))
      .map((v) => ({
        studentId: v.row.student.id,
        patch:
          period === "closing"
            ? toClosingPatch(v.values as ClosingRowValues, course.gradingType, course.nextCourseName)
            : toBimesterPatch(v.values as BimesterRowValues, course.gradingType),
      }));
    const updated = await getServices().teacher.saveGradeSheet(
      teacherId,
      course.id,
      period,
      changes,
    );
    onSheetChange(updated);
    setDrafts((current) => ({ ...current, [periodKey]: {} }));
    return true;
  }

  async function handleSave() {
    setBusy("save");
    try {
      const count = dirtyIds.length;
      if (await persistDrafts()) {
        toast.success("Borrador guardado", {
          description:
            count === 1 ? "Se guardaron los cambios de 1 alumno." : `Se guardaron los cambios de ${count} alumnos.`,
        });
      }
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function handlePublish() {
    setBusy("publish");
    try {
      if (!(await persistDrafts())) return;
      const services = getServices();
      const result = await services.teacher.publishGradeSheet(teacherId, course.id, period);
      onSheetChange(await services.teacher.getGradeSheet(teacherId, course.id));
      const n = result.published.length;
      toast.success(
        n === 1 ? "Se publicó 1 boletín" : `Se publicaron ${n} boletines`,
        {
          description:
            result.incomplete.length > 0
              ? `${periodLabel(period)}. ${result.incomplete.length} quedaron en borrador por datos incompletos.`
              : `${periodLabel(period)}. Las familias ya pueden verlo.`,
        },
      );
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(null);
      setConfirmOpen(false);
    }
  }

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
    while (next >= 0 && next < rows.length) {
      const el = e.currentTarget.querySelector<HTMLElement>(`[data-cell="${next}:${c}"]`);
      if (el && !(el as HTMLInputElement).disabled) {
        e.preventDefault();
        el.focus();
        return;
      }
      next += delta;
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Planilla de calificaciones"
        title={course.name}
        breadcrumbs={[{ label: "Mis cursos", href: "/teacher" }, { label: course.name }]}
        description={`${gradingTypeLabel(course.gradingType)} · ${course.schedule} · ${rows.length} alumnos`}
      />

      <PeriodTabs
        value={period}
        onChange={selectPeriod}
        dirtyPeriods={Object.entries(drafts)
          .filter(([, d]) => d && Object.keys(d).length > 0)
          .map(([k]) => k)}
      />

      {rows.length === 0 ? (
        <EmptyState icon={Users} title="Este curso todavía no tiene alumnos." />
      ) : (
        <section className="surface-card mt-4 overflow-hidden" aria-label={`Planilla · ${periodLabel(period)}`}>
          <div className="flex flex-col gap-3 border-b border-slate-200/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
              <span className="font-semibold text-foreground">{periodLabel(period)}</span>
              <Metric
                label={period === "closing" ? "con resultado" : "cargados"}
                value={progress.complete}
                total={progress.total}
              />
              <Metric label="publicados" value={progress.published} total={progress.total} />
              {period !== "closing" && (
                <Metric label="leídos" value={progress.read} total={progress.total} />
              )}
            </div>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="size-3 rounded-[3px] border border-danger-border bg-danger-soft" aria-hidden />
              Menor a 6: solo referencia, la decisión es del docente
            </p>
          </div>

          <div className="max-h-[calc(100dvh-19rem)] min-h-64 overflow-auto overscroll-x-contain">
            <table className="w-full border-separate border-spacing-0 text-sm" onKeyDown={handleKeyDown}>
              <caption className="sr-only">
                Calificaciones de {course.name}, {periodLabel(period)}
              </caption>
              <thead>
                <tr>
                  <Th sticky className="w-36 text-left sm:w-auto sm:min-w-56">Alumno</Th>
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
                      <Th className="w-28">Inasistencias</Th>
                      <Th className="w-20">Obs.</Th>
                    </>
                  )}
                  <Th className="pr-4 text-left">Estado</Th>
                </tr>
              </thead>
              <tbody>
                {view.map(({ row, values, errors }, index) => {
                  const studentDirty = dirtyIds.includes(row.student.id);
                  return (
                    <tr key={row.student.id} className="group">
                      <Td
                        sticky
                        className={cn(
                          "pl-4 text-left",
                          studentDirty && "shadow-[inset_2px_0_0_var(--color-primary)]",
                        )}
                      >
                        <StudentName name={fullName(row.student)} dirty={studentDirty} />
                      </Td>
                      {period === "closing" ? (
                        <ClosingCells
                          index={index}
                          course={course}
                          name={fullName(row.student)}
                          values={values as ClosingRowValues}
                          errors={errors}
                          onChange={(field, value) => setCell(row.student.id, field, value)}
                        />
                      ) : (
                        <BimesterCells
                          index={index}
                          course={course}
                          name={fullName(row.student)}
                          values={values as BimesterRowValues}
                          errors={errors}
                          onChange={(field, value) => setCell(row.student.id, field, value)}
                        />
                      )}
                      <Td className="pr-4 text-left">
                        <BimesterStatusBadge
                          status={
                            period === "closing"
                              ? getClosingStatus(row.card.closing)
                              : getBimesterStatus(getBimester(row.card, period))
                          }
                        />
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {rows.length > 0 && (
        <ActionBar
          dirtyCount={dirtyIds.length}
          editingPublished={editingPublished}
          busy={busy}
          canPublish={ready.length > 0}
          onSave={handleSave}
          onPublish={() => setConfirmOpen(true)}
        />
      )}

      <AlertDialog open={confirmOpen} onOpenChange={(open) => busy === null && setConfirmOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Publicar a las familias?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="flex flex-col gap-2">
                <p>
                  Se publicará el {periodLabel(period).toLowerCase()} de{" "}
                  <strong className="font-semibold text-foreground">
                    {ready.length === 1 ? "1 alumno" : `${ready.length} alumnos`}
                  </strong>
                  . Las familias podrán verlo de inmediato.
                </p>
                {incomplete.length > 0 && (
                  <p>
                    {incomplete.length === 1 ? "1 alumno" : `${incomplete.length} alumnos`} con datos
                    incompletos quedará{incomplete.length === 1 ? "" : "n"} como borrador.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy !== null}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy !== null}
              onClick={(e) => {
                e.preventDefault();
                void handlePublish();
              }}
            >
              {busy === "publish" && <Loader2 className="animate-spin" aria-hidden />}
              Publicar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/* ------------------------------------------------------------------------- */

function BimesterCells({
  index,
  course,
  name,
  values,
  errors,
  onChange,
}: {
  index: number;
  course: Course;
  name: string;
  values: BimesterRowValues;
  errors: RowErrors;
  onChange: (field: keyof BimesterRowValues, value: string) => void;
}) {
  return (
    <>
      <Td>
        {course.gradingType === "numeric" ? (
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
        )}
      </Td>
      <Td>
        <SelectCell
          cell={`${index}:1`}
          aria-label={`Conducta de ${name}`}
          value={values.conduct}
          onValueChange={(v) => onChange("conduct", v)}
          options={CONCEPT_OPTIONS}
          className="w-36"
        />
      </Td>
      <Td>
        <TextCell
          cell={`${index}:2`}
          inputMode="numeric"
          placeholder="0"
          aria-label={`Inasistencias de ${name}`}
          value={values.absences}
          onValueChange={(v) => onChange("absences", v)}
          invalid={errors.absences}
          className="mx-auto w-14"
        />
      </Td>
      <Td>
        <div className="flex justify-center">
          <ObservationCell
            cell={`${index}:3`}
            studentName={name}
            value={values.observation}
            onValueChange={(v) => onChange("observation", v)}
          />
        </div>
      </Td>
    </>
  );
}

function ClosingCells({
  index,
  course,
  name,
  values,
  errors,
  onChange,
}: {
  index: number;
  course: Course;
  name: string;
  values: ClosingRowValues;
  errors: RowErrors;
  onChange: (field: keyof ClosingRowValues, value: string) => void;
}) {
  const toFinal = values.result === "Va a examen final";
  const finalOptions = [
    { value: "promoted", label: `Promovido a ${course.nextCourseName}` },
    { value: "march", label: "Debe rendir en marzo" },
  ];
  const gradeCell = (cell: string, field: "cuatrimestral" | "finalGrade", label: string, disabled = false) =>
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

  return (
    <>
      <Td>
        <div className="flex justify-center">
          {gradeCell(`${index}:0`, "cuatrimestral", `Examen cuatrimestral de ${name}`)}
        </div>
      </Td>
      <Td>
        <SelectCell
          cell={`${index}:1`}
          aria-label={`Resultado de ${name}`}
          value={values.result}
          onValueChange={(v) => onChange("result", v)}
          options={RESULT_OPTIONS}
          className="w-40"
        />
      </Td>
      <Td>
        <div className={cn("flex items-center gap-2", !toFinal && "opacity-60")}>
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
      </Td>
      <Td>
        <SelectCell
          cell={`${index}:4`}
          aria-label={`Resultado final de ${name}`}
          value={values.finalResult}
          onValueChange={(v) => onChange("finalResult", v)}
          options={finalOptions}
          className="w-48"
        />
      </Td>
    </>
  );
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
        "sticky top-0 z-20 h-9 border-b border-slate-200 bg-slate-50/95 px-3 text-center text-[11px] font-medium tracking-[0.04em] whitespace-nowrap text-slate-500 uppercase backdrop-blur",
        sticky && "left-0 z-30 pl-4 shadow-[1px_0_0_var(--color-slate-200)]",
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
        "border-b border-slate-100 px-3 py-1.5 text-center whitespace-nowrap transition-colors duration-150 group-last:border-b-0 group-hover:bg-slate-50/60",
        sticky && "sticky left-0 z-10 bg-white shadow-[1px_0_0_var(--color-slate-200)] group-hover:bg-slate-50",
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
      <span className="hidden size-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600 sm:flex">
        {first?.[0]}
        {last?.[0]}
      </span>
      <span className="block max-w-[8.5rem] truncate text-[13.5px] sm:max-w-none">
        <span className="font-medium text-foreground">{last}</span>
        <span className="text-slate-500">, {first}</span>
      </span>
      {dirty && <span className="sr-only">(con cambios sin guardar)</span>}
    </span>
  );
}

function Metric({ label, value, total }: { label: string; value: number; total: number }) {
  return (
    <span className="text-muted-foreground tabular-nums">
      <span className="font-medium text-foreground">{value}</span>/{total} {label}
    </span>
  );
}

function PeriodTabs({
  value,
  onChange,
  dirtyPeriods,
}: {
  value: ReportPeriod;
  onChange: (period: ReportPeriod) => void;
  dirtyPeriods: string[];
}) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div
        role="tablist"
        aria-label="Período"
        className="inline-flex gap-0.5 rounded-lg bg-slate-100 p-1 ring-1 ring-slate-200/70 ring-inset"
      >
        {REPORT_PERIODS.map((p) => {
          const active = p === value;
          return (
            <button
              key={String(p)}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(p)}
              className={cn(
                "relative inline-flex h-8 items-center gap-1.5 rounded-md px-3.5 text-[13px] font-medium whitespace-nowrap transition-[color,background-color,box-shadow] duration-150 outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                active
                  ? "bg-white text-foreground shadow-[0_1px_2px_rgb(15_23_42/0.08),0_0_0_1px_rgb(15_23_42/0.06)]"
                  : "text-slate-500 hover:text-foreground",
              )}
            >
              {periodShortLabel(p)}
              {dirtyPeriods.includes(String(p)) && (
                <span className="size-1.5 rounded-full bg-primary" aria-label="con cambios sin guardar" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ActionBar({
  dirtyCount,
  editingPublished,
  busy,
  canPublish,
  onSave,
  onPublish,
}: {
  dirtyCount: number;
  editingPublished: boolean;
  busy: "save" | "publish" | null;
  canPublish: boolean;
  onSave: () => void;
  onPublish: () => void;
}) {
  const dirty = dirtyCount > 0;
  return (
    <div className="sticky bottom-4 z-30 mt-6 print:hidden">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white/95 px-4 py-3 shadow-raised backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div aria-live="polite" className="min-w-0 text-sm">
          {dirty ? (
            <p className="flex items-center gap-2">
              <span className="size-2 shrink-0 rounded-full bg-primary" aria-hidden />
              <span className="font-medium text-foreground">
                {dirtyCount === 1 ? "1 cambio sin guardar" : `${dirtyCount} cambios sin guardar`}
              </span>
              {editingPublished && (
                <span className="hidden text-muted-foreground lg:inline">
                  · Incluye alumnos publicados: verán los cambios al guardar.
                </span>
              )}
            </p>
          ) : (
            <p className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="size-4 text-success" aria-hidden />
              Todos los cambios están guardados
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Button variant="outline" onClick={onSave} disabled={!dirty || busy !== null}>
            {busy === "save" && <Loader2 className="animate-spin" aria-hidden />}
            Guardar borrador
          </Button>
          <Button onClick={onPublish} disabled={!canPublish || busy !== null}>
            <Send aria-hidden />
            <span className="sm:hidden">Publicar</span>
            <span className="hidden sm:inline">Publicar a las familias</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
