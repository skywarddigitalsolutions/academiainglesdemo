import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import type { StudentMetrics } from "@/application/dashboard";
import { StatusBadge } from "@/components/ui/status-badge";
import { fullName } from "@/domain/student";
import { riskBadge, scoreLabel } from "./dashboard-model";

/** Students who may have to sit the March exam, with the plain-language reasons. */
export function RiskList({
  students,
  reportCardHref,
}: {
  students: StudentMetrics[];
  /** Where "Ver boletín" goes; the link is left out when the viewer has no such page. */
  reportCardHref?: (studentId: string) => string;
}) {
  if (students.length === 0) {
    return (
      <p className="surface-card flex items-center gap-2 px-5 py-4 text-base text-success">
        <CheckCircle2 className="size-5" aria-hidden />
        Ningún alumno en riesgo en este curso.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {students.map(({ student, performance }) => {
        const badge = riskBadge(performance.risk.level);
        return (
          <li key={student.id} className="surface-card flex flex-col gap-2 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex flex-wrap items-center gap-2">
                <span className="font-serif text-lg font-semibold text-navy">
                  {fullName(student)}
                </span>
                <StatusBadge tone={badge.tone} dot className="h-7 text-sm">
                  {badge.label}
                </StatusBadge>
              </p>
              {reportCardHref && (
                <Link
                  href={reportCardHref(student.id)}
                  className="inline-flex min-h-10 items-center text-sm font-medium text-primary-strong underline-offset-2 hover:underline"
                >
                  Ver boletín
                </Link>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {performance.gradingType === "conceptual" ? "Concepto general" : "Promedio actual"}:{" "}
              <span className="font-semibold text-foreground tabular-nums">
                {scoreLabel(performance.average, performance.gradingType)}
              </span>
            </p>
            <ul className="list-disc pl-5 text-sm text-foreground">
              {performance.risk.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}
