"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { MIN_PASSWORD_LENGTH } from "@/application/admin-use-cases";
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
import type { Course } from "@/domain/course";
import { displayName, type User } from "@/domain/user";
import { errorMessage } from "@/lib/error-message";
import { getServices } from "@/providers/services";

export interface TeacherFormState {
  id?: string;
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  email: string;
  courseIds: string[];
}

export function newTeacherForm(): TeacherFormState {
  return { firstName: "", lastName: "", username: "", password: "", email: "", courseIds: [] };
}

export function editTeacherForm(teacher: User, courses: Course[]): TeacherFormState {
  return {
    id: teacher.id,
    firstName: teacher.firstName,
    lastName: teacher.lastName,
    username: teacher.username,
    password: "",
    email: teacher.email,
    courseIds: courses.map((c) => c.id),
  };
}

/** Create / edit a teacher account and the courses assigned to it. */
export function TeacherDialog({
  initial,
  courses,
  onClose,
  onSaved,
}: {
  initial: TeacherFormState;
  courses: Course[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editing = Boolean(initial.id);

  function toggleCourse(id: string, checked: boolean) {
    setForm((f) => ({
      ...f,
      courseIds: checked ? [...f.courseIds, id] : f.courseIds.filter((c) => c !== id),
    }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const teacher = await getServices().admin.saveTeacher(form);
      toast.success(
        editing ? "Datos del docente actualizados." : `${displayName(teacher)} fue dado/a de alta.`,
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
          <DialogTitle>{editing ? "Editar docente" : "Nuevo docente"}</DialogTitle>
          <DialogDescription>
            El docente ingresa con este usuario y contraseña, y ve solo los cursos asignados.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="te-first">Nombre</Label>
              <Input
                id="te-first"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="h-10"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="te-last">Apellido</Label>
              <Input
                id="te-last"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="h-10"
                required
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="te-email">Correo electrónico</Label>
            <Input
              id="te-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="h-10"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="te-user">Usuario</Label>
              <Input
                id="te-user"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                autoComplete="off"
                autoCapitalize="none"
                className="h-10"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="te-pass">Contraseña</Label>
              <Input
                id="te-pass"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="new-password"
                minLength={MIN_PASSWORD_LENGTH}
                placeholder={editing ? "Sin cambios" : undefined}
                className="h-10"
                required={!editing}
              />
            </div>
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">
            Mínimo {MIN_PASSWORD_LENGTH} caracteres.
            {editing && " Deje la contraseña vacía para conservar la actual."}
          </p>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">
              Cursos asignados ({form.courseIds.length})
            </legend>
            <div className="max-h-48 overflow-y-auto rounded-lg border p-2">
              {courses.length === 0 && (
                <p className="px-2 py-2 text-sm text-muted-foreground">
                  Todavía no hay cursos cargados.
                </p>
              )}
              {courses.map((c) => (
                <label
                  key={c.id}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted"
                >
                  <Checkbox
                    checked={form.courseIds.includes(c.id)}
                    onCheckedChange={(v) => toggleCourse(c.id, v === true)}
                  />
                  <span>{c.name}</span>
                </label>
              ))}
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
