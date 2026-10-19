import type { DashboardMetrics } from "@/application/dashboard";
import { SectionHeading } from "@/components/layout/page-header";
import { BimesterChart } from "./bimester-chart";
import { CourseComparison } from "./course-comparison";
import { KpiRow } from "./kpi-row";
import { PassFailByCourse } from "./pass-fail-by-course";

/** Metrics and course comparison of the Tablero, top to bottom. Add new sections here. */
export function DashboardSections({ metrics }: { metrics: DashboardMetrics }) {
  return (
    <div className="flex flex-col gap-10">
      <section className="flex min-w-0 flex-col gap-6" aria-label="Métricas">
        <SectionHeading title="Métricas" description="Incluye las notas en borrador." />
        <KpiRow school={metrics.school} />

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <section className="min-w-0">
            <SectionHeading
              title="Promedio por bimestre"
              description="Solo cursos con notas numéricas (5° grado en adelante)."
            />
            <div className="surface-card px-5 pb-4 pt-2">
              <BimesterChart averages={metrics.bimesterAverages} />
            </div>
          </section>
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
      </section>

      <CourseComparison courses={metrics.courses} />
    </div>
  );
}
