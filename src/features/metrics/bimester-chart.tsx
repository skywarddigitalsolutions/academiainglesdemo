import type { BimesterAverage } from "@/application/dashboard";
import { PASS_MARK, type GradingType } from "@/domain/grading";
import { bimesterLabel } from "@/lib/format";

const SCALE_MAX = 10;

function decimal(value: number): string {
  return String(value).replace(".", ",");
}

/** Conceptual courses: the median concept of each bimester as a labeled block, no numbers. */
function ConceptBlocks({ averages }: { averages: BimesterAverage[] }) {
  const summary = averages
    .map((a) => `${bimesterLabel(a.bimester)}: ${a.concept ?? "sin notas"}`)
    .join(". ");
  return (
    <figure className="m-0 pt-3">
      <figcaption className="sr-only">Concepto por bimestre. {summary}.</figcaption>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {averages.map((a) => (
          <li
            key={a.bimester}
            className={
              a.concept
                ? "flex min-h-24 flex-col items-center justify-center gap-1 rounded-lg bg-primary-soft px-2 py-3 text-center"
                : "flex min-h-24 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 px-2 py-3 text-center"
            }
          >
            <span className="text-sm font-medium text-muted-foreground">{bimesterLabel(a.bimester)}</span>
            <span
              className={
                a.concept
                  ? "font-serif text-xl leading-tight font-semibold text-navy"
                  : "text-sm text-muted-foreground"
              }
            >
              {a.concept ?? "Sin notas"}
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

/**
 * Numeric courses: vertical bars 1°-4° with the approval line; empty bimesters are
 * dashed placeholders. Conceptual courses: the median concept per bimester.
 */
export function BimesterChart({
  averages,
  gradingType = "numeric",
}: {
  averages: BimesterAverage[];
  gradingType?: GradingType;
}) {
  if (gradingType === "conceptual") return <ConceptBlocks averages={averages} />;
  const summary = averages
    .map((a) =>
      a.average === null
        ? `${bimesterLabel(a.bimester)}: sin notas`
        : `${bimesterLabel(a.bimester)}: ${decimal(a.average)}`,
    )
    .join(". ");

  return (
    <figure className="m-0">
      <figcaption className="sr-only">Promedio por bimestre. {summary}.</figcaption>
      <div className="relative mt-7 h-44" aria-hidden>
        <div
          className="absolute inset-x-0 border-t border-dashed border-navy/40"
          style={{ bottom: `${(PASS_MARK / SCALE_MAX) * 100}%` }}
        >
          <span className="absolute right-0 bottom-0.5 rounded bg-card px-1 text-sm text-muted-foreground">
            Aprobación ({PASS_MARK})
          </span>
        </div>
        <div className="absolute inset-0 flex items-end gap-3 sm:gap-5">
          {averages.map((a) => (
            <div key={a.bimester} className="relative flex h-full flex-1 items-end justify-center">
              {a.average === null ? (
                <div className="flex h-[28%] w-full max-w-16 items-center justify-center rounded-t-md border-2 border-dashed border-slate-300 text-center text-sm leading-tight text-muted-foreground">
                  Sin notas
                </div>
              ) : (
                <div
                  className="relative w-full max-w-16 rounded-t-md bg-primary"
                  style={{ height: `${(a.average / SCALE_MAX) * 100}%` }}
                >
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 font-serif text-lg font-semibold text-navy tabular-nums">
                    {decimal(a.average)}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex gap-3 border-t border-slate-200 pt-2 sm:gap-5" aria-hidden>
        {averages.map((a) => (
          <span key={a.bimester} className="flex-1 text-center text-sm font-medium text-foreground">
            {a.bimester}°
          </span>
        ))}
      </div>
    </figure>
  );
}
