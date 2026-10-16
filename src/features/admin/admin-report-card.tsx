"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { CheckCheck, Loader2, PenLine, Printer } from "lucide-react";
import { toast } from "sonner";
import type { StudentReportCard } from "@/application/shared";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  getBimesterStatus,
  type BimesterNumber,
  type ReportCard,
} from "@/domain/report-card";
import { fullName } from "@/domain/student";
import { displayName } from "@/domain/user";
import { BimesterStatusBadge } from "@/features/report-card/bimester-status-badge";
import { ReportCardSheet } from "@/features/report-card/report-card-sheet";
import { errorMessage } from "@/lib/error-message";
import { bimesterLabel } from "@/lib/format";
import { getServices } from "@/providers/services";
import { useAsyncData } from "@/providers/use-async-data";

interface Data extends StudentReportCard {
  teacherNames: string[];
}

/** Container: full report card for the director, with approval actions. */
export function AdminReportCardContainer() {
  const { studentId } = useParams<{ studentId: string }>();
  const { data, error, loading, setData } = useAsyncData(
    `admin-card:${studentId}`,
    async (s): Promise<Data> => {
      const [card, teachers] = await Promise.all([
        s.admin.getReportCard(studentId),
        s.admin.listTeachers(),
      ]);
      return {
        ...card,
        teacherNames: teachers
          .filter((t) => card.course.teacherIds.includes(t.teacher.id))
          .map((t) => displayName(t.teacher)),
      };
    },
  );

  if (loading) return <LoadingState />;
  if (error || !data) {
    return <ErrorState message={error ?? "Alumno no encontrado."} backHref="/admin/students" />;
  }

  async function run(action: () => Promise<ReportCard>, success: string) {
    try {
      const card = await action();
      setData({ ...data!, card });
      toast.success(success);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <AdminReportCardView
      data={data}
      onApprove={(n) =>
        run(
          () => getServices().admin.approveBimester(studentId, n),
          `${bimesterLabel(n)} aprobado y publicado a la familia.`,
        )
      }
      onSignClosing={() =>
        run(() => getServices().admin.signClosing(studentId), "Cierre firmado por Dirección.")
      }
    />
  );
}

function AdminReportCardView({
  data,
  onApprove,
  onSignClosing,
}: {
  data: Data;
  onApprove: (n: BimesterNumber) => Promise<void>;
  onSignClosing: () => Promise<void>;
}) {
  const { student, course, card, teacherNames } = data;
  const closingReady =
    card.closing.result !== null &&
    card.closing.finalResult !== null &&
    !card.closing.directorSignature.signed;

  return (
    <>
      <PageHeader
        title={fullName(student)}
        breadcrumbs={[
          { label: "Alumnos", href: "/admin/students" },
          { label: fullName(student) },
        ]}
        description={`Vista de Dirección · ${course.name} · Se muestran todos los bimestres, incluso los no publicados.`}
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
        year={card.year}
        bimesters={card.bimesters.map((b) => ({
          number: b.number,
          visible: getBimesterStatus(b) !== "empty",
          data: b,
        }))}
        hiddenText="Sin cargar"
        cuatrimestralExam={card.closing.cuatrimestralExam}
        closing={card.closing.result !== null ? card.closing : null}
        renderBimesterBadge={(b) => b.data && <BimesterStatusBadge status={getBimesterStatus(b.data)} />}
        renderBimesterActions={(b) =>
          b.data && getBimesterStatus(b.data) === "pending-approval" ? (
            <ActionButton icon={CheckCheck} label="Aprobar y publicar" onClick={() => onApprove(b.number)} />
          ) : null
        }
        closingActions={
          closingReady ? (
            <ActionButton icon={PenLine} label="Firmar cierre" onClick={onSignClosing} />
          ) : null
        }
      />
    </>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof CheckCheck;
  label: string;
  onClick: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      className="w-full sm:w-auto"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await onClick();
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Icon aria-hidden />}
      {label}
    </Button>
  );
}
