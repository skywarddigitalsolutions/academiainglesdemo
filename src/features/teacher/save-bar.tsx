import type { ReactNode } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

/**
 * Sticky footer of an editable card: save status on the left, actions on the
 * right. It bleeds to the card edges (cards use `p-5 sm:p-6`).
 */
export function SaveBar({
  dirty,
  saving,
  children,
}: {
  dirty: boolean;
  saving: boolean;
  children: ReactNode;
}) {
  return (
    <div className="sticky bottom-0 z-10 -mx-5 -mb-5 mt-8 flex flex-col gap-3 rounded-b-lg border-t bg-card/95 px-5 py-3 backdrop-blur sm:-mx-6 sm:-mb-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p aria-live="polite" className="flex items-center gap-2 text-sm">
        {saving ? (
          <>
            <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />
            <span className="text-muted-foreground">Guardando…</span>
          </>
        ) : dirty ? (
          <>
            <span className="size-2 rounded-full bg-amber-500" aria-hidden />
            <span className="font-medium text-warning">Cambios sin guardar</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="size-4 text-success" aria-hidden />
            <span className="text-muted-foreground">Guardado</span>
          </>
        )}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">{children}</div>
    </div>
  );
}
