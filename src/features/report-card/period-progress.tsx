import Link from "next/link";
import type { PeriodProgress } from "@/application/progress";
import { cn } from "@/lib/utils";
import { periodShortLabel } from "./period";

/** Two-layer bar: loaded (light) and published (solid). */
export function ProgressBar({
  complete,
  published,
  total,
  className,
}: {
  complete: number;
  published: number;
  total: number;
  className?: string;
}) {
  const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 100));
  return (
    <div
      className={cn("relative h-1.5 overflow-hidden rounded-full bg-slate-100", className)}
      aria-hidden
    >
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-blue-200 transition-[width] duration-300"
        style={{ width: `${pct(complete)}%` }}
      />
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-300"
        style={{ width: `${pct(published)}%` }}
      />
    </div>
  );
}

export function ProgressLegend({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-4 text-xs text-muted-foreground", className)}>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-blue-200" aria-hidden />
        Cargado
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-primary" aria-hidden />
        Publicado
      </span>
    </div>
  );
}

function statusText(p: PeriodProgress): { text: string; tone: string } {
  if (p.total === 0) return { text: "Sin alumnos", tone: "text-slate-400" };
  if (p.published === p.total) return { text: "Publicado", tone: "text-primary" };
  if (p.complete === 0) return { text: "Sin cargar", tone: "text-slate-400" };
  return { text: `${p.complete}/${p.total} cargados`, tone: "text-slate-700" };
}

/** One row per period with a bar and a short status. */
export function PeriodProgressList({
  progress,
  hrefFor,
}: {
  progress: PeriodProgress[];
  /** When given, each row links to the grade sheet of that period. */
  hrefFor?: (p: PeriodProgress) => string;
}) {
  return (
    <ul className="flex flex-col">
      {progress.map((p) => {
        const status = statusText(p);
        const content = (
          <>
            <span className="w-14 shrink-0 text-[13px] font-medium text-slate-600">
              {periodShortLabel(p.period)}
            </span>
            <ProgressBar
              complete={p.complete}
              published={p.published}
              total={p.total}
              className="flex-1"
            />
            <span className={cn("w-28 shrink-0 text-right text-xs tabular-nums", status.tone)}>
              {status.text}
            </span>
          </>
        );
        const label = `${periodShortLabel(p.period)}: ${p.complete} de ${p.total} cargados, ${p.published} publicados`;
        return (
          <li key={String(p.period)}>
            {hrefFor ? (
              <Link
                href={hrefFor(p)}
                aria-label={label}
                className="-mx-2 flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors duration-150 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none"
              >
                {content}
              </Link>
            ) : (
              <div className="flex items-center gap-3 py-1.5" aria-label={label}>
                {content}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
