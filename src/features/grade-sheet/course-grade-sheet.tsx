"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Loader2, Pencil, Users } from "lucide-react";
import { toast } from "sonner";
import type { GradeSheet, GradeSheetChange, GradeSheetRow } from "@/application/grade-sheet";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import type { Crumb } from "@/components/layout/breadcrumbs";
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
import type { PeriodReview } from "@/domain/period-review";
import type { ReportPeriod } from "@/domain/report-card";
import { parsePeriodParam, periodLabel, periodParam } from "@/features/report-card/period";
import { errorMessage } from "@/lib/error-message";
import { cn } from "@/lib/utils";
import { PeriodSummary, PeriodTimeline } from "./sheet-overview";
import { defaultSheetPeriod } from "./sheet-model";
import {
  effectiveFilter,
  filterSheetRows,
  periodBreakdown,
  periodSteps,
  type SheetFilter,
} from "./sheet-summary";
import { GradeSheetTable } from "./sheet-table";
import { useSheetDrafts, type PendingPeriod, type SheetRowView } from "./use-sheet-drafts";

/** What the page can show next to Editar while the sheet is read-only. */
export interface ReadModeContext {
  period: ReportPeriod;
  view: SheetRowView[];
  /** Approval batch of the selected period, if any. */
  review: PeriodReview | null;
}

/*
 * Course grade sheet page shared by the teacher and Dirección: period
 * timeline, summary, read-only table by default and an explicit edit mode
 * (Editar → Guardar / Cancelar). Saving writes every period with edits.
 */
export function CourseGradeSheet({
  sheet,
  onSheetChange,
  eyebrow,
  breadcrumbs,
  description,
  emptyDescription,
  saveLabel = "Guardar cambios",
  editNote,
  savePeriod,
  savedDescription,
  readActions,
  renderName,
  publishHint = false,
  canEdit,
  lockRow,
  banner,
  aside,
  children,
}: {
  sheet: GradeSheet;
  onSheetChange: (sheet: GradeSheet) => void;
  eyebrow: string;
  breadcrumbs: Crumb[];
  description: ReactNode;
  emptyDescription?: string;
  saveLabel?: string;
  /** Extra sentence of the edit-mode banner. */
  editNote: string;
  savePeriod: (
    period: ReportPeriod,
    changes: GradeSheetChange<ReportPeriod>[],
  ) => Promise<GradeSheet>;
  savedDescription: (pending: PendingPeriod[]) => string;
  /** Extra header actions in read mode (e.g. publishing). */
  readActions?: (ctx: ReadModeContext) => ReactNode;
  /** Student cell in read mode (e.g. a link to the report card). */
  renderName?: (row: GradeSheetRow, name: ReactNode) => ReactNode;
  publishHint?: boolean;
  /** Whether the selected period can be edited (e.g. not while pending approval). */
  canEdit?: (ctx: ReadModeContext) => boolean;
  /** Rows that stay read-only in edit mode (e.g. published students for the teacher). */
  lockRow?: (row: GradeSheetRow, period: ReportPeriod) => boolean;
  /** Status message of the selected period, above the sheet. */
  banner?: (ctx: ReadModeContext) => ReactNode;
  /** Content after the sheet (e.g. notes). */
  aside?: ReactNode;
  /** Dialogs owned by the page. */
  children?: (ctx: ReadModeContext) => ReactNode;
}) {
  const { course, rows } = sheet;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const period =
    parsePeriodParam(searchParams.get("periodo")) ?? defaultSheetPeriod(rows.map((r) => r.card));

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [filterChoice, setFilter] = useState<SheetFilter>("all");

  const { view, dirtyPeriods, anyDirty, setCell, pendingPeriods, discardPeriod, discardAll } =
    useSheetDrafts(rows, course, period);
  const steps = periodSteps(rows.map((r) => r.card));
  const breakdown = steps.find((s) => s.period === period)?.breakdown ?? periodBreakdown([], period);
  const filter = effectiveFilter(filterChoice, breakdown);
  const { visible, hiddenDirty } = filterSheetRows(view, period, filter);
  const changedRows = pendingPeriods().reduce((n, p) => n + p.changes.length, 0);
  const review = sheet.reviews.find((r) => r.period === period) ?? null;
  const ctx: ReadModeContext = { period, view, review };
  const periodEditable = canEdit ? canEdit(ctx) : true;
  const extraActions = readActions?.(ctx) ?? null;

  function selectPeriod(next: ReportPeriod) {
    router.replace(`${pathname}?periodo=${periodParam(next)}`, { scroll: false });
  }

  function stopEditing() {
    discardAll();
    setEditing(false);
    setConfirmDiscard(false);
  }

  async function handleSave() {
    const pending = pendingPeriods();
    if (pending.length === 0) {
      setEditing(false);
      return;
    }
    const invalid = pending.find((p) => p.hasErrors);
    if (invalid) {
      if (invalid.period !== period) selectPeriod(invalid.period);
      toast.error("Revise las celdas marcadas en rojo antes de guardar.", {
        description: periodLabel(invalid.period),
      });
      return;
    }
    setSaving(true);
    try {
      // One call per period; a failure keeps the drafts of the unsaved periods.
      for (const p of pending) {
        onSheetChange(await savePeriod(p.period, p.changes));
        discardPeriod(p.period);
      }
      setEditing(false);
      toast.success("Cambios guardados", { description: savedDescription(pending) });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow={eyebrow}
        title={course.name}
        breadcrumbs={breadcrumbs}
        description={description}
        actions={
          rows.length > 0 && (
            // Phones use the bottom action bar instead.
            <div className="hidden flex-wrap gap-2 md:flex">
              {editing ? (
            <>
              <Button
                variant="outline"
                disabled={saving}
                onClick={() => (anyDirty ? setConfirmDiscard(true) : stopEditing())}
              >
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving || !anyDirty}>
                {saving && <Loader2 className="animate-spin" aria-hidden />}
                {saveLabel}
              </Button>
            </>
          ) : (
            <>
              {periodEditable && (
                <Button variant={extraActions ? "outline" : "default"} onClick={() => setEditing(true)}>
                  <Pencil aria-hidden />
                  Editar
                </Button>
              )}
              {extraActions}
            </>
          )}
            </div>
          )
        }
      />

      <PeriodTimeline
        steps={steps}
        value={period}
        onChange={selectPeriod}
        dirtyPeriods={dirtyPeriods}
        reviews={sheet.reviews}
      />

      {banner?.(ctx)}

      {rows.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={Users}
            title="Este curso todavía no tiene alumnos."
            description={emptyDescription}
          />
        </div>
      ) : (
        <section
          className={cn(
            "surface-card mt-4 overflow-hidden",
            editing && "border-primary/40 ring-4 ring-primary/10",
          )}
          aria-label={`Calificaciones · ${periodLabel(period)}`}
        >
          {editing && (
            <p
              aria-live="polite"
              className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-primary/15 bg-primary-soft px-4 py-2.5 text-[13px] text-navy"
            >
              <Pencil className="size-3.5 text-primary-strong" aria-hidden />
              <span className="font-semibold">Modo edición.</span>
              <span>
                {anyDirty
                  ? changedRows === 1
                    ? "1 fila con cambios sin guardar."
                    : `${changedRows} filas con cambios sin guardar.`
                  : "Modifique las celdas y guarde los cambios."}{" "}
                {editNote}
              </span>
            </p>
          )}
          <PeriodSummary
            period={period}
            breakdown={breakdown}
            filter={filter}
            onFilterChange={setFilter}
            hiddenDirty={hiddenDirty}
            publishHint={publishHint && !editing && review?.status !== "pending"}
          />
          <div className="relative md:max-h-[calc(100dvh-19rem)] md:min-h-64 md:overflow-auto md:overscroll-x-contain">
            <GradeSheetTable
              course={course}
              period={period}
              view={visible}
              editable={editing && periodEditable}
              lockRow={lockRow}
              pendingIds={review?.status === "pending" ? review.studentIds : undefined}
              onCellChange={setCell}
              renderName={!editing ? renderName : undefined}
            />
          </div>
        </section>
      )}

      <AlertDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Descartar los cambios?</AlertDialogTitle>
            <AlertDialogDescription>
              Se perderán las modificaciones que todavía no guardó.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Seguir editando</AlertDialogCancel>
            <AlertDialogAction onClick={stopEditing}>Descartar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {rows.length > 0 && (
        <>
          {/* Phones: actions within thumb reach; the spacer keeps the last card visible. */}
          <div aria-hidden className="h-20 md:hidden print:hidden" />
          <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-border bg-card/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-6px_16px_-10px_rgb(11_58_91/0.25)] backdrop-blur-md md:hidden print:hidden">
            {editing ? (
              <>
                <Button
                  variant="outline"
                  className="h-11 flex-1"
                  disabled={saving}
                  onClick={() => (anyDirty ? setConfirmDiscard(true) : stopEditing())}
                >
                  Cancelar
                </Button>
                <Button
                  className="h-11 flex-[2] disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100"
                  onClick={handleSave}
                  disabled={saving || !anyDirty}
                >
                  {saving && <Loader2 className="animate-spin" aria-hidden />}
                  {saveLabel}
                  {changedRows > 0 && <span className="tabular-nums">({changedRows})</span>}
                </Button>
              </>
            ) : (
              <>
                {periodEditable && (
                  <Button
                    variant={extraActions ? "outline" : "default"}
                    className="h-11 flex-1"
                    onClick={() => setEditing(true)}
                  >
                    <Pencil aria-hidden />
                    Editar
                  </Button>
                )}
                {extraActions && (
                  <div className="flex flex-[2] gap-2 [&>*]:h-11 [&>*]:flex-1">{extraActions}</div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {aside}

      {children?.(ctx)}
    </>
  );
}
