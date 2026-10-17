import { Clock, Undo2 } from "lucide-react";
import type { PeriodReview } from "@/domain/period-review";
import { periodLabel } from "@/features/report-card/period";
import { formatDateTime } from "@/lib/format";

const students = (n: number) => (n === 1 ? "1 alumno" : `${n} alumnos`);

/**
 * Approval state of the selected period, above the sheet. The teacher sees
 * a calm "waiting" message while pending and Dirección's observation when
 * the period was returned; Dirección sees what is waiting for a decision.
 */
export function ReviewBanner({
  review,
  viewer,
}: {
  review: PeriodReview | null;
  viewer: "teacher" | "admin";
}) {
  if (!review || review.status === "approved") return null;
  const label = periodLabel(review.period);

  if (review.status === "pending") {
    return (
      <div
        role="status"
        className="mt-4 flex items-start gap-3 rounded-xl border border-primary/25 bg-primary-soft px-4 py-3 text-sm text-navy"
      >
        <Clock className="mt-0.5 size-4 shrink-0 text-primary-strong" aria-hidden />
        <p>
          {viewer === "teacher" ? (
            <>
              <span className="font-semibold">
                Enviado a Dirección el {formatDateTime(review.submittedAt)}, esperando aprobación.
              </span>{" "}
              {students(review.studentIds.length)} en el envío. Mientras tanto el {label.toLowerCase()}{" "}
              no se puede editar.
            </>
          ) : (
            <>
              <span className="font-semibold">{label}: pendiente de aprobación.</span> El docente lo
              envió el {formatDateTime(review.submittedAt)} con {students(review.studentIds.length)}.
              Revise las notas y apruébelo para publicarlo a las familias, o devuélvalo con una
              observación.
            </>
          )}
        </p>
      </div>
    );
  }

  return (
    <div
      role="status"
      className="mt-4 rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-foreground"
    >
      <p className="flex items-center gap-2 font-semibold text-danger">
        <Undo2 className="size-4 shrink-0" aria-hidden />
        {viewer === "teacher"
          ? `Dirección devolvió el ${label.toLowerCase()} el ${formatDateTime(review.decidedAt)}`
          : `Devuelto al docente el ${formatDateTime(review.decidedAt)}`}
      </p>
      {review.returnNote && (
        <blockquote className="mt-2 border-l-2 border-danger/40 pl-3 leading-relaxed whitespace-pre-line">
          {review.returnNote}
        </blockquote>
      )}
      {viewer === "teacher" && (
        <p className="mt-2 text-[13px] text-muted-foreground">
          Corrija lo indicado y vuelva a enviarlo a Dirección.
        </p>
      )}
    </div>
  );
}
