import type { BimesterStatus } from "@/domain/report-card";
import { cn } from "@/lib/utils";

const STAFF_LABELS: Record<BimesterStatus, string> = {
  empty: "Sin cargar",
  draft: "Borrador",
  "pending-approval": "Esperando aprobación",
  approved: "Publicado",
  acknowledged: "Leído por la familia",
};

const STYLES: Record<BimesterStatus, string> = {
  empty: "bg-muted text-muted-foreground",
  draft: "bg-warning-bg text-warning",
  "pending-approval": "bg-celeste-light text-navy ring-1 ring-celeste",
  approved: "bg-success-bg text-success",
  acknowledged: "bg-success-bg text-success",
};

export function bimesterStatusLabel(status: BimesterStatus): string {
  return STAFF_LABELS[status];
}

export function BimesterStatusBadge({
  status,
  className,
  compact = false,
}: {
  status: BimesterStatus;
  className?: string;
  compact?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        STYLES[status],
        className,
      )}
      title={STAFF_LABELS[status]}
    >
      {compact ? COMPACT_LABELS[status] : STAFF_LABELS[status]}
    </span>
  );
}

const COMPACT_LABELS: Record<BimesterStatus, string> = {
  empty: "—",
  draft: "Borrador",
  "pending-approval": "Firmado",
  approved: "Publicado",
  acknowledged: "Leído",
};
