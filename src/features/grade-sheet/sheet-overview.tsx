"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Circle,
  CircleAlert,
  CircleCheck,
  CircleDot,
  Clock,
  Undo2,
  X,
} from "lucide-react";
import type { ReviewStatus } from "@/domain/period-review";
import { Button } from "@/components/ui/button";
import type { ReportPeriod } from "@/domain/report-card";
import { bimesterStatusLabel } from "@/features/report-card/bimester-status-badge";
import { ProgressBar } from "@/features/report-card/period-progress";
import { periodLabel, periodPillLabel, periodShortLabel } from "@/features/report-card/period";
import { cn } from "@/lib/utils";
import {
  compactSummary,
  periodDisplayState,
  summarySentence,
  type PeriodDisplayState,
  type PeriodBreakdown,
  type PeriodStep,
  type RowStatus,
  type SheetFilter,
} from "./sheet-summary";
import { LowGradeHint } from "./sheet-table";

/*
 * Period timeline (the period selector) and the summary panel of the selected
 * period, shared by the teacher and Dirección grade sheets.
 */

const STEP_TEXT: Record<PeriodDisplayState, string> = {
  "not-started": "Sin empezar",
  draft: "Borrador",
  pending: "Pendiente de aprobación",
  returned: "Devuelto",
  done: "Publicado",
};

const STEP_TONE: Record<PeriodDisplayState, string> = {
  "not-started": "text-muted-foreground",
  draft: "text-warning",
  pending: "text-primary-strong",
  returned: "text-danger",
  done: "text-success",
};

const STEP_ICON: Record<PeriodDisplayState, typeof Circle> = {
  "not-started": Circle,
  draft: CircleDot,
  pending: Clock,
  returned: Undo2,
  done: CircleCheck,
};

function StepIcon({ state, className }: { state: PeriodDisplayState; className?: string }) {
  const Icon = STEP_ICON[state];
  return <Icon className={cn("size-4 shrink-0", STEP_TONE[state], className)} aria-hidden />;
}

export function PeriodTimeline({
  steps,
  value,
  onChange,
  dirtyPeriods,
  reviews = [],
}: {
  steps: PeriodStep[];
  value: ReportPeriod;
  onChange: (period: ReportPeriod) => void;
  dirtyPeriods: string[];
  /** Approval batches: pending and returned periods show that state. */
  reviews?: { period: ReportPeriod; status: ReviewStatus }[];
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = -1;
    if (e.key === "ArrowRight") next = (index + 1) % steps.length;
    else if (e.key === "ArrowLeft") next = (index - 1 + steps.length) % steps.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = steps.length - 1;
    if (next < 0) return;
    e.preventDefault();
    refs.current[next]?.focus();
    onChange(steps[next].period);
  }

  return (
    <div className="relative">
      <div
        role="tablist"
        aria-label="Período"
        className="grid grid-cols-5 gap-1 rounded-xl border border-border bg-primary-tint p-1 md:grid-cols-3 md:gap-1.5 md:p-1.5 lg:grid-cols-5"
      >
        {steps.map((step, index) => {
          const active = step.period === value;
          const { breakdown: b } = step;
          const dirty = dirtyPeriods.includes(String(step.period));
          const display = periodDisplayState(
            step.state,
            reviews.find((r) => r.period === step.period),
          );
          const last = index === steps.length - 1;
          return (
            <button
              key={String(step.period)}
              ref={(el) => {
                refs.current[index] = el;
              }}
              type="button"
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(step.period)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={cn(
                "group/step relative flex min-h-12 min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 text-center transition-[background-color,box-shadow] duration-150 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 md:items-stretch md:justify-start md:gap-1.5 md:px-3 md:py-2.5 md:text-left",
                active
                  ? "bg-card shadow-[0_1px_2px_rgb(11_58_91/0.10)] ring-1 ring-primary/50"
                  : "hover:bg-card/80 hover:shadow-[0_1px_2px_rgb(11_58_91/0.06)] hover:ring-1 hover:ring-primary/25",
              )}
            >
              {/* Phones: compact pill (icon, short label, "current" mark). */}
              <span className="flex items-center gap-1 md:hidden" aria-hidden>
                <StepIcon state={display} className="size-3.5" />
                <span
                  className={cn(
                    "text-[13px] font-semibold whitespace-nowrap",
                    active ? "text-navy" : "text-foreground/80",
                  )}
                >
                  {periodPillLabel(step.period)}
                </span>
              </span>
              <span
                aria-hidden
                className={cn(
                  "h-0.5 w-4 rounded-full md:hidden",
                  step.current ? "bg-primary" : dirty ? "bg-primary/40" : "bg-transparent",
                )}
              />
              <span className="sr-only md:hidden">
                {`${periodLabel(step.period)}: ${STEP_TEXT[display]}`}
              </span>

              {/* From md: node and connector to the next period. */}
              <span className="hidden items-center gap-2 md:flex" aria-hidden>
                <StepIcon state={display} />
                <span
                  className={cn(
                    "hidden h-px flex-1 lg:block",
                    last ? "bg-transparent" : step.state === "done" ? "bg-success/40" : "bg-input",
                  )}
                />
              </span>
              <span className="hidden items-center gap-1.5 md:flex">
                <span
                  className={cn(
                    "text-[13.5px] font-semibold whitespace-nowrap",
                    active ? "text-navy" : "text-foreground/80",
                  )}
                >
                  {periodShortLabel(step.period)}
                </span>
                {step.current && (
                  <span className="rounded-full bg-primary-soft px-1.5 py-px text-[10.5px] font-semibold text-primary-strong">
                    Actual
                  </span>
                )}
                {dirty && (
                  <span className="ml-auto size-1.5 rounded-full bg-primary" aria-hidden />
                )}
              </span>
              <span className={cn("text-xs font-medium", STEP_TONE[display])}>
                <span className="hidden md:inline">{STEP_TEXT[display]}</span>
                <span className="sr-only">
                  {`, ${b.published + b.read} de ${b.total} publicados`}
                  {step.current ? ", período actual" : ""}
                  {dirty ? ", con cambios sin guardar" : ""}
                </span>
              </span>
              <span className="hidden md:block">
                <ProgressBar
                  complete={b.total - b.empty}
                  published={b.published + b.read}
                  total={b.total}
                />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------- */

/** Bar order (left to right) and filter chip order. */
const BAR_ORDER: RowStatus[] = ["read", "published", "draft", "empty"];
const CHIP_ORDER: RowStatus[] = ["empty", "draft", "published", "read"];

const SWATCH: Record<RowStatus, string> = {
  read: "bg-success",
  published: "bg-primary",
  draft: "bg-warning",
  empty: "bg-input",
};

/** Label of a status inside the summary (published means "not read yet"). */
function statusLabel(status: RowStatus, period: ReportPeriod): string {
  if (status === "published" && period !== "closing") return "Publicado, sin leer";
  return bimesterStatusLabel(status);
}

export function PeriodSummary({
  period,
  breakdown: b,
  filter,
  onFilterChange,
  publishHint = false,
  hiddenDirty = 0,
}: {
  period: ReportPeriod;
  breakdown: PeriodBreakdown;
  filter: SheetFilter;
  onFilterChange: (filter: SheetFilter) => void;
  /** Teacher sheet: point to "Enviar a Dirección" when drafts exist. */
  publishHint?: boolean;
  /** Rows with unsaved changes hidden by the filter. */
  hiddenDirty?: number;
}) {
  const [open, setOpen] = useState(false);
  const sentence = summarySentence(b, period, { publishHint });
  const allDone = b.total > 0 && b.empty + b.draft === 0;
  const SentenceIcon = allDone ? CheckCircle2 : CircleAlert;
  const pct = (n: number) => (b.total === 0 ? 0 : (n / b.total) * 100);

  return (
    <div className="flex flex-col gap-3 border-b border-border px-4 py-3 md:py-4">
      {/* Phones: one line, details on demand; an active filter stays visible. */}
      <div className="flex min-h-11 items-center gap-2 md:hidden">
        <p className="min-w-0 flex-1 text-[13px] leading-snug text-foreground">
          <span className="font-semibold text-navy">{periodLabel(period)}</span>
          {" · "}
          {compactSummary(b, period)}
        </p>
        {filter !== "all" && (
          <button
            type="button"
            onClick={() => onFilterChange("all")}
            aria-label={`Quitar filtro: ${statusLabel(filter, period)}`}
            className="inline-flex h-8 max-w-[45%] shrink-0 items-center gap-1 rounded-full border border-primary bg-primary-soft px-2.5 text-xs font-medium text-primary-strong"
          >
            <span className="truncate">Filtro: {statusLabel(filter, period)}</span>
            <X className="size-3.5 shrink-0" aria-hidden />
          </button>
        )}
        <button
          type="button"
          aria-expanded={open}
          aria-controls="sheet-summary-details"
          onClick={() => setOpen((o) => !o)}
          className="-mr-2 inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-primary-tint hover:text-navy focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
        >
          <ChevronDown
            className={cn("size-5 transition-transform duration-150", open && "rotate-180")}
            aria-hidden
          />
          <span className="sr-only">{open ? "Ocultar detalle" : "Ver detalle y filtros"}</span>
        </button>
      </div>

      <div
        id="sheet-summary-details"
        className={cn("flex-col gap-3 md:flex", open ? "flex" : "hidden")}
      >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-navy">{periodLabel(period)}</h2>
          <p aria-live="polite" className="mt-0.5 flex items-start gap-1.5 text-sm text-foreground">
            <SentenceIcon
              className={cn("mt-0.5 size-4 shrink-0", allDone ? "text-success" : "text-primary-strong")}
              aria-hidden
            />
            {sentence}
          </p>
        </div>
        <LowGradeHint />
      </div>

      {b.total > 0 && (
        <>
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted" aria-hidden>
            {BAR_ORDER.filter((s) => b[s] > 0).map((s) => (
              <button
                key={s}
                type="button"
                tabIndex={-1}
                title={`${statusLabel(s, period)}: ${b[s]}`}
                onClick={() => onFilterChange(filter === s ? "all" : s)}
                className={cn(
                  "h-full cursor-pointer border-r-2 border-card transition-opacity duration-150 last:border-r-0 hover:opacity-80",
                  SWATCH[s],
                  filter !== "all" && filter !== s && "opacity-35",
                )}
                style={{ width: `${pct(b[s])}%` }}
              />
            ))}
          </div>

          <div role="group" aria-label="Filtrar alumnos por estado" className="flex flex-wrap gap-1.5">
            <FilterChip active={filter === "all"} onClick={() => onFilterChange("all")}>
              Todos <Count n={b.total} />
            </FilterChip>
            {CHIP_ORDER.filter((s) => b[s] > 0).map((s) => (
              <FilterChip
                key={s}
                active={filter === s}
                onClick={() => onFilterChange(filter === s ? "all" : s)}
              >
                <span className={cn("size-2.5 rounded-[3px]", SWATCH[s])} aria-hidden />
                {statusLabel(s, period)} <Count n={b[s]} />
              </FilterChip>
            ))}
          </div>

          {hiddenDirty > 0 && (
            <p className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/20 bg-primary-soft px-3 py-2 text-[13px] text-navy">
              {hiddenDirty === 1
                ? "1 alumno con cambios sin guardar está oculto por el filtro."
                : `${hiddenDirty} alumnos con cambios sin guardar están ocultos por el filtro.`}{" "}
              Se guardarán igual.
              <Button size="xs" variant="outline" onClick={() => onFilterChange("all")}>
                Mostrar todos
              </Button>
            </p>
          )}
        </>
      )}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 sm:h-7 text-[12.5px] font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        active
          ? "border-primary bg-primary-soft text-primary-strong"
          : "border-border bg-card text-foreground/80 hover:border-input hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Count({ n }: { n: number }) {
  return <span className="font-semibold tabular-nums">{n}</span>;
}
