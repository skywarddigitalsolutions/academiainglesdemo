import type { CourseMetrics } from "@/application/dashboard";
import { countLabel, formatPercent, passFailSegments } from "./dashboard-model";

function Legend({ className, children }: { className: string; children: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`size-2.5 rounded-sm ${className}`} aria-hidden />
      {children}
    </span>
  );
}

function PassFailRow({ metrics }: { metrics: CourseMetrics }) {
  const seg = passFailSegments(metrics);
  const passed = `${countLabel(metrics.passed, "aprobado", "aprobados")} (${formatPercent(seg.passed)})`;
  const failed = `${countLabel(metrics.failed, "desaprobado", "desaprobados")} (${formatPercent(seg.failed)})`;
  const ungraded = `${metrics.ungraded} sin notas`;
  return (
    <li className="py-3 first:pt-0 last:pb-0">
      <p className="font-serif text-base font-semibold text-navy">{metrics.course.name}</p>
      <div
        className="mt-2 flex h-4 gap-0.5 overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={`${metrics.course.name}: ${passed}, ${failed}, ${ungraded}`}
      >
        <span className="bg-success" style={{ width: `${seg.passed}%` }} />
        <span className="bg-danger" style={{ width: `${seg.failed}%` }} />
        <span className="bg-slate-300" style={{ width: `${seg.ungraded}%` }} />
      </div>
      <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-foreground">
        <Legend className="bg-success">{passed}</Legend>
        <Legend className="bg-danger">{failed}</Legend>
        <Legend className="bg-slate-300">{ungraded}</Legend>
      </p>
    </li>
  );
}

/** One 100% stacked bar per course: passed, failed and not graded yet. */
export function PassFailByCourse({ courses }: { courses: CourseMetrics[] }) {
  return (
    <ul className="divide-y divide-border">
      {courses.map((metrics) => (
        <PassFailRow key={metrics.course.id} metrics={metrics} />
      ))}
    </ul>
  );
}
