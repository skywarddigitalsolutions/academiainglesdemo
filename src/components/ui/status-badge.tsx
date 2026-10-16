import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type StatusTone = "neutral" | "success" | "warning" | "danger" | "info";

const TONES: Record<StatusTone, string> = {
  neutral: "border-border bg-slate-50 text-slate-600",
  success: "border-success-border bg-success-soft text-success",
  warning: "border-warning-border bg-warning-soft text-warning",
  danger: "border-danger-border bg-danger-soft text-danger",
  info: "border-blue-200 bg-blue-50 text-primary",
};

const DOTS: Record<StatusTone, string> = {
  neutral: "bg-slate-400",
  success: "bg-success",
  warning: "bg-amber-500",
  danger: "bg-danger",
  info: "bg-primary",
};

/** Soft, tinted badge. Status colors are only used through this component. */
export function StatusBadge({
  tone = "neutral",
  dot = false,
  className,
  title,
  children,
}: {
  tone?: StatusTone;
  dot?: boolean;
  className?: string;
  title?: string;
  children: ReactNode;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-md border px-2 text-xs font-medium whitespace-nowrap",
        TONES[tone],
        className,
      )}
    >
      {dot && <span className={cn("size-1.5 rounded-full", DOTS[tone])} aria-hidden />}
      {children}
    </span>
  );
}

export function statusDotClass(tone: StatusTone): string {
  return DOTS[tone];
}
