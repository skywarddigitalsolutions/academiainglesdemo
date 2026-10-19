import Link from "next/link";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { CourseMetrics } from "@/application/dashboard";
import { SectionHeading } from "@/components/layout/page-header";
import { displayName } from "@/domain/user";
import { cn } from "@/lib/utils";
import { formatPercent, rankCourses, scoreLabel, type ComparisonKey } from "./dashboard-model";

const TH =
  "h-10 px-3 text-left text-[11px] font-semibold tracking-[0.05em] text-navy/75 uppercase";

type Ranks = Record<ComparisonKey, { best: string[]; worst: string[] }>;

const KEYS: ComparisonKey[] = [
  "average",
  "passRate",
  "failRate",
  "examsTaken",
  "atRisk",
];

function teacherNames(metrics: CourseMetrics): string {
  return metrics.teachers.map(displayName).join(", ") || "Sin asignar";
}

/** A value with a text+icon marker when it is the best or the worst of its column. */
function Ranked({
  courseId,
  ranks,
  children,
}: {
  courseId: string;
  ranks: Ranks[ComparisonKey];
  children: string;
}) {
  const best = ranks.best.includes(courseId);
  const worst = ranks.worst.includes(courseId);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 tabular-nums",
        best && "font-semibold text-success",
        worst && "font-semibold text-warning",
      )}
    >
      {best && <CheckCircle2 className="size-4" aria-hidden />}
      {worst && <AlertTriangle className="size-4" aria-hidden />}
      {children}
      {best && <span className="sr-only"> (el mejor valor)</span>}
      {worst && <span className="sr-only"> (el valor a mejorar)</span>}
    </span>
  );
}

function cells(metrics: CourseMetrics): { key: ComparisonKey; label: string; text: string }[] {
  return [
    {
      key: "average",
      label: "Promedio",
      text: scoreLabel(metrics.average, metrics.course.gradingType),
    },
    { key: "passRate", label: "Aprobados", text: formatPercent(metrics.passRate) },
    { key: "failRate", label: "Desaprobados", text: formatPercent(metrics.failRate) },
    { key: "examsTaken", label: "Exámenes tomados", text: String(metrics.examsTaken) },
    { key: "atRisk", label: "En riesgo", text: String(metrics.atRisk.length) },
  ];
}

function CourseLink({ metrics }: { metrics: CourseMetrics }) {
  return (
    <Link
      href={`/admin/grades/${metrics.course.id}`}
      className="inline-flex min-h-10 items-center font-medium text-navy hover:text-primary"
    >
      {metrics.course.name}
    </Link>
  );
}

/** Side-by-side course metrics. Best value per column is marked green, the one to improve amber. */
export function CourseComparison({ courses }: { courses: CourseMetrics[] }) {
  const ranks = Object.fromEntries(KEYS.map((k) => [k, rankCourses(courses, k)])) as Ranks;

  return (
    <section className="min-w-0">
      <SectionHeading
        title="Comparativa de cursos"
        description="Marcamos en verde el mejor valor de cada columna y en ámbar el que más conviene mejorar."
      />

      <ul className="flex flex-col gap-3 md:hidden">
        {courses.map((metrics) => (
          <li key={metrics.course.id} className="surface-card overflow-hidden">
            <div className="border-b border-border bg-primary-tint px-4 py-2">
              <CourseLink metrics={metrics} />
              <p className="text-sm text-muted-foreground">
                {teacherNames(metrics)} · {metrics.studentCount} alumnos
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 px-4 py-3">
              {cells(metrics).map((cell) => (
                <div key={cell.key}>
                  <dt className="text-sm text-muted-foreground">{cell.label}</dt>
                  <dd className="text-base">
                    <Ranked courseId={metrics.course.id} ranks={ranks[cell.key]}>
                      {cell.text}
                    </Ranked>
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>

      <div className="surface-card hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead className="bg-primary-tint">
            <tr className="border-b border-slate-200">
              <th className={TH}>Curso</th>
              <th className={TH}>Docente(s)</th>
              <th className={TH}>Alumnos</th>
              <th className={TH}>Promedio</th>
              <th className={TH}>Aprobados</th>
              <th className={TH}>Desaprobados</th>
              <th className={TH}>Exámenes tomados</th>
              <th className={TH}>En riesgo</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((metrics) => {
              const id = metrics.course.id;
              const [average, pass, fail, exams, risk] = cells(metrics);
              return (
                <tr key={id} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-3 py-2">
                    <CourseLink metrics={metrics} />
                  </td>
                  <td className="px-3 py-2 text-slate-700">{teacherNames(metrics)}</td>
                  <td className="px-3 py-2 tabular-nums">{metrics.studentCount}</td>
                  <td className="px-3 py-2">
                    <Ranked courseId={id} ranks={ranks.average}>{average.text}</Ranked>
                  </td>
                  <td className="px-3 py-2">
                    <Ranked courseId={id} ranks={ranks.passRate}>{pass.text}</Ranked>
                  </td>
                  <td className="px-3 py-2">
                    <Ranked courseId={id} ranks={ranks.failRate}>{fail.text}</Ranked>
                  </td>
                  <td className="px-3 py-2">
                    <Ranked courseId={id} ranks={ranks.examsTaken}>{exams.text}</Ranked>
                  </td>
                  <td className="px-3 py-2">
                    <Ranked courseId={id} ranks={ranks.atRisk}>{risk.text}</Ranked>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Los cursos con notas conceptuales se convierten con esta equivalencia: Excelente 10 · Muy
        bien + 9 · Muy bien 8 · Bien + 7,5 · Bien 7 · Regular 6 · Desaprobado 4.
      </p>
    </section>
  );
}
