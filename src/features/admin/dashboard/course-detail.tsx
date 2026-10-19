"use client";

import { useState } from "react";
import type { CourseMetrics } from "@/application/dashboard";
import { SectionHeading } from "@/components/layout/page-header";
import { BimesterChart } from "./bimester-chart";
import { formatPercent } from "./dashboard-model";
import { RiskList } from "./risk-list";
import { SegmentedControl } from "./segmented-control";
import { StudentProgressTable } from "./student-progress-table";

function MiniKpi({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <li className="surface-card p-3">
      <p className="font-serif text-2xl leading-none font-semibold text-navy tabular-nums">
        {value}
      </p>
      <p className="mt-1.5 text-sm font-medium text-foreground">{label}</p>
      {helper && <p className="text-sm text-muted-foreground">{helper}</p>}
    </li>
  );
}

function Detail({ metrics }: { metrics: CourseMetrics }) {
  return (
    <div className="flex flex-col gap-8">
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <MiniKpi
          label="Promedio del curso"
          value={metrics.average === null ? "—" : String(metrics.average).replace(".", ",")}
        />
        <MiniKpi
          label="Aprobados"
          value={String(metrics.passed)}
          helper={formatPercent(metrics.passRate)}
        />
        <MiniKpi
          label="Desaprobados"
          value={String(metrics.failed)}
          helper={formatPercent(metrics.failRate)}
        />
        <MiniKpi
          label="Inasistencias"
          value={String(metrics.absences)}
          helper={
            metrics.absencesPerStudent === null
              ? undefined
              : `${String(metrics.absencesPerStudent).replace(".", ",")} por alumno`
          }
        />
        <MiniKpi label="Asistencia estimada" value={formatPercent(metrics.attendanceRate)} />
      </ul>

      <section>
        <SectionHeading title="Promedio por bimestre" />
        <div className="surface-card px-5 pb-4 pt-2">
          <BimesterChart averages={metrics.bimesterAverages} />
        </div>
      </section>

      <section id="riesgo" className="scroll-mt-20">
        <SectionHeading
          title="Alumnos con riesgo de rendir en marzo"
          description="Según promedio, últimos bimestres, caída de notas y asistencia estimada."
        />
        <RiskList students={metrics.atRisk} />
      </section>

      <section>
        <SectionHeading
          title="Progreso de los alumnos"
          description="El cambio compara el último bimestre con nota contra el anterior."
        />
        <StudentProgressTable key={metrics.course.id} metrics={metrics} />
      </section>
    </div>
  );
}

/** Course selector plus the detail of the chosen course. */
export function CourseDetail({ courses }: { courses: CourseMetrics[] }) {
  const [selectedId, setSelectedId] = useState(courses[0]?.course.id ?? "");
  const selected = courses.find((c) => c.course.id === selectedId) ?? courses[0];
  if (!selected) return null;

  return (
    <section className="min-w-0">
      <SectionHeading title="Detalle por curso" description="Seleccione un curso para ver sus alumnos." />
      <div className="mb-5">
        <SegmentedControl
          label="Curso"
          options={courses.map((c) => ({ value: c.course.id, label: c.course.name }))}
          value={selected.course.id}
          onChange={setSelectedId}
        />
      </div>
      <Detail metrics={selected} />
    </section>
  );
}
