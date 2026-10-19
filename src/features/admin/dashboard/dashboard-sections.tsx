import type { DashboardMetrics } from "@/application/dashboard";
import type { ExamAgenda } from "@/application/exams";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { SectionHeading } from "@/components/layout/page-header";
import { ExamCalendar } from "@/features/exams/exam-calendar";
import { BimesterChart } from "./bimester-chart";
import { CourseComparison } from "./course-comparison";
import { CourseDetail } from "./course-detail";
import { KpiRow } from "./kpi-row";
import { PassFailByCourse } from "./pass-fail-by-course";

export interface DashboardExams {
  agenda: ExamAgenda | null;
  loading: boolean;
  error: string | null;
}

/** Academic part of the Tablero, top to bottom. Add new sections here. */
export function DashboardSections({
  metrics,
  exams,
}: {
  metrics: DashboardMetrics;
  exams: DashboardExams;
}) {
  return (
    <div className="flex flex-col gap-10">
      <KpiRow school={metrics.school} />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section className="min-w-0">
          <SectionHeading
            title="Promedio por bimestre"
            description="Promedio de todas las notas cargadas en cada bimestre."
          />
          <div className="surface-card px-5 pb-4 pt-2">
            <BimesterChart averages={metrics.bimesterAverages} />
          </div>
        </section>
        <section className="min-w-0">
          <SectionHeading
            title="Aprobados y desaprobados por curso"
            description="Aprueba quien tiene promedio de 6 o más."
          />
          <div className="surface-card px-5 py-4">
            <PassFailByCourse courses={metrics.courses} />
          </div>
        </section>
      </div>

      <CourseComparison courses={metrics.courses} />
      <CourseDetail courses={metrics.courses} />

      {exams.loading && <LoadingState variant="cards" />}
      {exams.error && <ErrorState message={exams.error} />}
      {exams.agenda && (
        <ExamCalendar
          title="Calendario de exámenes"
          description="Todos los exámenes de todos los cursos."
          items={exams.agenda.items}
          courses={exams.agenda.courses}
          today={exams.agenda.today}
          hrefFor={(item) => `/admin/exams/${item.exam.id}`}
        />
      )}
    </div>
  );
}
