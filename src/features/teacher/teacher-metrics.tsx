"use client";

import type { DashboardMetrics } from "@/application/dashboard";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { SectionHeading } from "@/components/layout/page-header";
import { BimesterChart } from "@/features/metrics/bimester-chart";
import { KpiRow } from "@/features/metrics/kpi-row";
import { PassFailByCourse } from "@/features/metrics/pass-fail-by-course";
import { RiskList } from "@/features/metrics/risk-list";
import { useAsyncData } from "@/providers/use-async-data";
import { useSession } from "@/providers/session-provider";

/** Container: "Métricas de mis cursos", built only from the courses the teacher teaches. */
export function TeacherMetrics() {
  const { state } = useSession();
  const teacherId = state.session?.userId ?? "";
  const { data, error, loading } = useAsyncData(`teacher-dashboard:${teacherId}`, (s) =>
    s.teacher.getDashboard(teacherId),
  );
  if (loading) return <LoadingState variant="cards" />;
  if (error) return <ErrorState message={error} />;
  if (!data || data.courses.length === 0) return null;
  return <MetricsSections metrics={data} />;
}

/** Presentational: the school-wide sections of the Tablero, over the teacher's courses. */
function MetricsSections({ metrics }: { metrics: DashboardMetrics }) {
  const hasNumeric = metrics.courses.some((c) => c.course.gradingType === "numeric");
  const withRisk = metrics.courses.filter((c) => c.atRisk.length > 0);
  return (
    <section className="mt-10 flex min-w-0 flex-col gap-6" aria-label="Métricas de mis cursos">
      <SectionHeading
        title="Métricas de mis cursos"
        description="Solo los cursos que usted dicta. Incluye las notas en borrador."
      />
      <KpiRow school={metrics.school} />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {hasNumeric && (
          <section className="min-w-0">
            <SectionHeading
              title="Promedio por bimestre"
              description="Solo cursos con notas numéricas (5° grado en adelante)."
            />
            <div className="surface-card px-5 pt-2 pb-4">
              <BimesterChart averages={metrics.bimesterAverages} />
            </div>
          </section>
        )}
        <section className="min-w-0">
          <SectionHeading
            title="Aprobados y desaprobados por curso"
            description="Aprueba quien tiene promedio de 6 o más. En los cursos conceptuales solo desaprueba quien tiene Desaprobado."
          />
          <div className="surface-card px-5 py-4">
            <PassFailByCourse courses={metrics.courses} />
          </div>
        </section>
      </div>

      <section className="min-w-0" aria-label="Alumnos en riesgo">
        <SectionHeading
          title="Alumnos con riesgo de rendir en marzo"
          description="Según las notas de los últimos bimestres."
        />
        {withRisk.length === 0 ? (
          <RiskList students={[]} />
        ) : (
          <div className="flex flex-col gap-6">
            {withRisk.map((c) => (
              <div key={c.course.id}>
                <h3 className="mb-2 font-serif text-xl font-semibold text-navy">{c.course.name}</h3>
                <RiskList students={c.atRisk} />
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
