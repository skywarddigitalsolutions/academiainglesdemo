"use client";

import type { ReactNode } from "react";
import type { ChildExams, ParentUpcomingExam } from "@/application/parent-use-cases";
import type { ParentExamView } from "@/application/exams";
import { ErrorState } from "@/components/feedback/error-state";
import { SectionHeading } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { examTypeLabel } from "@/domain/exam";
import { GradeText } from "@/features/report-card/grade-text";
import { bimesterLabel, formatDayShort } from "@/lib/format";
import { useAsyncData } from "@/providers/use-async-data";
import { useSession } from "@/providers/session-provider";

/*
 * Families see exam dates as soon as they are scheduled, and grades only once
 * the teacher publishes them (the use cases never send unpublished grades).
 */

function useParentId(): string {
  const { state } = useSession();
  return state.session?.userId ?? "";
}

/** Container: upcoming exams of every child, for the parent home. */
export function ParentUpcomingExams() {
  const parentId = useParentId();
  const { data, error, loading } = useAsyncData(`parent-upcoming-exams:${parentId}`, (s) =>
    s.parent.listUpcomingExams(parentId),
  );
  return (
    <section aria-label="Próximos exámenes" className="mt-10 max-w-4xl">
      <SectionHeading
        title="Próximos exámenes"
        description="Evaluaciones de las próximas tres semanas."
      />
      {loading && <Skeleton className="h-24 w-full rounded-xl" />}
      {error && <ErrorState message={error} />}
      {data && <UpcomingList items={data} />}
    </section>
  );
}

function UpcomingList({ items }: { items: ParentUpcomingExam[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay exámenes programados por ahora.</p>;
  }
  return (
    <ul className="surface-card divide-y divide-border overflow-hidden">
      {items.map(({ student, course, exam }) => (
        <li key={`${student.id}:${exam.id}`}>
          <ExamLine exam={exam} context={`${student.firstName} · ${course.name}`} />
        </li>
      ))}
    </ul>
  );
}

function ExamLine({ exam, context, grade }: { exam: ParentExamView; context?: string; grade?: ReactNode }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 sm:px-5">
      <span className="w-20 shrink-0 font-serif text-base font-semibold text-navy tabular-nums">
        {formatDayShort(exam.date)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold break-words text-foreground">{exam.topic}</p>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted-foreground">
          {context && (
            <>
              <span>{context}</span>
              <span aria-hidden>·</span>
            </>
          )}
          <StatusBadge>{examTypeLabel(exam.type)}</StatusBadge>
          <span aria-hidden>·</span>
          <span>{bimesterLabel(exam.bimester)}</span>
        </p>
      </div>
      {grade !== undefined && (
        <span className="shrink-0 text-lg font-semibold text-foreground tabular-nums">{grade}</span>
      )}
    </div>
  );
}

/** Container: upcoming exams and published exam grades of one child. */
export function ChildExamsSection({ studentId }: { studentId: string }) {
  const parentId = useParentId();
  const { data, error, loading } = useAsyncData(`parent-child-exams:${parentId}:${studentId}`, (s) =>
    s.parent.getChildExams(parentId, studentId),
  );
  if (loading) return <Skeleton className="h-32 w-full rounded-xl" />;
  if (error || !data) return error ? <ErrorState message={error} /> : null;
  return <ChildExamsView data={data} />;
}

function ChildExamsView({ data }: { data: ChildExams }) {
  return (
    <div className="flex flex-col gap-8">
      <section aria-label="Próximos exámenes">
        <SectionHeading title="Próximos exámenes" />
        {data.upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay exámenes programados por ahora.</p>
        ) : (
          <ul className="surface-card divide-y divide-border overflow-hidden">
            {data.upcoming.map((exam) => (
              <li key={exam.id}>
                <ExamLine exam={exam} />
              </li>
            ))}
          </ul>
        )}
      </section>
      <section aria-label="Notas de exámenes">
        <SectionHeading
          title="Notas de exámenes"
          description="Notas publicadas por el docente. Son una referencia: la nota bimestral figura en el boletín."
        />
        {data.graded.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay notas de exámenes publicadas.</p>
        ) : (
          <ul className="surface-card divide-y divide-border overflow-hidden">
            {data.graded.map(({ exam, grade }) => (
              <li key={exam.id}>
                <ExamLine
                  exam={exam}
                  grade={
                    grade === null ? (
                      <span className="text-sm font-normal text-muted-foreground">Sin nota</span>
                    ) : (
                      <GradeText value={grade} />
                    )
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
