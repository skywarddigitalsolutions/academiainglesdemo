"use client";

import { AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CONCEPTUAL_SCALE,
  PASS_MARK,
  type GradeValue,
  type GradingType,
} from "@/domain/grading";

const NONE = "__none__";

/** Form value for a grade: text for inputs, parsed on save. */
export type GradeDraft = string;

export function gradeToDraft(value: GradeValue | null): GradeDraft {
  return value === null ? "" : String(value);
}

/**
 * Parses the draft. Invalid numbers are passed through as NaN so the
 * domain rejects them with a proper message.
 */
export function draftToGrade(draft: GradeDraft, type: GradingType): GradeValue | null {
  const trimmed = draft.trim();
  if (trimmed === "") return null;
  if (type === "numeric") return Number(trimmed.replace(",", "."));
  return trimmed as GradeValue;
}

export function ConceptualSelect({
  id,
  value,
  onChange,
  disabled,
  placeholder = "Seleccionar",
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <Select
      value={value === "" ? NONE : value}
      onValueChange={(v) => onChange(v === NONE ? "" : v)}
      disabled={disabled}
    >
      <SelectTrigger id={id} className="h-11 w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>Sin calificar</SelectItem>
        {CONCEPTUAL_SCALE.map((grade) => (
          <SelectItem key={grade} value={grade}>
            {grade}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function GradeField({
  id,
  label,
  gradingType,
  value,
  onChange,
  disabled,
  hint,
}: {
  id: string;
  label: string;
  gradingType: GradingType;
  value: GradeDraft;
  onChange: (value: GradeDraft) => void;
  disabled?: boolean;
  hint?: string;
}) {
  const numeric = gradingType === "numeric" ? Number(value.replace(",", ".")) : NaN;
  const belowPass = value.trim() !== "" && Number.isFinite(numeric) && numeric < PASS_MARK;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {gradingType === "conceptual" ? (
        <ConceptualSelect id={id} value={value} onChange={onChange} disabled={disabled} />
      ) : (
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          min={1}
          max={10}
          step={0.5}
          placeholder="1 a 10"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="h-11"
          aria-describedby={belowPass ? `${id}-hint` : undefined}
        />
      )}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {belowPass && (
        <p id={`${id}-hint`} className="flex items-center gap-1 text-xs text-warning">
          <AlertTriangle className="size-3.5" aria-hidden />
          Por debajo de {PASS_MARK}. Solo es una referencia: la decisión es del docente.
        </p>
      )}
    </div>
  );
}
