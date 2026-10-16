import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function LoadingState({
  label = "Cargando…",
  fullScreen = false,
}: {
  label?: string;
  fullScreen?: boolean;
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground",
        fullScreen && "min-h-screen bg-background",
      )}
    >
      <Loader2 className="size-4 animate-spin" aria-hidden />
      <span>{label}</span>
    </div>
  );
}
