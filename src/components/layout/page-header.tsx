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
  eyebrow,
  description,
  actions,
  breadcrumbs,
}: {
  title: string;
  eyebrow?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: Crumb[];
}) {
  useBreadcrumbs(breadcrumbs ?? [{ label: title }]);

  return (
    <div className="mb-8 flex flex-col gap-4 print:hidden sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {eyebrow}
          </div>
        )}
        <h1 className="text-[1.625rem] leading-tight font-semibold tracking-[-0.02em]">{title}</h1>
        {description && (
          <div className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</div>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/** Small section heading inside a page. */
export function SectionHeading({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions}
    </div>
  );
}
