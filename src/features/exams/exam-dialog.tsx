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
import type { Course } from "@/domain/course";
import {
  EXAM_TOPIC_MAX_LENGTH,
  EXAM_TYPES,
  examTypeLabel,
  type Exam,
  type ExamType,
} from "@/domain/exam";
import { BIMESTER_NUMBERS, type BimesterNumber } from "@/domain/report-card";
import { errorMessage } from "@/lib/error-message";
import { bimesterLabel } from "@/lib/format";

export interface ExamFormState {
  id?: string;
  courseId: string;
  date: string;
  type: ExamType;
  topic: string;
  bimester: BimesterNumber;
}

export function newExamForm(courseId: string, today: string, bimester: BimesterNumber): ExamFormState {
  return { courseId, date: today, type: "written", topic: "", bimester };
}

export function editExamForm(exam: Exam): ExamFormState {
  return {
    id: exam.id,
    courseId: exam.courseId,
    date: exam.date,
    type: exam.type,
    topic: exam.topic,
    bimester: exam.bimester,
  };
}

/** Create / edit the date, type, topic and bimester of an exam. */
export function ExamDialog({
  initial,
  courses,
  onClose,
  onSubmit,
}: {
  initial: ExamFormState;
  courses: Course[];
  onClose: () => void;
  /** Throws a user-facing error when the exam cannot be saved. */
  onSubmit: (form: ExamFormState) => Promise<void>;
}) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editing = initial.id !== undefined;

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
          <DialogTitle>{editing ? "Editar examen" : "Nuevo examen"}</DialogTitle>
          <DialogDescription>
            Las familias verán la fecha y el tema. Las notas, solo cuando las publique.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="exam-course">Curso</Label>
            <Select
              value={form.courseId}
              onValueChange={(courseId) => setForm({ ...form, courseId })}
              disabled={editing}
            >
              <SelectTrigger id="exam-course" className="h-10 w-full">
                <SelectValue placeholder="Seleccionar curso" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="exam-date">Fecha</Label>
              <Input
                id="exam-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="h-10"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="exam-bimester">Bimestre</Label>
              <Select
                value={String(form.bimester)}
                onValueChange={(v) => setForm({ ...form, bimester: Number(v) as BimesterNumber })}
              >
                <SelectTrigger id="exam-bimester" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BIMESTER_NUMBERS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {bimesterLabel(n)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="exam-type">Tipo</Label>
            <Select
              value={form.type}
              onValueChange={(type) => setForm({ ...form, type: type as ExamType })}
            >
              <SelectTrigger id="exam-type" className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXAM_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {examTypeLabel(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="exam-topic">Tema</Label>
            <Input
              id="exam-topic"
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
              maxLength={EXAM_TOPIC_MAX_LENGTH}
              placeholder="Por ejemplo: Past simple"
              className="h-10"
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
            <Button type="submit" disabled={busy || form.courseId === ""}>
              {busy && <Loader2 className="animate-spin" aria-hidden />}
              {editing ? "Guardar" : "Crear examen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
