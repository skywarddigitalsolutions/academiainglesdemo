import type { ReactNode } from "react";
import { AlertTriangle, CalendarClock, Check, CheckCircle2 } from "lucide-react";
import type { StatusTone } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import { guideSteps } from "./exam-detail-model";

const PANEL_TONES: Record<StatusTone, string> = {
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
  success: "border-success-border bg-success-soft text-success",
  warning: "border-warning-border bg-warning-soft text-warning",
  danger: "border-danger-border bg-danger-soft text-danger",
  info: "border-primary/20 bg-primary-tint text-primary-strong",
};

const PANEL_ICONS = { info: CalendarClock, warning: AlertTriangle, success: CheckCircle2 } as const;

/** Full-width message about the state of the exam: icon + text, never color alone. */
export function ExamStatusPanel({
  tone,
  title,
  children,
}: {
  tone: "info" | "warning" | "success";
  title: string;
  children?: ReactNode;
}) {
  const Icon = PANEL_ICONS[tone];
  return (
    <section
      className={cn("mb-6 flex items-start gap-4 rounded-xl border px-5 py-4", PANEL_TONES[tone])}
      aria-label="Estado del examen"
    >
      <Icon className="mt-0.5 size-6 shrink-0" aria-hidden />
      <div>
        <p className="text-base leading-snug font-semibold">{title}</p>
        {children && <p className="mt-1 text-[15px] leading-relaxed text-foreground/80">{children}</p>}
      </div>
    </section>
  );
}

/** The three steps of the grade entry; the current one is highlighted. */
export function GradingGuide({
  allGraded,
  dirty,
  published,
}: {
  allGraded: boolean;
  dirty: boolean;
  published: boolean;
}) {
  const steps = guideSteps({ allGraded, dirty, published });
  return (
    <nav aria-label="Pasos para cargar las notas" className="surface-card mb-6 px-5 py-4">
      <ol className="grid gap-3 sm:grid-cols-3">
        {steps.map((step, i) => (
          <li
            key={step.label}
            aria-current={step.state === "current" ? "step" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5",
              step.state === "current" && "bg-primary-soft",
            )}
          >
            <span
              className={cn(
                "inline-flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-base font-semibold",
                step.state === "done" && "border-success bg-success text-white",
                step.state === "current" && "border-primary bg-primary text-primary-foreground",
                step.state === "todo" && "border-slate-300 bg-card text-slate-500",
              )}
            >
              {step.state === "done" ? <Check className="size-5" aria-hidden /> : i + 1}
            </span>
            <span
              className={cn(
                "text-[15px] leading-snug",
                step.state === "todo" ? "text-muted-foreground" : "font-semibold text-navy",
              )}
            >
              {step.label}
              <span className="sr-only">
                {step.state === "done" ? " (hecho)" : step.state === "current" ? " (paso actual)" : " (pendiente)"}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
