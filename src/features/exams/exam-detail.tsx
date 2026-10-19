"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BookOpen, CalendarDays, CheckCircle2, ClipboardList, Loader2, PencilLine, Send, Users } from "lucide-react";
import { toast } from "sonner";
import type { ExamDetail } from "@/application/exams";
import { EmptyState } from "@/components/feedback/empty-state";
import type { Crumb } from "@/components/layout/breadcrumbs";
import { PageHeader } from "@/components/layout/page-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { examTypeLabel, type ExamGradeChanges } from "@/domain/exam";
import { errorMessage } from "@/lib/error-message";
import { bimesterLabel, formatDate } from "@/lib/format";
import { gradeDistribution, liveExamStats, longDateLabel, upcomingLead } from "./exam-detail-model";
import { ExamRoster, UpcomingRoster } from "./exam-roster";
import { ExamStatTiles, GradeDistribution } from "./exam-stat-tiles";
import { ExamStatusPanel, GradingGuide } from "./exam-status-panel";
import { examGradeChanges, examGradeTexts, examStatusBadge } from "./exam-model";

/** Editing callbacks; omit them for a read-only view (Dirección). */
export interface ExamEditing {
  save: (changes: ExamGradeChanges) => Promise<ExamDetail>;
  publish: () => Promise<ExamDetail>;
  onChange: (detail: ExamDetail) => void;
}

function InfoItem({ icon: Icon, children }: { icon: typeof BookOpen; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Icon className="size-4 shrink-0 text-primary-strong" aria-hidden />
      {children}
    </span>
  );
}

/**
 * Presentational: exam header, guided status, live summary and the roster of
 * the course students (course grading scale). Mount it with
 * `key={exam.updatedAt}` so the cells reset after each save.
 */
export function ExamDetailView({
  detail,
  breadcrumbs,
  editing,
  headerActions,
}: {
  detail: ExamDetail;
  breadcrumbs: Crumb[];
  editing?: ExamEditing;
  headerActions?: ReactNode;
}) {
  const { exam, course, students, status, today } = detail;
  const ids = students.map((s) => s.id);
  const [texts, setTexts] = useState(() => examGradeTexts(exam, ids));
  const [busy, setBusy] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const { changes, invalid } = examGradeChanges(exam, texts, course.gradingType);
  const unsavedIds = useMemo(() => new Set([...Object.keys(changes), ...invalid]), [changes, invalid]);
  const unsavedCount = unsavedIds.size;
  const dirty = unsavedCount > 0;
  const live = liveExamStats(texts, course.gradingType);
  const editable = editing !== undefined && status !== "upcoming";
  const badge = examStatusBadge(status);
  const published = exam.publishedAt !== null;
  const canPublish = !busy && !dirty && live.graded > 0;

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  async function handleSave() {
    if (!editing) return;
    if (invalid.length > 0) {
      toast.error("Revise las notas marcadas como inválidas antes de guardar.");
      return;
    }
    setBusy(true);
    try {
      editing.onChange(await editing.save(changes));
      toast.success("Notas guardadas", {
        description: published
          ? "El examen ya estaba publicado: las familias ven las notas corregidas."
          : "Las familias las verán cuando publique las notas.",
      });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handlePublish() {
    if (!editing) return;
    setBusy(true);
    try {
      editing.onChange(await editing.publish());
      toast.success("Notas publicadas", { description: "Las familias ya pueden verlas." });
      setConfirmPublish(false);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const gradedAll = students.length > 0 && live.graded === students.length;

  return (
    <div className="max-w-5xl text-base">
      <PageHeader
        eyebrow="Exámenes"
        title={exam.topic}
        breadcrumbs={breadcrumbs}
        description={
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-[15px] text-foreground">
              <InfoItem icon={BookOpen}>{course.name}</InfoItem>
              <InfoItem icon={ClipboardList}>{examTypeLabel(exam.type)}</InfoItem>
              <InfoItem icon={CalendarDays}>{longDateLabel(exam.date)}</InfoItem>
              <InfoItem icon={PencilLine}>{bimesterLabel(exam.bimester)}</InfoItem>
            </div>
            <div>
              <StatusBadge tone={badge.tone} dot className="h-8 px-3 text-sm">
                {badge.label}
              </StatusBadge>
            </div>
          </div>
        }
        actions={headerActions}
      />

      {status === "upcoming" && (
        <ExamStatusPanel
          tone="info"
          title={`Este examen se toma el ${longDateLabel(exam.date)} (${upcomingLead(exam.date, today)}).`}
        >
          Las notas se podrán cargar a partir de ese día.
        </ExamStatusPanel>
      )}
      {status === "pending-grades" && editable && (
        <GradingGuide allGraded={gradedAll} dirty={dirty} published={published} />
      )}
      {status === "pending-grades" && !editable && (
        <ExamStatusPanel tone="warning" title="El docente todavía no publicó las notas.">
          Calificados: {live.graded} de {live.total}.
        </ExamStatusPanel>
      )}
      {status === "published" && (
        <ExamStatusPanel tone="success" title={`Notas publicadas el ${formatDate(exam.publishedAt)}.`}>
          Las familias ya pueden verlas.
        </ExamStatusPanel>
      )}

      {status !== "upcoming" && <ExamStatTiles stats={live} type={course.gradingType} />}
      {status !== "upcoming" && live.graded > 0 && (
        <GradeDistribution bands={gradeDistribution(texts, course.gradingType)} />
      )}

      {students.length === 0 ? (
        <EmptyState icon={Users} title="Este curso todavía no tiene alumnos." />
      ) : status === "upcoming" ? (
        <UpcomingRoster students={students} />
      ) : (
        <ExamRoster
          students={students}
          texts={texts}
          gradingType={course.gradingType}
          unsaved={unsavedIds}
          onTextChange={editable ? (id, v) => setTexts((prev) => ({ ...prev, [id]: v })) : undefined}
        />
      )}

      {editable && (
        <div className="sticky bottom-0 z-20 mt-6 flex flex-col gap-3 rounded-xl border border-border bg-card/95 p-4 shadow-[0_-6px_16px_-10px_rgb(11_58_91/0.25)] backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
          <div className="text-[15px]">
            {dirty ? (
              <p className="flex items-center gap-2 font-medium text-warning">
                <PencilLine className="size-5 shrink-0" aria-hidden />
                {unsavedCount === 1 ? "Hay 1 cambio sin guardar" : `Hay ${unsavedCount} cambios sin guardar`}
              </p>
            ) : (
              <p className="flex items-center gap-2 font-medium text-success">
                <CheckCircle2 className="size-5 shrink-0" aria-hidden />
                Todo guardado
              </p>
            )}
            {!published && !canPublish && !busy && (
              <p className="mt-1 text-muted-foreground">
                {dirty
                  ? "Guarde los cambios para poder publicar."
                  : "Cargue al menos una nota para poder publicar."}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              size="lg"
              variant={dirty ? "default" : "outline"}
              className="h-11 px-5 text-base"
              onClick={handleSave}
              disabled={busy || !dirty}
            >
              {busy && <Loader2 className="animate-spin" aria-hidden />}
              Guardar notas
            </Button>
            {!published && (
              <Button
                size="lg"
                className="h-11 px-5 text-base"
                onClick={() => setConfirmPublish(true)}
                disabled={!canPublish}
              >
                <Send aria-hidden />
                Publicar notas
              </Button>
            )}
          </div>
        </div>
      )}

      <AlertDialog open={confirmPublish} onOpenChange={(o) => !busy && setConfirmPublish(o)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Publicar notas?</AlertDialogTitle>
            <AlertDialogDescription>
              Las familias podrán ver estas notas en el boletín digital (
              {live.graded === 1 ? "1 alumno" : `${live.graded} alumnos`}). Podrá corregirlas después;
              seguirán publicadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                void handlePublish();
              }}
            >
              {busy && <Loader2 className="animate-spin" aria-hidden />}
              Publicar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
