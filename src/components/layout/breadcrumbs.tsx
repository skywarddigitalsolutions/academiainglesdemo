"use client";

import Link from "next/link";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface Crumb {
  label: string;
  href?: string;
}

interface BreadcrumbContextValue {
  crumbs: Crumb[];
  setCrumbs: (crumbs: Crumb[]) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [crumbs, setCrumbs] = useState<Crumb[]>([]);
  const value = useMemo(() => ({ crumbs, setCrumbs }), [crumbs]);
  return <BreadcrumbContext.Provider value={value}>{children}</BreadcrumbContext.Provider>;
}

/** Registers the breadcrumb trail of the current page in the top bar. */
export function useBreadcrumbs(crumbs: Crumb[]) {
  const setCrumbs = useContext(BreadcrumbContext)?.setCrumbs;
  const serialized = JSON.stringify(crumbs);

  useEffect(() => {
    if (!setCrumbs) return;
    setCrumbs(JSON.parse(serialized) as Crumb[]);
    return () => setCrumbs([]);
  }, [serialized, setCrumbs]);
}

/** Top bar trail. On small screens it collapses to a "back" link. */
export function Breadcrumbs() {
  const crumbs = useContext(BreadcrumbContext)?.crumbs ?? [];
  if (crumbs.length === 0) return null;

  const parent = crumbs.length > 1 ? crumbs[crumbs.length - 2] : null;
  const current = crumbs[crumbs.length - 1];

  return (
    <nav aria-label="Ruta de navegación" className="min-w-0 flex-1">
      {/* Mobile: back link + current page */}
      <div className="flex min-w-0 items-center gap-1 text-sm sm:hidden">
        {parent?.href ? (
          <Link
            href={parent.href}
            className="inline-flex min-w-0 items-center gap-1 font-medium text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{parent.label}</span>
          </Link>
        ) : (
          <span className="truncate font-medium text-foreground">{current.label}</span>
        )}
      </div>

      {/* Desktop: full trail */}
      <ol className="hidden min-w-0 items-center gap-1.5 text-sm sm:flex">
        {crumbs.map((crumb, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={`${crumb.label}-${i}`} className="flex min-w-0 items-center gap-1.5">
              {i > 0 && (
                <ChevronRight className="size-3.5 shrink-0 text-slate-400" aria-hidden />
              )}
              {last || !crumb.href ? (
                <span
                  aria-current={last ? "page" : undefined}
                  className={
                    last
                      ? "truncate font-medium text-foreground"
                      : "truncate text-muted-foreground"
                  }
                >
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="truncate text-muted-foreground transition-colors hover:text-foreground"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
