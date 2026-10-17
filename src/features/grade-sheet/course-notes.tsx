import type { ReactNode } from "react";
import { MessageSquareText } from "lucide-react";
import type { CourseNote } from "@/domain/course-note";
import { SectionHeading } from "@/components/layout/page-header";
import { periodLabel } from "@/features/report-card/period";
import { formatDateTime } from "@/lib/format";

/** Notes from Dirección to the teachers of a course, newest first. */
export function CourseNotesPanel({
  notes,
  action,
  emptyText,
}: {
  notes: CourseNote[];
  action?: ReactNode;
  emptyText: string;
}) {
  return (
    <section className="mt-8 min-w-0" aria-labelledby="course-notes-title">
      <div id="course-notes-title">
        <SectionHeading title="Notas de Dirección" actions={action} />
      </div>
      {notes.length === 0 ? (
        <p className="surface-card flex items-center gap-2 px-4 py-4 text-sm text-muted-foreground">
          <MessageSquareText className="size-4 shrink-0" aria-hidden />
          {emptyText}
        </p>
      ) : (
        <ol className="surface-card divide-y divide-border">
          {notes.map((note) => (
            <li key={note.id} className="px-4 py-3.5">
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                <span className="font-semibold text-navy">{note.authorName}</span>
                <span aria-hidden>·</span>
                <time dateTime={note.createdAt}>{formatDateTime(note.createdAt)}</time>
                {note.period !== null && (
                  <span className="rounded-full bg-primary-soft px-2 py-px font-medium text-primary-strong">
                    {periodLabel(note.period)}
                  </span>
                )}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-line text-foreground">
                {note.text}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
