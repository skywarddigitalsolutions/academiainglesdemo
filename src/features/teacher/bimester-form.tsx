"use client";

import { useState, type FormEvent, type ReactNode } from "react";
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
import { SaveBar } from "./save-bar";

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

const CARD = "rounded-lg border bg-card p-5 shadow-xs sm:p-6";

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
  const title = bimesterLabel(bimester.number);

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

  if (locked) {
    return (
      <section className={CARD}>
        <CardHeader title={title} badge={<BimesterStatusBadge status={status} />} />
        <div className="mb-6 flex items-start gap-2 rounded-md border bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            {approved
              ? "Bimestre aprobado por Dirección y publicado a la familia. No puede modificarse."
              : "Bimestre firmado. Está esperando la aprobación de Dirección. Puede reabrirlo si necesita corregir algo."}
          </p>
        </div>
        <dl className="grid gap-x-6 gap-y-5 text-sm md:grid-cols-2">
          <ReadOnly label="Nota de aplicación">
            <GradeText value={bimester.applicationGrade} />
          </ReadOnly>
          <ReadOnly label="Conducta">
            <GradeText value={bimester.conductGrade} />
          </ReadOnly>
          <ReadOnly label="Inasistencias">{bimester.absences}</ReadOnly>
          <div className="md:col-span-2">
            <dt className="text-xs text-muted-foreground">Observación</dt>
            <dd className="mt-1 leading-relaxed text-slate-700">
              {bimester.observation || "Sin observaciones."}
            </dd>
          </div>
        </dl>
        <Signatures bimester={bimester} className="mt-6 border-t pt-6" />
        {!approved && (
          <div className="mt-6 border-t pt-6">
            <Button
              variant="outline"
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
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSave} className={CARD}>
        <CardHeader
          title={title}
          description="Calificaciones, inasistencias y observación del bimestre."
          badge={<BimesterStatusBadge status={status} />}
        />
        <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
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
              className="h-10"
            />
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <Label htmlFor={`${idPrefix}-observation`}>Observación para el alumno y la familia</Label>
            <Textarea
              id={`${idPrefix}-observation`}
              rows={4}
              maxLength={600}
              placeholder="Ej.: Participa activamente en clase. Se sugiere reforzar la escritura."
              value={draft.observation}
              onChange={(e) => set("observation")(e.target.value)}
            />
            <p className="text-right text-xs text-muted-foreground tabular-nums">
              {draft.observation.length}/600
            </p>
          </div>
        </div>

        <SaveBar dirty={dirty} saving={busy === "save"}>
          <Button type="submit" disabled={busy !== null || !dirty}>
            {busy === "save" ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
            Guardar cambios
          </Button>
        </SaveBar>
      </form>

      <section className={CARD}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-semibold">Firmar y cerrar el bimestre</h3>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Al firmar se guardan los cambios y el bimestre queda cerrado. Dirección
              debe aprobarlo para que la familia pueda verlo.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="outline" className="shrink-0" disabled={busy !== null}>
                {busy === "sign" ? <Loader2 className="animate-spin" aria-hidden /> : <PenLine aria-hidden />}
                Firmar y cerrar bimestre
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Firmar el {title.toLowerCase()}?</AlertDialogTitle>
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
        <Signatures bimester={bimester} className="mt-6 border-t pt-6" />
      </section>
    </div>
  );
}

function CardHeader({
  title,
  description,
  badge,
}: {
  title: string;
  description?: string;
  badge: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-2">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {badge}
    </div>
  );
}

function ReadOnly({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-base font-semibold tabular-nums">{children}</dd>
    </div>
  );
}

function Signatures({ bimester, className }: { bimester: Bimester; className?: string }) {
  return (
    <div className={className}>
      <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">Firmas</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SignatureLine label="Firma docente" signature={bimester.signatures.teacher} />
        <SignatureLine label="Aprobación de Dirección" signature={bimester.signatures.director} />
        <SignatureLine label="Familia · Leído / Notificado" signature={bimester.signatures.parent} />
      </div>
    </div>
  );
}
