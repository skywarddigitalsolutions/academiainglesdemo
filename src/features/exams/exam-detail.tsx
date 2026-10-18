"use client";

import { useState, type ReactNode } from "react";
import { Loader2, Send, Users } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { examTypeLabel, type ExamGradeChanges } from "@/domain/exam";
import { CONCEPTUAL_SCALE } from "@/domain/grading";
import { fullName } from "@/domain/student";
import { ReadOnlyValue, SelectCell, TextCell } from "@/features/grade-sheet/cells";
import { errorMessage } from "@/lib/error-message";
import { bimesterLabel, formatDateTime, formatDay } from "@/lib/format";
import { examGradeChanges, examGradeTexts, examStatusBadge, formatStatsSummary } from "./exam-model";

const CONCEPTUAL_OPTIONS = CONCEPTUAL_SCALE.map((g) => ({ value: g, label: g }));

/** Editing callbacks; omit them for a read-only view (Dirección). */
export interface ExamEditing {
  save: (changes: ExamGradeChanges) => Promise<ExamDetail>;
  publish: () => Promise<ExamDetail>;
  onChange: (detail: ExamDetail) => void;
}

/**
 * Presentational: exam header, summary and the grade sheet of the course
 * students (course grading scale). Mount it with `key={exam.updatedAt}` so
 * the cells reset after each save.
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
  const { exam, course, students, status, stats } = detail;
  const ids = students.map((s) => s.id);
  const [texts, setTexts] = useState(() => examGradeTexts(exam, ids));
  const [busy, setBusy] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const { changes, invalid } = examGradeChanges(exam, texts, course.gradingType);
  const dirty = Object.keys(changes).length > 0 || invalid.length > 0;
  const editable = editing !== undefined && status !== "upcoming";
  const badge = examStatusBadge(status);
  const published = exam.publishedAt !== null;

  async function handleSave() {
    if (!editing) return;
    if (invalid.length > 0) {
      toast.error("Revise las celdas marcadas en rojo antes de guardar.");
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

  return (
    <div className="max-w-4xl">
      <PageHeader
        eyebrow="Exámenes"
        title={exam.topic}
        breadcrumbs={breadcrumbs}
        description={
          <>
            {course.name} · {examTypeLabel(exam.type)} · {formatDay(exam.date)} ·{" "}
            {bimesterLabel(exam.bimester)}
          </>
        }
        actions={
          <>
            {headerActions}
            {editable && (
              <>
                <Button variant="outline" onClick={handleSave} disabled={busy || !dirty}>
                  {busy && <Loader2 className="animate-spin" aria-hidden />}
                  Guardar notas
                </Button>
                {!published && (
                  <Button
                    onClick={() => setConfirmPublish(true)}
                    disabled={busy || dirty || stats.graded === 0}
                    title={
                      dirty
                        ? "Guarde los cambios antes de publicar."
                        : stats.graded === 0
                          ? "Cargue al menos una nota antes de publicar."
                          : undefined
                    }
                  >
                    <Send aria-hidden />
                    Publicar notas
                  </Button>
                )}
              </>
            )}
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
        <StatusBadge tone={badge.tone} dot>
          {badge.label}
        </StatusBadge>
        {published && <span>Publicado el {formatDateTime(exam.publishedAt)}</span>}
        {status !== "upcoming" && <span>{formatStatsSummary(stats).join(" · ")}</span>}
      </div>

      {status === "upcoming" && (
        <p className="mb-4 rounded-lg bg-primary-tint px-4 py-3 text-sm text-navy">
          El examen todavía no se tomó. {editing ? "Podrá cargar las notas desde el día del examen." : ""}
        </p>
      )}
      {editable && !published && (
        <p className="mb-4 text-[13px] text-muted-foreground">
          Las notas no requieren aprobación de Dirección: las familias las verán al publicarlas.
        </p>
      )}

      {students.length === 0 ? (
        <EmptyState icon={Users} title="Este curso todavía no tiene alumnos." />
      ) : (
        <section className="surface-card overflow-hidden" aria-label="Notas del examen">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alumno</TableHead>
                <TableHead className="w-44">
                  Nota {course.gradingType === "numeric" ? "(1 a 10)" : ""}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student, i) => {
                const text = texts[student.id] ?? "";
                const name = fullName(student);
                return (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{name}</TableCell>
                    <TableCell>
                      {!editable ? (
                        <ReadOnlyValue value={text} hintLow />
                      ) : course.gradingType === "numeric" ? (
                        <TextCell
                          cell={`${i}:grade`}
                          value={text}
                          aria-label={`Nota de ${name}`}
                          placeholder="—"
                          inputMode="decimal"
                          hintLow
                          invalid={invalid.includes(student.id)}
                          onValueChange={(v) => setTexts({ ...texts, [student.id]: v })}
                          className="w-20"
                        />
                      ) : (
                        <SelectCell
                          cell={`${i}:grade`}
                          value={text}
                          aria-label={`Nota de ${name}`}
                          options={CONCEPTUAL_OPTIONS}
                          hintLow
                          onValueChange={(v) => setTexts({ ...texts, [student.id]: v })}
                          className="w-40"
                        />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </section>
      )}

      <AlertDialog open={confirmPublish} onOpenChange={(o) => !busy && setConfirmPublish(o)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Publicar notas?</AlertDialogTitle>
            <AlertDialogDescription>
              Las familias verán de inmediato las notas de{" "}
              {stats.graded === 1 ? "1 alumno" : `${stats.graded} alumnos`}. Podrá corregirlas
              después; seguirán publicadas.
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
