"use client";

import { useParams } from "next/navigation";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { ExamAgendaView } from "@/features/exams/exam-agenda";
import { ExamDetailView } from "@/features/exams/exam-detail";
import { useAsyncData } from "@/providers/use-async-data";

/** Container: read-only exam agenda of every course. */
export function AdminExamsContainer() {
  const { data, error, loading } = useAsyncData("admin-exams", (s) => s.admin.listExams());
  return (
    <>
      <PageHeader
        title="Exámenes"
        description="Agenda de evaluaciones de todos los cursos. Los docentes cargan y publican las notas."
      />
      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {data && (
        <ExamAgendaView agenda={data} hrefFor={(item) => `/admin/exams/${item.exam.id}`} />
      )}
    </>
  );
}

/** Container: grades of one exam, read-only for Dirección. */
export function AdminExamContainer() {
  const { examId } = useParams<{ examId: string }>();
  const { data, error, loading } = useAsyncData(`admin-exam:${examId}`, (s) =>
    s.admin.getExam(examId),
  );

  if (loading) return <LoadingState />;
  if (error || !data) {
    return <ErrorState message={error ?? "Examen no encontrado."} backHref="/admin/exams" />;
  }
  return (
    <ExamDetailView
      key={data.exam.id}
      detail={data}
      breadcrumbs={[{ label: "Exámenes", href: "/admin/exams" }, { label: data.exam.topic }]}
    />
  );
}
