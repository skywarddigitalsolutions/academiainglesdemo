import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorState({
  message,
  backHref,
  backLabel = "Volver",
}: {
  message: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-lg border bg-card px-6 py-10 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-danger-soft">
        <AlertTriangle className="size-5 text-danger" aria-hidden />
      </span>
      <p className="text-sm text-foreground">{message}</p>
      {backHref && (
        <Button asChild variant="outline">
          <Link href={backHref}>{backLabel}</Link>
        </Button>
      )}
    </div>
  );
}
