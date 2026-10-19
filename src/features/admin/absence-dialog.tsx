"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TEACHER_ABSENCE_REASON_MAX_LENGTH } from "@/domain/teacher-absence";
import { displayName, type User } from "@/domain/user";
import { errorMessage } from "@/lib/error-message";

export interface AbsenceFormState {
  teacherId: string;
  from: string;
  to: string;
  reason: string;
}

/** Registers the days a teacher will not be at school. */
export function AbsenceDialog({
  teachers,
  today,
  onClose,
  onSubmit,
}: {
  teachers: User[];
  /** Default day, yyyy-mm-dd. */
  today: string;
  onClose: () => void;
  /** Throws a user-facing error when the absence cannot be saved. */
  onSubmit: (form: AbsenceFormState) => Promise<void>;
}) {
  const [form, setForm] = useState<AbsenceFormState>({
    teacherId: "",
    from: today,
    to: today,
    reason: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // "Hasta" follows "Desde" until it is set apart, and never ends before it starts.
  function changeFrom(from: string) {
    setForm((f) => ({ ...f, from, to: f.to === f.from || f.to < from ? from : f.to }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar ausencia docente</DialogTitle>
          <DialogDescription>
            Quedará marcada en el calendario de Dirección. Las familias y los docentes no la ven.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="absence-teacher">Docente</Label>
            <Select
              value={form.teacherId}
              onValueChange={(teacherId) => setForm({ ...form, teacherId })}
            >
              <SelectTrigger id="absence-teacher" className="h-11 w-full text-base">
                <SelectValue placeholder="Seleccionar docente" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {displayName(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="absence-from">Desde</Label>
              <Input
                id="absence-from"
                type="date"
                value={form.from}
                onChange={(e) => changeFrom(e.target.value)}
                className="h-11 text-base"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="absence-to">Hasta</Label>
              <Input
                id="absence-to"
                type="date"
                value={form.to}
                min={form.from}
                onChange={(e) => setForm({ ...form, to: e.target.value })}
                className="h-11 text-base"
                required
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="absence-reason">Motivo</Label>
            <Input
              id="absence-reason"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              maxLength={TEACHER_ABSENCE_REASON_MAX_LENGTH}
              placeholder="Por ejemplo: Licencia médica"
              className="h-11 text-base"
              required
            />
          </div>
          {error && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy || form.teacherId === ""}>
              {busy && <Loader2 className="animate-spin" aria-hidden />}
              Registrar ausencia
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
