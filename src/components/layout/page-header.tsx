"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { PageTrail, type Crumb } from "./breadcrumbs";

/**
 * Page title, short description and primary actions on the right. Nested
 * pages pass `breadcrumbs`: the ancestors show above the title (a back link
 * on phones), and an eyebrow equal to the parent is not repeated.
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
  const crumbs = breadcrumbs ?? [];
  const parentLabel = crumbs.length > 1 ? crumbs[crumbs.length - 2].label : null;
  const showEyebrow = eyebrow && eyebrow !== parentLabel;

  return (
    <div className="mb-5 flex flex-col gap-3 border-b border-border pb-4 print:hidden sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:gap-4 sm:pb-6">
      <div className="min-w-0">
        <PageTrail crumbs={crumbs} />
        {showEyebrow && (
          <div className="mb-2 text-xs font-semibold tracking-[0.12em] text-primary-strong uppercase">
            {eyebrow}
          </div>
        )}
        <h1 className="font-serif text-[1.75rem] leading-tight font-semibold tracking-[-0.015em] break-words text-navy sm:text-[2rem]">
          {title}
        </h1>
        {description && (
          <div className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </div>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2 empty:hidden">{actions}</div>}
    </div>
  );
}

export interface BandStat {
  label: string;
  value: ReactNode;
  href?: string;
}

/**
 * Compact welcome header of a panel home: tinted surface, serif title, one
 * line of description and the real totals as small inline figures.
 */
export function PageBand({
  title,
  eyebrow,
  description,
  stats,
}: {
  title: string;
  eyebrow?: ReactNode;
  description?: ReactNode;
  stats?: BandStat[];
  /** Accepted for symmetry with PageHeader; a home page has no ancestors. */
  breadcrumbs?: Crumb[];
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-primary/15 bg-primary-tint px-5 py-5 md:flex-row md:items-center md:justify-between md:gap-8 md:px-7 print:hidden">
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-1 text-xs font-semibold tracking-[0.12em] text-primary-strong uppercase">
            {eyebrow}
          </div>
        )}
        <h1 className="font-serif text-[1.65rem] leading-tight font-semibold tracking-[-0.015em] break-words text-navy sm:text-[1.85rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      {stats && stats.length > 0 && (
        <ul className="flex shrink-0 flex-wrap gap-x-6 gap-y-2 border-t border-primary/15 pt-3 md:border-t-0 md:border-l md:pt-0 md:pl-7">
          {stats.map((stat) => {
            const body = (
              <>
                <span className="font-serif text-xl leading-none font-semibold text-navy tabular-nums">
                  {stat.value}
                </span>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </>
            );
            return (
              <li key={stat.label}>
                {stat.href ? (
                  <Link
                    href={stat.href}
                    className="-mx-1.5 inline-flex min-h-11 items-baseline gap-1.5 rounded-md px-1.5 py-2 transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none md:flex-col md:items-start md:gap-1"
                  >
                    {body}
                  </Link>
                ) : (
                  <div className="inline-flex min-h-11 items-baseline gap-1.5 py-2 md:flex-col md:items-start md:gap-1">
                    {body}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
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
    <div className="mb-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
      <div className="min-w-0">
        <h2 className="font-serif text-lg leading-tight font-semibold text-navy">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions}
    </div>
  );
}
