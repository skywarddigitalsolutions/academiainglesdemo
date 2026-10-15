"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Lock, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Course } from "@/domain/course";
import {
  CLOSING_RESULTS,
  FINAL_EXAM_MODALITIES,
  formatFinalResult,
  type ClosingPatch,
  type ClosingResult,
  type FinalExamModality,
  type ReportCard,
} from "@/domain/report-card";
import { GradeText } from "@/features/report-card/grade-text";
import { SignatureLine } from "@/features/report-card/signature-line";
import { GradeField, draftToGrade, gradeToDraft } from "./grade-field";

const NONE = "__none__";

interface Draft {
  cuatrimestralExam: string;
  result: string;
  modality: string;
  finalGrade: string;
  finalResultKind: string;
  nextCourseName: string;
}

function toDraft(card: ReportCard, course: Course): Draft {
  const { closing } = card;
  return {
    cuatrimestralExam: gradeToDraft(closing.cuatrimestralExam),
    result: closing.result ?? "",
    modality: closing.finalExam?.modality ?? "",
    finalGrade: gradeToDraft(closing.finalExam?.grade ?? null),
    finalResultKind: closing.finalResult?.kind ?? "",
    nextCourseName:
      closing.finalResult?.kind === "promoted"
        ? closing.finalResult.nextCourseName
        : course.nextCourseName,
  };
}

function toPatch(draft: Draft, course: Course): ClosingPatch {
  const type = course.gradingType;
  const result = draft.result === "" ? null : (draft.result as ClosingResult);
  return {
    cuatrimestralExam: draftToGrade(draft.cuatrimestralExam, type),
    result,
    finalExam:
      result === "Va a examen final"
        ? {
            modality: draft.modality === "" ? null : (draft.modality as FinalExamModality),
            grade: draftToGrade(draft.finalGrade, type),
          }
        : null,
    finalResult:
      draft.finalResultKind === "promoted"
        ? { kind: "promoted", nextCourseName: draft.nextCourseName.trim() || course.nextCourseName }
        : draft.finalResultKind === "march"
          ? { kind: "march" }
          : null,
  };
}

function OptionSelect({
  id,
  value,
  onChange,
  options,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value === "" ? NONE : value} onValueChange={(v) => onChange(v === NONE ? "" : v)}>
      <SelectTrigger id={id} className="h-11 w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>Sin definir</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ClosingForm({
  card,
  course,
  onSave,
}: {
  card: ReportCard;
  course: Course;
  onSave: (patch: ClosingPatch) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(card, course));
  const [busy, setBusy] = useState(false);
  const locked = card.closing.directorSignature.signed;
  const set = (field: keyof Draft) => (value: string) =>
    setDraft((d) => ({ ...d, [field]: value }));

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await onSave(toPatch(draft, course));
    } finally {
      setBusy(false);
    }
  }

  if (locked) {
    const { closing } = card;
    return (
      <section className="flex flex-col gap-4 rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
        <h2 className="text-xl font-semibold">Cierre del ciclo lectivo</h2>
        <div className="flex items-start gap-2 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
          <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>El cierre fue firmado por Dirección y no puede modificarse.</p>
        </div>
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Examen cuatrimestral</dt>
            <dd className="font-semibold text-navy">
              <GradeText value={closing.cuatrimestralExam} />
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Resultado</dt>
            <dd className="font-semibold text-navy">{closing.result}</dd>
          </div>
          {closing.finalExam && (
            <div>
              <dt className="text-xs text-muted-foreground">Examen final</dt>
              <dd className="font-semibold text-navy">
                {closing.finalExam.modality ?? "—"} · <GradeText value={closing.finalExam.grade} />
              </dd>
            </div>
          )}
          <div>
            <dt className="text-xs text-muted-foreground">Situación final</dt>
            <dd className="font-semibold text-navy">{formatFinalResult(closing.finalResult)}</dd>
          </div>
        </dl>
        <SignatureLine label="Firma de Dirección" signature={closing.directorSignature} />
      </section>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-6 rounded-2xl border bg-card p-4 shadow-sm sm:p-6"
    >
      <div>
        <h2 className="text-xl font-semibold">Cierre del ciclo lectivo</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          El resultado lo define el docente. El sistema no calcula promedios ni
          decide automáticamente.
        </p>
      </div>

      <fieldset className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
        <legend className="px-1 text-sm font-semibold text-navy">Examen cuatrimestral</legend>
        <GradeField
          id="cuatrimestral"
          label="Nota del examen"
          gradingType={course.gradingType}
          value={draft.cuatrimestralExam}
          onChange={set("cuatrimestralExam")}
          hint="Se rinde una vez al año, después del 2° bimestre. Si corresponde, considérela al cargar la nota del 2° bimestre."
        />
      </fieldset>

      <fieldset className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
        <legend className="px-1 text-sm font-semibold text-navy">Resultado del docente</legend>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="closing-result">Resultado</Label>
          <OptionSelect
            id="closing-result"
            value={draft.result}
            onChange={set("result")}
            options={CLOSING_RESULTS.map((r) => ({ value: r, label: r }))}
          />
        </div>
        {draft.result === "Va a examen final" && (
          <>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="final-modality">Modalidad del examen final</Label>
              <OptionSelect
                id="final-modality"
                value={draft.modality}
                onChange={set("modality")}
                options={FINAL_EXAM_MODALITIES.map((m) => ({ value: m, label: m }))}
              />
            </div>
            <GradeField
              id="final-grade"
              label="Nota del examen final"
              gradingType={course.gradingType}
              value={draft.finalGrade}
              onChange={set("finalGrade")}
            />
          </>
        )}
      </fieldset>

      <fieldset className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
        <legend className="px-1 text-sm font-semibold text-navy">Situación final</legend>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="final-result">Situación</Label>
          <OptionSelect
            id="final-result"
            value={draft.finalResultKind}
            onChange={set("finalResultKind")}
            options={[
              { value: "promoted", label: "Promovido" },
              { value: "march", label: "Debe rendir en marzo" },
            ]}
          />
        </div>
        {draft.finalResultKind === "promoted" && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="next-course">Promovido a</Label>
            <Input
              id="next-course"
              value={draft.nextCourseName}
              onChange={(e) => set("nextCourseName")(e.target.value)}
              className="h-11"
            />
          </div>
        )}
      </fieldset>

      <div className="rounded-xl border bg-background p-4">
        <SignatureLine
          label="Firma de Dirección"
          signature={card.closing.directorSignature}
          pendingText="Pendiente: Dirección firma una vez cargado el resultado y la situación final."
        />
      </div>

      <div className="flex justify-end border-t pt-4">
        <Button type="submit" size="lg" className="w-full font-semibold sm:w-auto" disabled={busy}>
          {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
          Guardar cierre
        </Button>
      </div>
    </form>
  );
}
