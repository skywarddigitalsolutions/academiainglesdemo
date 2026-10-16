import type { BimesterStatus } from "@/domain/report-card";
import { StatusBadge, statusDotClass, type StatusTone } from "@/components/ui/status-badge";

const STAFF_LABELS: Record<BimesterStatus, string> = {
  empty: "Sin cargar",
  draft: "Borrador",
  "pending-approval": "Esperando aprobación",
  approved: "Publicado",
  acknowledged: "Leído por la familia",
};

const COMPACT_LABELS: Record<BimesterStatus, string> = {
  empty: "—",
  draft: "Borrador",
  "pending-approval": "Firmado",
  approved: "Publicado",
  acknowledged: "Leído",
};

const TONES: Record<BimesterStatus, StatusTone> = {
  empty: "neutral",
  draft: "neutral",
  "pending-approval": "warning",
  approved: "success",
  acknowledged: "success",
};

export function bimesterStatusLabel(status: BimesterStatus): string {
  return STAFF_LABELS[status];
}

/** Dot color for a bimester status (used by the editor segmented control). */
export function bimesterStatusDot(status: BimesterStatus): string {
  return status === "empty" ? "bg-slate-300" : statusDotClass(TONES[status]);
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
    <StatusBadge
      tone={TONES[status]}
      dot={status !== "empty"}
      className={className}
      title={STAFF_LABELS[status]}
    >
      {compact ? COMPACT_LABELS[status] : STAFF_LABELS[status]}
    </StatusBadge>
  );
}
