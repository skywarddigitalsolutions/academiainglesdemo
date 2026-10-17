"use client";

import { useId, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { COURSE_NOTE_MAX_LENGTH } from "@/domain/course-note";

/**
 * Text for the teacher: used to return a period (observation required) and
 * to write a free note (optionally about the selected period).
 */
export function NoteDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  placeholder,
  periodOption,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  placeholder: string;
  /** Shows "Relacionar con el …" for free notes. */
  periodOption?: string;
  /** Resolves true when saved (the dialog then closes and clears). */
  onSubmit: (text: string, aboutPeriod: boolean) => Promise<boolean>;
}) {
  const id = useId();
  const [text, setText] = useState("");
  const [aboutPeriod, setAboutPeriod] = useState(false);
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);
  const empty = text.trim() === "";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (empty) return;
    setBusy(true);
    try {
      if (await onSubmit(text, aboutPeriod)) {
        setText("");
        setAboutPeriod(false);
        setTouched(false);
        onOpenChange(false);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex flex-col gap-2">
            <Label htmlFor={`${id}-text`}>Texto para el docente</Label>
            <Textarea
              id={`${id}-text`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              maxLength={COURSE_NOTE_MAX_LENGTH}
              placeholder={placeholder}
              aria-invalid={touched && empty ? true : undefined}
              aria-describedby={`${id}-hint`}
              className="min-h-28 resize-y text-sm leading-relaxed"
            />
            <p id={`${id}-hint`} className="flex justify-between gap-3 text-xs text-muted-foreground">
              <span className={touched && empty ? "font-medium text-danger" : undefined}>
                {touched && empty ? "Escriba el texto antes de continuar." : "El docente lo verá en la planilla del curso."}
              </span>
              <span className="tabular-nums">
                {text.length}/{COURSE_NOTE_MAX_LENGTH}
              </span>
            </p>
            {periodOption && (
              <Label className="mt-1 flex min-h-11 items-center gap-2.5 font-normal">
                <Checkbox
                  checked={aboutPeriod}
                  onCheckedChange={(v) => setAboutPeriod(v === true)}
                />
                Relacionar con el {periodOption}
              </Label>
            )}
          </div>
          <DialogFooter className="mt-5">
            <Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="animate-spin" aria-hidden />}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
