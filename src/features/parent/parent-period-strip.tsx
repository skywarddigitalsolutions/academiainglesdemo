import { Circle, CircleCheck, CircleDot } from "lucide-react";
import { periodShortLabel } from "@/features/report-card/period";
import { cn } from "@/lib/utils";
import type { ParentPeriodState, ParentPeriodStep } from "./parent-model";

const STATE_TEXT: Record<ParentPeriodState, string> = {
  new: "Nuevo",
  read: "Leído",
  published: "Publicado",
  pending: "Aún no publicado",
};

const STATE_TONE: Record<ParentPeriodState, string> = {
  new: "text-primary-strong",
  read: "text-success",
  published: "text-primary-strong",
  pending: "text-muted-foreground",
};

function ParentStateIcon({ state }: { state: ParentPeriodState }) {
  const Icon = state === "new" ? CircleDot : state === "pending" ? Circle : CircleCheck;
  return <Icon className={cn("size-3.5 shrink-0", STATE_TONE[state])} aria-hidden />;
}

/** Compact, non-interactive period summary for the home cards. */
export function ParentPeriodStrip({ steps }: { steps: ParentPeriodStep[] }) {
  return (
    <ol className="grid grid-cols-5 gap-1" aria-label="Estado de los períodos">
      {steps.map((step) => (
        <li
          key={String(step.period)}
          className={cn(
            "flex flex-col items-center gap-1 rounded-md px-1 py-1.5 text-center",
            step.state === "new" ? "bg-primary-soft" : "bg-primary-tint",
          )}
        >
          <ParentStateIcon state={step.state} />
          <span
            className={cn(
              "text-[11px] leading-none font-semibold",
              step.state === "pending" ? "text-muted-foreground" : "text-navy",
            )}
          >
            {periodShortLabel(step.period)}
          </span>
          <span className="sr-only">: {STATE_TEXT[step.state]}</span>
        </li>
      ))}
    </ol>
  );
}
