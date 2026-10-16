import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Skeleton placeholder shown while a page loads.
 * `variant="table"` mimics a dense table, `"cards"` a grid of cards.
 */
export function LoadingState({
  label = "Cargando…",
  fullScreen = false,
  variant = "table",
}: {
  label?: string;
  fullScreen?: boolean;
  variant?: "table" | "cards";
}) {
  if (fullScreen) {
    return (
      <div role="status" className="flex min-h-screen bg-background">
        <span className="sr-only">{label}</span>
        <div className="hidden w-64 shrink-0 bg-sidebar md:block" />
        <div className="flex-1">
          <div className="h-14 border-b bg-card" />
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="mt-3 h-4 w-80 max-w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div role="status" className="flex flex-col gap-6">
      <span className="sr-only">{label}</span>
      {variant === "cards" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="surface-card p-5">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="mt-2 h-4 w-48" />
              <div className="mt-6 flex flex-col gap-3">
                {[0, 1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-3 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="surface-card overflow-hidden">
          <div className="flex h-10 items-center gap-6 border-b bg-slate-50/80 px-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-16" />
          </div>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={cn("flex h-12 items-center gap-6 px-4", i > 0 && "border-t")}
            >
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="ml-auto h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
