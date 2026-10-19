import type { ReactNode } from "react";
import type { StatusTone } from "@/components/ui/status-badge";
import type { GradingType } from "@/domain/grading";
import { cn } from "@/lib/utils";
import { averageText, type DistributionBand, type LiveExamStats } from "./exam-detail-model";

function Tile({
  label,
  value,
  note,
  danger = false,
  children,
}: {
  label: string;
  value: string;
  note?: string;
  danger?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className={cn("surface-card px-5 py-4", danger && "border-danger-border bg-danger-soft")}>
      <p className="text-[15px] text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 font-serif text-2xl leading-tight font-semibold text-navy tabular-nums",
          danger && "text-danger",
        )}
      >
        {value}
      </p>
      {note && <p className="mt-0.5 text-[15px] text-muted-foreground">{note}</p>}
      {children}
    </div>
  );
}

/** Live numbers of the exam: they follow what is typed, not only what is saved. */
export function ExamStatTiles({ stats, type }: { stats: LiveExamStats; type: GradingType }) {
  const progress = stats.total === 0 ? 0 : Math.round((stats.graded / stats.total) * 100);
  return (
    <section aria-label="Resumen del examen" className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Tile label="Calificados" value={`${stats.graded} de ${stats.total}`}>
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={stats.total}
          aria-valuenow={stats.graded}
          aria-label="Alumnos calificados"
        >
          <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
        </div>
      </Tile>
      <Tile label="Promedio" value={averageText(stats.average, type)} />
      <Tile
        label="Aprobados"
        value={String(stats.passed)}
        note={stats.graded > 0 ? `${stats.passedPct}% de los calificados` : undefined}
      />
      <Tile
        label="Desaprobados"
        value={String(stats.failed)}
        note={stats.graded > 0 ? `${stats.failedPct}% de los calificados` : undefined}
        danger={stats.failed > 0}
      />
    </section>
  );
}

const SEGMENT_COLORS: Record<StatusTone, string> = {
  neutral: "bg-slate-400",
  danger: "bg-danger",
  warning: "bg-warning",
  info: "bg-primary",
  success: "bg-success",
};

/** Stacked bar of how the grades are spread, with the counts written out. */
export function GradeDistribution({ bands }: { bands: DistributionBand[] }) {
  const total = bands.reduce((sum, b) => sum + b.count, 0);
  if (total === 0) return null;
  const summary = bands.map((b) => `${b.label}: ${b.count}`).join(", ");
  return (
    <section aria-label="Distribución de notas" className="surface-card mb-6 px-5 py-4">
      <h2 className="text-base font-semibold text-navy">Cómo se distribuyen las notas</h2>
      <p className="sr-only">{summary}</p>
      <div className="mt-3 flex h-4 overflow-hidden rounded-full bg-slate-200" aria-hidden>
        {bands
          .filter((b) => b.count > 0)
          .map((b) => (
            <div
              key={b.label}
              className={cn("h-full", SEGMENT_COLORS[b.tone])}
              style={{ width: `${(b.count / total) * 100}%` }}
            />
          ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2" aria-hidden>
        {bands.map((b) => (
          <li key={b.label} className="flex items-center gap-2 text-[15px] text-foreground">
            <span className={cn("size-3 rounded-sm", SEGMENT_COLORS[b.tone])} />
            <span>
              {b.label}: <strong className="tabular-nums">{b.count}</strong>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
