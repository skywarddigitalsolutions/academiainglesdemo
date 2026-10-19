"use client";

import { useState } from "react";
import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import type { CourseMetrics } from "@/application/dashboard";
import { fullName } from "@/domain/student";
import { bimesterLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  progressChange,
  progressRows,
  scoreLabel,
  trendTone,
  type ProgressFilter,
} from "./dashboard-model";
import { SegmentedControl } from "./segmented-control";

const TH =
  "h-10 px-3 text-left text-[11px] font-semibold tracking-[0.05em] text-navy/75 uppercase";

const FILTERS: { value: ProgressFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "improved", label: "Mejoraron" },
  { value: "declined", label: "Empeoraron" },
];

const TREND_TEXT = {
  success: "text-success",
  danger: "text-danger",
  neutral: "text-muted-foreground",
  warning: "text-warning",
  info: "text-primary-strong",
} as const;

const TREND_ICON = { up: ArrowUp, down: ArrowDown, flat: ArrowRight } as const;

/** Per-student grades by bimester with the change versus the previous graded bimester. */
export function StudentProgressTable({ metrics }: { metrics: CourseMetrics }) {
  const [filter, setFilter] = useState<ProgressFilter>("all");
  const rows = progressRows(metrics.students, filter);
  const gradingType = metrics.course.gradingType;

  return (
    <div className="flex flex-col gap-3">
      <SegmentedControl
        label="Filtrar alumnos por progreso"
        options={FILTERS}
        value={filter}
        onChange={setFilter}
      />
      <div className="surface-card overflow-x-auto">
        <table className="w-full min-w-[40rem] text-sm">
          <thead className="bg-primary-tint">
            <tr className="border-b border-slate-200">
              <th className={TH}>Alumno</th>
              {[1, 2, 3, 4].map((n) => (
                <th key={n} className={TH}>
                  {n}°
                </th>
              ))}
              <th className={TH}>{gradingType === "conceptual" ? "Concepto general" : "Promedio"}</th>
              <th className={TH}>Cambio vs bimestre anterior</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-base text-muted-foreground">
                  Ningún alumno en esta vista.
                </td>
              </tr>
            )}
            {rows.map(({ student, performance }) => {
              const tone = trendTone(performance.trend);
              const Icon = performance.trend ? TREND_ICON[performance.trend] : null;
              const change = progressChange(performance);
              const compare =
                performance.latest && performance.previous
                  ? `${bimesterLabel(performance.latest.bimester)} vs ${bimesterLabel(performance.previous.bimester)}`
                  : "Necesita dos bimestres con nota";
              return (
                <tr key={student.id} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-3 py-2 font-medium text-foreground">{fullName(student)}</td>
                  {performance.scores.map((score, i) => (
                    <td key={i} className="px-3 py-2 tabular-nums">
                      {scoreLabel(score, gradingType)}
                    </td>
                  ))}
                  <td className="px-3 py-2 font-semibold tabular-nums">
                    {scoreLabel(performance.average, gradingType)}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      title={compare}
                      className={cn(
                        "inline-flex items-center gap-1 font-semibold tabular-nums",
                        TREND_TEXT[tone],
                      )}
                    >
                      {Icon && <Icon className="size-4" aria-hidden />}
                      {change.text}
                      <span className="sr-only"> ({compare})</span>
                    </span>
                    {change.detail && (
                      <span className="block text-sm text-muted-foreground">{change.detail}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
