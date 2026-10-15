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
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-xl border bg-card px-6 py-10 text-center">
      <AlertTriangle className="size-8 text-destructive" aria-hidden />
      <p className="text-sm text-foreground">{message}</p>
      {backHref && (
        <Button asChild variant="outline" size="lg">
          <Link href={backHref}>{backLabel}</Link>
        </Button>
      )}
    </div>
  );
}
