import { formatGrade, isBelowPassMark, type GradeValue } from "@/domain/grading";
import { cn } from "@/lib/utils";

/** Displays a grade. Numeric grades below 6 get a subtle visual hint only. */
export function GradeText({
  value,
  className,
}: {
  value: GradeValue | null;
  className?: string;
}) {
  const low = isBelowPassMark(value);
  return (
    <span
      className={cn(low && "font-semibold text-warning", className)}
      title={low ? "Por debajo de la nota de aprobación (6)" : undefined}
    >
      {formatGrade(value)}
      {low && <span className="sr-only"> (por debajo de 6)</span>}
    </span>
  );
}
