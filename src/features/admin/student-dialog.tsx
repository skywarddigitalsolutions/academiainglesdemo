"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
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
import { MAX_GUARDIANS, fullName, type Student } from "@/domain/student";
import type { User } from "@/domain/user";
import { errorMessage } from "@/lib/error-message";
import { getServices } from "@/providers/services";

export interface StudentFormState {
  id?: string;
  firstName: string;
  lastName: string;
  courseId: string;
  guardianIds: string[];
}

export function newStudentForm(courseId: string): StudentFormState {
  return { firstName: "", lastName: "", courseId, guardianIds: [] };
}

export function editStudentForm(student: Student): StudentFormState {
  return {
    id: student.id,
    firstName: student.firstName,
    lastName: student.lastName,
    courseId: student.courseId,
    guardianIds: student.guardianIds,
  };
}

/** Create / edit a student and link up to two guardians. */
export function StudentDialog({
  initial,
  courses,
  parents,
  onClose,
  onSaved,
}: {
  initial: StudentFormState;
  courses: Course[];
  parents: User[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleGuardian(id: string, checked: boolean) {
    setForm((f) => ({
      ...f,
      guardianIds: checked ? [...f.guardianIds, id] : f.guardianIds.filter((g) => g !== id),
    }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const student = await getServices().admin.saveStudent(form);
      toast.success(
        initial.id ? "Datos del alumno actualizados." : `${fullName(student)} fue dado/a de alta.`,
      );
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial.id ? "Editar alumno" : "Nuevo alumno"}</DialogTitle>
          <DialogDescription>
            Cada alumno puede tener hasta {MAX_GUARDIANS} responsables vinculados.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="st-first">Nombre</Label>
              <Input
                id="st-first"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="h-10"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="st-last">Apellido</Label>
              <Input
                id="st-last"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="h-10"
                required
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="st-course">Curso</Label>
            <Select value={form.courseId} onValueChange={(courseId) => setForm({ ...form, courseId })}>
              <SelectTrigger id="st-course" className="h-10 w-full">
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
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">
              Responsables ({form.guardianIds.length}/{MAX_GUARDIANS})
            </legend>
            <div className="max-h-48 overflow-y-auto rounded-lg border p-2">
              {parents.map((p) => {
                const checked = form.guardianIds.includes(p.id);
                const disabled = !checked && form.guardianIds.length >= MAX_GUARDIANS;
                return (
                  <label
                    key={p.id}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted has-disabled:cursor-not-allowed has-disabled:opacity-50"
                  >
                    <Checkbox
                      checked={checked}
                      disabled={disabled}
                      onCheckedChange={(v) => toggleGuardian(p.id, v === true)}
                    />
                    <span>
                      {p.lastName}, {p.firstName}{" "}
                      <span className="text-muted-foreground">({p.username})</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          {error && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="animate-spin" aria-hidden />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
