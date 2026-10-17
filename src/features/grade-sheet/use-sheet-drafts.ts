"use client";

import { useEffect, useMemo, useState } from "react";
import type { GradeSheetChange, GradeSheetRow } from "@/application/grade-sheet";
import type { Course } from "@/domain/course";
import { REPORT_PERIODS, type ReportPeriod } from "@/domain/report-card";
import {
  editRowDraft,
  isPeriodPublished,
  rowValues,
  toPeriodPatch,
  validateRow,
  type RowDraft,
  type RowErrors,
  type RowValues,
} from "./sheet-model";

export interface SheetRowView {
  row: GradeSheetRow;
  base: RowValues;
  values: RowValues;
  errors: RowErrors;
  published: boolean;
  dirty: boolean;
}

export interface PendingPeriod {
  period: ReportPeriod;
  changes: GradeSheetChange<ReportPeriod>[];
  hasErrors: boolean;
  /** Some changed rows are already visible to families. */
  touchesPublished: boolean;
}

/** Unsaved cell edits, per period and student. */
type Drafts = Partial<Record<string, Partial<Record<string, RowDraft>>>>;

function buildView(
  rows: GradeSheetRow[],
  course: Course,
  period: ReportPeriod,
  periodDrafts: Partial<Record<string, RowDraft>>,
): SheetRowView[] {
  return rows.map((row) => {
    const base = rowValues(row.card, period);
    const draft = periodDrafts[row.student.id];
    const values = { ...base, ...(draft ?? {}) } as RowValues;
    return {
      row,
      base,
      values,
      errors: validateRow(period, values, course.gradingType),
      published: isPeriodPublished(row.card, period),
      dirty: draft !== undefined,
    };
  });
}

const hasKeys = (value: object | undefined) => value !== undefined && Object.keys(value).length > 0;

/**
 * Draft state of a course grade sheet: edits are kept as text per period until
 * they are saved, and only cells that differ from the stored values count.
 */
export function useSheetDrafts(rows: GradeSheetRow[], course: Course, period: ReportPeriod) {
  const periodKey = String(period);
  const [drafts, setDrafts] = useState<Drafts>({});

  const view = useMemo(
    () => buildView(rows, course, period, drafts[periodKey] ?? {}),
    [rows, course, period, drafts, periodKey],
  );

  const dirtyPeriods = Object.entries(drafts)
    .filter(([, d]) => hasKeys(d))
    .map(([key]) => key);
  const anyDirty = dirtyPeriods.length > 0;

  // Warn before leaving the page with unsaved changes.
  useEffect(() => {
    if (!anyDirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [anyDirty]);

  function setCell(studentId: string, field: string, value: string) {
    const base = view.find((v) => v.row.student.id === studentId)?.base;
    if (!base) return;
    setDrafts((current) => {
      const forPeriod = { ...(current[periodKey] ?? {}) };
      const next = editRowDraft(base, forPeriod[studentId] ?? {}, field, value);
      if (hasKeys(next)) forPeriod[studentId] = next;
      else delete forPeriod[studentId];
      return { ...current, [periodKey]: forPeriod };
    });
  }

  /** Changes of every period with unsaved edits, in period order. */
  function pendingPeriods(): PendingPeriod[] {
    return REPORT_PERIODS.filter((p) => hasKeys(drafts[String(p)])).map((p) => {
      const changed = buildView(rows, course, p, drafts[String(p)] ?? {}).filter((v) => v.dirty);
      return {
        period: p,
        changes: changed.map((v) => ({
          studentId: v.row.student.id,
          patch: toPeriodPatch(p, v.values, course),
        })),
        hasErrors: changed.some((v) => hasKeys(v.errors)),
        touchesPublished: changed.some((v) => v.published),
      };
    });
  }

  return {
    view,
    dirtyPeriods,
    anyDirty,
    setCell,
    pendingPeriods,
    discardPeriod: (p: ReportPeriod) => setDrafts((current) => ({ ...current, [String(p)]: {} })),
    discardAll: () => setDrafts({}),
  };
}
