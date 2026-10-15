import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  backHref,
  backLabel,
  actions,
}: {
  title: string;
  description?: ReactNode;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 print:hidden sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {backHref && (
          <Link
            href={backHref}
            className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-celeste-strong hover:underline"
          >
            <ChevronLeft className="size-4" aria-hidden />
            {backLabel ?? "Volver"}
          </Link>
        )}
        <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
        {description && (
          <div className="mt-1 text-sm text-muted-foreground">{description}</div>
        )}
        <div className="mt-3 h-0.5 w-16 bg-gold" aria-hidden />
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
