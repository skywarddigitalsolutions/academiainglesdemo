"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Lock, PenLine, Save, Unlock } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ConceptualGrade, GradingType } from "@/domain/grading";
import {
  getBimesterStatus,
  type Bimester,
  type BimesterPatch,
} from "@/domain/report-card";
import { BimesterStatusBadge } from "@/features/report-card/bimester-status-badge";
import { GradeText } from "@/features/report-card/grade-text";
import { SignatureLine } from "@/features/report-card/signature-line";
import { bimesterLabel } from "@/lib/format";
import type { EditorActions } from "./report-card-editor";
import { ConceptualSelect, GradeField, draftToGrade, gradeToDraft } from "./grade-field";

interface Draft {
  applicationGrade: string;
  conductGrade: string;
  observation: string;
  absences: string;
}

function toDraft(b: Bimester): Draft {
  return {
    applicationGrade: gradeToDraft(b.applicationGrade),
    conductGrade: b.conductGrade ?? "",
    observation: b.observation,
    absences: String(b.absences),
  };
}

function toPatch(draft: Draft, type: GradingType): BimesterPatch {
  const absences = draft.absences.trim() === "" ? 0 : Number(draft.absences);
  return {
    applicationGrade: draftToGrade(draft.applicationGrade, type),
    conductGrade: draft.conductGrade === "" ? null : (draft.conductGrade as ConceptualGrade),
    observation: draft.observation.trim(),
    absences,
  };
}

export function BimesterForm({
  bimester,
  gradingType,
  actions,
}: {
  bimester: Bimester;
  gradingType: GradingType;
  actions: EditorActions;
}) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(bimester));
  const [busy, setBusy] = useState<"save" | "sign" | "reopen" | null>(null);
  const locked = bimester.signatures.teacher.signed;
  const approved = bimester.signatures.director.signed;
  const status = getBimesterStatus(bimester);
  const saved = toDraft(bimester);
  const dirty = (Object.keys(draft) as (keyof Draft)[]).some((k) => draft[k] !== saved[k]);
  const idPrefix = `b${bimester.number}`;

  const set = (field: keyof Draft) => (value: string) =>
    setDraft((d) => ({ ...d, [field]: value }));

  async function withBusy(kind: typeof busy, fn: () => Promise<boolean>) {
    setBusy(kind);
    try {
      return await fn();
    } finally {
      setBusy(null);
    }
  }

  function handleSave(event: FormEvent) {
    event.preventDefault();
    void withBusy("save", () =>
      actions.saveBimester(bimester.number, toPatch(draft, gradingType)),
    );
  }

  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">{bimesterLabel(bimester.number)}</h2>
        <BimesterStatusBadge status={status} />
      </div>

      {locked ? (
        <div className="flex flex-col gap-5">
          <div className="flex items-start gap-2 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
            <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
            <p>
              {approved
                ? "Bimestre aprobado por Dirección y publicado a la familia. No puede modificarse."
                : "Bimestre firmado. Está esperando la aprobación de Dirección. Puede reabrirlo si necesita corregir algo."}
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs text-muted-foreground">Nota de aplicación</dt>
              <dd className="text-lg font-semibold text-navy">
                <GradeText value={bimester.applicationGrade} />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Conducta</dt>
              <dd className="text-lg font-semibold text-navy">
                <GradeText value={bimester.conductGrade} />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Inasistencias</dt>
              <dd className="text-lg font-semibold text-navy">{bimester.absences}</dd>
            </div>
            <div className="col-span-2 sm:col-span-3">
              <dt className="text-xs text-muted-foreground">Observación</dt>
              <dd className="mt-1 leading-relaxed">{bimester.observation || "Sin observaciones."}</dd>
            </div>
          </dl>
          <Signatures bimester={bimester} />
          {!approved && (
            <div>
              <Button
                variant="outline"
                size="lg"
                disabled={busy !== null}
                onClick={() =>
                  void withBusy("reopen", () => actions.reopenBimester(bimester.number))
                }
              >
                {busy === "reopen" ? <Loader2 className="animate-spin" aria-hidden /> : <Unlock aria-hidden />}
                Reabrir para editar
              </Button>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSave} className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <GradeField
              id={`${idPrefix}-application`}
              label="Nota de aplicación"
              gradingType={gradingType}
              value={draft.applicationGrade}
              onChange={set("applicationGrade")}
            />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${idPrefix}-conduct`}>Conducta</Label>
              <ConceptualSelect
                id={`${idPrefix}-conduct`}
                value={draft.conductGrade}
                onChange={set("conductGrade")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${idPrefix}-absences`}>Inasistencias</Label>
              <Input
                id={`${idPrefix}-absences`}
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={draft.absences}
                onChange={(e) => set("absences")(e.target.value)}
                className="h-11"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${idPrefix}-observation`}>Observación para el alumno y la familia</Label>
            <Textarea
              id={`${idPrefix}-observation`}
              rows={4}
              maxLength={600}
              placeholder="Ej.: Participa activamente en clase. Se sugiere reforzar la escritura."
              value={draft.observation}
              onChange={(e) => set("observation")(e.target.value)}
            />
            <p className="text-right text-xs text-muted-foreground">
              {draft.observation.length}/600
            </p>
          </div>

          <Signatures bimester={bimester} />

          <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {dirty ? "Hay cambios sin guardar." : "Sin cambios pendientes."}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" variant="outline" size="lg" disabled={busy !== null || !dirty}>
                {busy === "save" ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
                Guardar borrador
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" size="lg" className="font-semibold" disabled={busy !== null}>
                    {busy === "sign" ? <Loader2 className="animate-spin" aria-hidden /> : <PenLine aria-hidden />}
                    Firmar y cerrar bimestre
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Firmar el {bimesterLabel(bimester.number).toLowerCase()}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Se guardarán los cambios y el bimestre quedará cerrado. Dirección
                      deberá aprobarlo para que la familia pueda verlo.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() =>
                        void withBusy("sign", () =>
                          actions.signBimester(bimester.number, toPatch(draft, gradingType)),
                        )
                      }
                    >
                      Firmar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </form>
      )}
    </section>
  );
}

function Signatures({ bimester }: { bimester: Bimester }) {
  return (
    <div className="grid grid-cols-1 gap-3 rounded-xl border bg-background p-4 sm:grid-cols-3">
      <SignatureLine label="Firma docente" signature={bimester.signatures.teacher} />
      <SignatureLine label="Aprobación de Dirección" signature={bimester.signatures.director} />
      <SignatureLine label="Familia · Leído / Notificado" signature={bimester.signatures.parent} />
    </div>
  );
}
