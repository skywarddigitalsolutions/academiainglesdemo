"use client";

import type { ReactNode } from "react";
import { useBreadcrumbs, type Crumb } from "./breadcrumbs";

/**
 * Page title, short description and primary action on the right.
 * It also publishes the breadcrumb trail shown in the top bar; when no trail
 * is given, the title itself is used.
 */
export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: Crumb[];
}) {
  useBreadcrumbs(breadcrumbs ?? [{ label: title }]);

  return (
    <div className="mb-8 flex flex-col gap-4 print:hidden sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description && (
          <div className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</div>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
