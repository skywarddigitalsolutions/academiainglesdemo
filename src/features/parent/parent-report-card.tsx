"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { CheckCheck, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";
import type { ParentReportCard } from "@/application/parent-use-cases";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import type { BimesterNumber } from "@/domain/report-card";
import { ReportCardSheet, type SheetBimester } from "@/features/report-card/report-card-sheet";
import { errorMessage } from "@/lib/error-message";
import { bimesterLabel, formatDateTime } from "@/lib/format";
import { getServices } from "@/providers/services";
import { useAsyncData } from "@/providers/use-async-data";
import { useSession } from "@/providers/session-provider";

/** Container: loads the parent view of a report card and handles "Leído". */
export function ParentReportCardContainer() {
  const { studentId } = useParams<{ studentId: string }>();
  const { state } = useSession();
  const parentId = state.session?.userId ?? "";
  const { data, error, loading, setData } = useAsyncData(
    `parent-card:${parentId}:${studentId}`,
    (s) => s.parent.getReportCard(parentId, studentId),
  );

  if (loading) return <LoadingState />;
  if (error || !data) {
    return <ErrorState message={error ?? "Boletín no encontrado."} backHref="/parent" />;
  }

  async function acknowledge(n: BimesterNumber) {
    try {
      setData(await getServices().parent.acknowledgeBimester(parentId, studentId, n));
      toast.success(`${bimesterLabel(n)} marcado como leído.`);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return <ParentReportCardView data={data} onAcknowledge={acknowledge} />;
}

/** Presentational: printed-style report card with acknowledgement buttons. */
function ParentReportCardView({
  data,
  onAcknowledge,
}: {
  data: ParentReportCard;
  onAcknowledge: (n: BimesterNumber) => Promise<void>;
}) {
  const { student, course, teacherNames, view } = data;

  return (
    <>
      <PageHeader
        title={`Boletín de ${student.firstName}`}
        breadcrumbs={[
          { label: "Mis hijos", href: "/parent" },
          { label: `${student.firstName} ${student.lastName}` },
        ]}
        description="Solo se muestran los bimestres aprobados por Dirección."
        actions={
          <Button variant="outline" onClick={() => window.print()}>
            <Printer aria-hidden />
            Imprimir
          </Button>
        }
      />
      <ReportCardSheet
        student={student}
        course={course}
        teacherNames={teacherNames}
        year={view.year}
        bimesters={view.bimesters}
        cuatrimestralExam={view.cuatrimestralExam}
        closing={view.closing}
        renderBimesterBadge={(b) => <ParentBadge bimester={b} />}
        renderBimesterActions={(b) => (
          <AcknowledgeAction bimester={b} onAcknowledge={onAcknowledge} />
        )}
      />
    </>
  );
}

function ParentBadge({ bimester }: { bimester: SheetBimester }) {
  if (!bimester.visible) return <StatusBadge>Pendiente</StatusBadge>;
  if (bimester.data?.signatures.parent.signed) {
    return (
      <StatusBadge tone="success" dot>
        Leído
      </StatusBadge>
    );
  }
  return (
    <StatusBadge tone="warning" dot>
      Nuevo
    </StatusBadge>
  );
}

function AcknowledgeAction({
  bimester,
  onAcknowledge,
}: {
  bimester: SheetBimester;
  onAcknowledge: (n: BimesterNumber) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  if (!bimester.visible || !bimester.data) return null;
  const parent = bimester.data.signatures.parent;
  if (parent.signed) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-success">
        <CheckCheck className="size-4" aria-hidden />
        Leído / Notificado el {formatDateTime(parent.at)}
      </p>
    );
  }
  return (
    <Button
      className="w-full sm:w-auto"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await onAcknowledge(bimester.number);
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? <Loader2 className="animate-spin" aria-hidden /> : <CheckCheck aria-hidden />}
      Marcar como leído
    </Button>
  );
}
