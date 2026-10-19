"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { CheckCheck, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";
import type { ParentReportCard } from "@/application/parent-use-cases";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import type { GradeValue } from "@/domain/grading";
import { formatFinalResult, type BimesterNumber, type Closing } from "@/domain/report-card";
import { GradeText } from "@/features/report-card/grade-text";
import { parsePeriodParam, periodLabel, periodParam } from "@/features/report-card/period";
import { ReportCardSheet } from "@/features/report-card/report-card-sheet";
import { errorMessage } from "@/lib/error-message";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getServices } from "@/providers/services";
import { useAsyncData } from "@/providers/use-async-data";
import { useSession } from "@/providers/session-provider";
import {
  newestPublishedFirst,
  parentBimesterRows,
  parentPeriodSteps,
  scrollTargetPeriod,
  unreadNotice,
  unreadPeriods,
  type ParentBimesterRow,
} from "./parent-model";
import { ChildExamsSection } from "./parent-exams";

/** Container: loads the family view of a report card and handles "Leído". */
export function ParentReportCardContainer() {
  const { studentId } = useParams<{ studentId: string }>();
  const { state } = useSession();
  const parentId = state.session?.userId ?? "";
  const { data, error, loading, setData } = useAsyncData(
    `parent-card:${parentId}:${studentId}`,
    (s) => s.parent.getReportCard(parentId, studentId),
  );

  if (loading) return <LoadingState variant="cards" />;
  if (error || !data) {
    return <ErrorState message={error ?? "Boletín no encontrado."} backHref="/parent" />;
  }

  async function acknowledge(n: BimesterNumber) {
    try {
      setData(await getServices().parent.acknowledgeBimester(parentId, studentId, n));
      return true;
    } catch (err) {
      toast.error(errorMessage(err));
      return false;
    }
  }

  return <ParentReportCardView data={data} onAcknowledge={acknowledge} />;
}

/* ------------------------------------------------------------------------- */

type Acknowledge = (n: BimesterNumber) => Promise<boolean>;

/*
 * The whole school year on one page, read top to bottom like the paper
 * report card: bimesters with their observations, then the year closing.
 * One card per bimester: phones and tablets (below lg) list the latest
 * published first; wider screens keep the chronological order 1° → 4°.
 */
function ParentReportCardView({
  data,
  onAcknowledge,
}: {
  data: ParentReportCard;
  onAcknowledge: Acknowledge;
}) {
  const { student, course, teacherNames, view } = data;
  const searchParams = useSearchParams();
  const steps = parentPeriodSteps(view);
  const rows = parentBimesterRows(view);
  const unreadCount = unreadPeriods(steps).length;
  const notice = unreadNotice(unreadCount);
  const nothingPublished = rows.every((r) => r.state === "pending");
  const teacherText = teacherNames.join(", ");
  const [confirmed, setConfirmed] = useState<BimesterNumber[]>([]);

  // Old `?periodo=` links: scroll to that period once, if it is published.
  const target = scrollTargetPeriod(steps, parsePeriodParam(searchParams.get("periodo")));
  useEffect(() => {
    if (target === null) return;
    const visible = [
      ...document.querySelectorAll<HTMLElement>(`[data-period="${periodParam(target)}"]`),
    ].find((el) => el.offsetParent !== null);
    visible?.scrollIntoView({ block: "start" });
  }, [target]);

  async function acknowledge(n: BimesterNumber) {
    if (await onAcknowledge(n)) setConfirmed((prev) => [...prev, n]);
  }

  const rowProps = { confirmed, onAcknowledge: acknowledge };

  return (
    <div className="max-w-4xl print:max-w-none">
      <PageHeader
        eyebrow={course.name}
        title={`Boletín de ${student.firstName}`}
        breadcrumbs={[
          { label: "Mis hijos", href: "/parent" },
          { label: `${student.firstName} ${student.lastName}` },
        ]}
        description={`Ciclo lectivo ${view.year}${teacherText ? ` · Docente: ${teacherText}` : ""}`}
        actions={
          <Button variant="outline" onClick={() => window.print()}>
            <Printer aria-hidden />
            Imprimir boletín
          </Button>
        }
      />

      <div className="flex flex-col gap-4 lg:gap-5 print:hidden">
        {notice && (
          <p className="text-sm text-navy">
            <span className="font-semibold">{notice}</span> Al terminar de{" "}
            {unreadCount === 1 ? "leerlo" : "leerlos"}, confirme la lectura.
          </p>
        )}
        {nothingPublished && (
          <p className="text-sm text-muted-foreground">
            Todavía no hay bimestres publicados. Las calificaciones aparecerán aquí cuando el
            instituto las publique.
          </p>
        )}

        <BimesterList rows={newestPublishedFirst(rows)} className="lg:hidden" {...rowProps} />
        <BimesterList rows={rows} className="hidden lg:flex" {...rowProps} />

        {view.closing ? (
          <ClosingCard closing={view.closing} cuatrimestralExam={view.cuatrimestralExam} />
        ) : (
          <PendingLine label={periodLabel("closing")} period={periodParam("closing")} />
        )}

        <div className="mt-6">
          <ChildExamsSection studentId={student.id} />
        </div>
      </div>

      {/* Full report card, A4: only when printing. */}
      <div className="hidden print:block">
        <ReportCardSheet
          student={student}
          course={course}
          teacherNames={teacherNames}
          year={view.year}
          bimesters={view.bimesters}
          cuatrimestralExam={view.cuatrimestralExam}
          closing={view.closing}
          hiddenText="Aún no publicado"
          showGradingType={false}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------- */

interface RowActions {
  confirmed: BimesterNumber[];
  onAcknowledge: (n: BimesterNumber) => Promise<void>;
}

function grade(value: GradeValue | null) {
  return value === null ? (
    <span className="text-muted-foreground">—</span>
  ) : (
    <GradeText value={value} />
  );
}

function StateBadge({ row }: { row: ParentBimesterRow }) {
  return row.state === "new" ? (
    <StatusBadge tone="info" dot className="font-semibold">
      Nuevo
    </StatusBadge>
  ) : (
    <StatusBadge tone="success">Leído</StatusBadge>
  );
}

function PendingLine({ label, period }: { label: string; period: string }) {
  return (
    <p
      data-period={period}
      className="scroll-mt-20 rounded-lg bg-muted px-4 py-2.5 text-sm text-muted-foreground"
    >
      <span className="font-semibold">{label}</span> · Aún no publicado
    </p>
  );
}

function Observation({ text }: { text: string }) {
  return (
    <p className="text-[15px] leading-relaxed whitespace-pre-line text-foreground">
      {text || <span className="text-muted-foreground">El docente no dejó observaciones.</span>}
    </p>
  );
}

/** Publication dates, the "Confirmar lectura" action and its confirmation. */
function ReadFooter({ row, confirmed, onAcknowledge }: { row: ParentBimesterRow } & RowActions) {
  const [busy, setBusy] = useState(false);
  const b = row.bimester;
  if (!b) return null;
  const justConfirmed = row.state === "read" && confirmed.includes(row.number);

  async function handleClick() {
    setBusy(true);
    try {
      await onAcknowledge(row.number);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <p className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
        <span>Publicado el {formatDateTime(b.publishedAt)}</span>
        {b.readAt && <span>Leído el {formatDateTime(b.readAt)}</span>}
      </p>
      <div aria-live="polite" className="w-full sm:w-auto">
        {row.state === "new" ? (
          <Button
            size="sm"
            className="h-10 w-full sm:h-9 sm:w-auto"
            disabled={busy}
            onClick={handleClick}
          >
            {busy ? <Loader2 className="animate-spin" aria-hidden /> : <CheckCheck aria-hidden />}
            Confirmar lectura
          </Button>
        ) : (
          justConfirmed && (
            <p className="inline-flex items-center gap-1.5 text-[13px] font-medium text-success">
              <CheckCheck className="size-4" aria-hidden />
              Lectura confirmada. Gracias.
            </p>
          )
        )}
      </div>
    </div>
  );
}

function BimesterList({
  rows,
  className,
  ...actions
}: { rows: ParentBimesterRow[]; className?: string } & RowActions) {
  return (
    <ol className={cn("flex flex-col gap-4 lg:gap-5", className)} aria-label="Bimestres">
      {rows.map((row) => (
        <li key={row.number}>
          {row.bimester ? (
            <BimesterCard row={row} {...actions} />
          ) : (
            <PendingLine label={periodLabel(row.number)} period={String(row.number)} />
          )}
        </li>
      ))}
    </ol>
  );
}

function BimesterCard({ row, ...actions }: { row: ParentBimesterRow } & RowActions) {
  const b = row.bimester;
  if (!b) return null;
  const isNew = row.state === "new";
  return (
    <section
      data-period={String(row.number)}
      aria-label={periodLabel(row.number)}
      className={cn(
        "surface-card scroll-mt-20 overflow-hidden",
        isNew && "border-primary/60 ring-2 ring-primary/15",
      )}
    >
      <header
        className={cn(
          "flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-5",
          isNew ? "border-primary/20 bg-primary-soft" : "border-border bg-primary-tint",
        )}
      >
        <PeriodHeading number={row.number} />
        <StateBadge row={row} />
      </header>
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <GradeGrid count={row.cuatrimestralExam !== null ? 3 : 2}>
          <GradeBox label="Nota de aplicación">{grade(b.applicationGrade)}</GradeBox>
          <GradeBox label="Conducta">{grade(b.conductGrade)}</GradeBox>
          {row.cuatrimestralExam !== null && (
            <GradeBox label="Examen cuatrimestral">{grade(row.cuatrimestralExam)}</GradeBox>
          )}
        </GradeGrid>
        <div>
          <h3 className="text-xs font-semibold text-navy">Observación del docente</h3>
          <div className="mt-1">
            <Observation text={b.observation} />
          </div>
        </div>
        <ReadFooter row={row} {...actions} />
      </div>
    </section>
  );
}

/** "3°" mark plus the period name: the anchor of each bimester block. */
function PeriodHeading({ number }: { number: BimesterNumber }) {
  return (
    <h2 className="flex items-center gap-2.5">
      <span
        aria-hidden
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-navy font-serif text-base font-semibold text-white"
      >
        {number}°
      </span>
      <span className="font-serif text-xl font-semibold text-navy">{periodLabel(number)}</span>
    </h2>
  );
}

/** Phones: a label-left / value-right list. From sm: labeled boxes, label above value. */
function GradeGrid({ count, children }: { count: 2 | 3 | 4; children: ReactNode }) {
  return (
    <dl
      className={cn(
        "divide-y divide-primary/10 rounded-lg bg-primary-tint px-3 sm:grid sm:gap-3 sm:divide-y-0 sm:bg-transparent sm:px-0",
        // Four columns on wide screens so boxes line up from card to card.
        count === 4
          ? "sm:grid-cols-2 lg:grid-cols-4"
          : count === 3
            ? "sm:grid-cols-3 lg:grid-cols-4"
            : "sm:grid-cols-2 lg:grid-cols-4",
      )}
    >
      {children}
    </dl>
  );
}

function GradeBox({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2 sm:flex-col sm:justify-start sm:gap-1 sm:rounded-lg sm:bg-primary-tint sm:px-4 sm:py-3">
      <dt className="shrink-0 text-sm text-muted-foreground sm:text-xs">{label}</dt>
      <dd className="text-right text-[15px] font-semibold text-foreground tabular-nums sm:text-left sm:text-lg">
        {children}
      </dd>
    </div>
  );
}

/* ------------------------------------------------------------------------- */

function ClosingCard({
  closing,
  cuatrimestralExam,
}: {
  closing: Closing;
  cuatrimestralExam: GradeValue | null;
}) {
  const toFinal = closing.result === "Va a examen final";
  return (
    <section
      data-period={periodParam("closing")}
      aria-label={periodLabel("closing")}
      className="surface-card scroll-mt-20 overflow-hidden"
    >
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-border bg-primary-tint px-4 py-3 sm:px-5">
        <h2 className="font-serif text-xl font-semibold text-navy">{periodLabel("closing")}</h2>
        <p className="text-xs text-muted-foreground">
          Publicado el {formatDateTime(closing.publishedAt)}
        </p>
      </header>
      <div className="p-4 sm:p-5">
        <GradeGrid count={toFinal ? 4 : 3}>
          <GradeBox label="Examen cuatrimestral">{grade(cuatrimestralExam)}</GradeBox>
          <GradeBox label="Resultado">{closing.result ?? "—"}</GradeBox>
          {toFinal && (
            <GradeBox label="Examen final">
              {closing.finalExam?.modality ?? "Modalidad a definir"} ·{" "}
              {grade(closing.finalExam?.grade ?? null)}
            </GradeBox>
          )}
          <GradeBox label="Situación final">{formatFinalResult(closing.finalResult)}</GradeBox>
        </GradeGrid>
      </div>
    </section>
  );
}
