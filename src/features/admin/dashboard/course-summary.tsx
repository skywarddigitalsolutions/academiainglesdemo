import type { CourseMetrics } from "@/application/dashboard";
import { SectionHeading } from "@/components/layout/page-header";
import { BimesterChart } from "./bimester-chart";
import { countLabel, formatPercent, scoreLabel } from "./dashboard-model";
import { RiskList } from "./risk-list";

function Tile({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <li className="surface-card min-w-0 p-4">
      <p className="font-serif text-3xl leading-none font-semibold text-navy tabular-nums">
        {value}
      </p>
      <p className="mt-2 text-base font-medium text-foreground">{label}</p>
      {helper && <p className="text-sm text-muted-foreground">{helper}</p>}
    </li>
  );
}

/** Course summary for Dirección: key figures, evolution by bimester and who is at risk. */
export function CourseSummary({ metrics }: { metrics: CourseMetrics }) {
  const numeric = metrics.course.gradingType === "numeric";
  const graded = metrics.passed + metrics.failed;
  const ofGraded = `de ${countLabel(graded, "alumno", "alumnos")} con notas`;

  return (
    <section aria-label="Resumen del curso" className="mt-6 mb-8 flex flex-col gap-6">
      <div>
        <SectionHeading
          title="Resumen del curso"
          description="Incluye las notas en borrador."
        />
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Tile
            label={numeric ? "Promedio del curso" : "Concepto del curso"}
            value={scoreLabel(metrics.average, metrics.course.gradingType)}
          />
          <Tile
            label="Aprobados"
            value={String(metrics.passed)}
            helper={numeric ? `${formatPercent(metrics.passRate)} ${ofGraded}` : ofGraded}
          />
          <Tile
            label="Desaprobados"
            value={String(metrics.failed)}
            helper={numeric ? `${formatPercent(metrics.failRate)} ${ofGraded}` : ofGraded}
          />
          <Tile
            label="En riesgo"
            value={String(metrics.atRisk.length)}
            helper="de rendir en marzo"
          />
        </ul>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section className="min-w-0">
          <SectionHeading
            title="Promedio por bimestre"
            description={
              numeric
                ? "Promedio de las notas cargadas en cada bimestre."
                : "Concepto típico de cada bimestre (la nota del medio)."
            }
          />
          <div className="surface-card px-5 pb-4 pt-2">
            <BimesterChart
              averages={metrics.bimesterAverages}
              gradingType={metrics.course.gradingType}
            />
          </div>
        </section>
        <section className="min-w-0">
          <SectionHeading
            title="Alumnos con riesgo de rendir en marzo"
            description="Según las notas de los últimos bimestres."
          />
          <RiskList students={metrics.atRisk} />
        </section>
      </div>
    </section>
  );
}
