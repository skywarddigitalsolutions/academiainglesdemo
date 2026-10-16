import type { BimesterStatus, ClosingStatus } from "@/domain/report-card";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";

type AnyStatus = BimesterStatus | ClosingStatus;

const LABELS: Record<AnyStatus, string> = {
  empty: "Sin cargar",
  draft: "Borrador",
  published: "Publicado",
  read: "Leído",
};

const TONES: Record<AnyStatus, StatusTone> = {
  empty: "neutral",
  draft: "warning",
  published: "info",
  read: "success",
};

export function bimesterStatusLabel(status: AnyStatus): string {
  return LABELS[status];
}

export function BimesterStatusBadge({
  status,
  className,
  title,
}: {
  status: AnyStatus;
  className?: string;
  title?: string;
}) {
  return (
    <StatusBadge
      tone={TONES[status]}
      dot={status !== "empty"}
      className={className}
      title={title ?? LABELS[status]}
    >
      {LABELS[status]}
    </StatusBadge>
  );
}
