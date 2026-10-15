import { CheckCircle2, Circle } from "lucide-react";
import type { Signature } from "@/domain/report-card";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export function SignatureLine({
  label,
  signature,
  pendingText = "Pendiente",
}: {
  label: string;
  signature: Signature;
  pendingText?: string;
}) {
  return (
    <div className="flex items-start gap-2 text-xs">
      {signature.signed ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
      ) : (
        <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground/60" aria-hidden />
      )}
      <div>
        <p className="font-medium text-navy">{label}</p>
        <p className={cn(signature.signed ? "text-foreground" : "text-muted-foreground")}>
          {signature.signed ? formatDateTime(signature.at) : pendingText}
        </p>
      </div>
    </div>
  );
}
