import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-dashed border-slate-300 bg-card/60 px-6 py-14 text-center">
      {Icon && (
        <span className="mb-3 flex size-10 items-center justify-center rounded-lg border border-slate-200 bg-card shadow-card">
          <Icon className="size-[18px] text-slate-500" aria-hidden />
        </span>
      )}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
