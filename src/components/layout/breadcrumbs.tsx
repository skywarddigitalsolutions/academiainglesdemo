import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * Where the page sits, shown above its title (only for nested pages).
 * Phones: a single back link to the parent. Wider screens: the ancestors
 * as a trail (the current page is the title itself, so it is not repeated).
 */
export function PageTrail({ crumbs }: { crumbs: Crumb[] }) {
  const ancestors = crumbs.slice(0, -1);
  if (ancestors.length === 0) return null;
  const parent = ancestors[ancestors.length - 1];

  return (
    <nav aria-label="Ruta de navegación" className="mb-1.5 min-w-0">
      {parent.href && (
        <Link
          href={parent.href}
          className="-ml-2 inline-flex min-h-11 max-w-full items-center gap-1 rounded-md px-2 text-sm font-medium text-primary-strong hover:text-navy focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none sm:hidden"
        >
          <ChevronLeft className="size-4 shrink-0" aria-hidden />
          <span className="truncate">{parent.label}</span>
        </Link>
      )}
      <ol className="hidden min-w-0 flex-wrap items-center gap-1.5 text-[13px] sm:flex">
        {ancestors.map((crumb, i) => (
          <li key={`${crumb.label}-${i}`} className="flex min-w-0 items-center gap-1.5">
            {i > 0 && <ChevronRight className="size-3.5 shrink-0 text-slate-400" aria-hidden />}
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="truncate rounded-sm font-medium text-primary-strong transition-colors hover:text-navy hover:underline focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="truncate text-muted-foreground">{crumb.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
