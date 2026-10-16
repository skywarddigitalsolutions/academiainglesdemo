"use client";

import { useParams } from "next/navigation";
import { Printer } from "lucide-react";
import type { StudentReportCard } from "@/application/shared";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { getBimesterStatus } from "@/domain/report-card";
import { fullName } from "@/domain/student";
import { displayName } from "@/domain/user";
import { BimesterStatusBadge } from "@/features/report-card/bimester-status-badge";
import { ReportCardSheet } from "@/features/report-card/report-card-sheet";
import { useAsyncData } from "@/providers/use-async-data";

interface Data extends StudentReportCard {
  teacherNames: string[];
}

/** Container: read-only report card for Dirección (includes drafts). */
export function AdminReportCardContainer() {
  const { studentId } = useParams<{ studentId: string }>();
  const { data, error, loading } = useAsyncData(
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

  if (loading) return <LoadingState variant="cards" />;
  if (error || !data) {
    return <ErrorState message={error ?? "Alumno no encontrado."} backHref="/admin/students" />;
  }
  return <AdminReportCardView data={data} />;
}

function AdminReportCardView({ data }: { data: Data }) {
  const { student, course, card, teacherNames } = data;

  return (
    <>
      <PageHeader
        title={fullName(student)}
        eyebrow={course.name}
        breadcrumbs={[
          { label: "Alumnos", href: "/admin/students" },
          { label: fullName(student) },
        ]}
        description="Vista de Dirección: incluye los borradores que las familias todavía no ven."
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
        hiddenDescription="El docente todavía no cargó este bimestre."
        cuatrimestralExam={card.closing.cuatrimestralExam}
        closing={card.closing.result !== null ? card.closing : null}
        renderBimesterBadge={(b) =>
          b.data && <BimesterStatusBadge status={getBimesterStatus(b.data)} />
        }
      />
    </>
  );
}
