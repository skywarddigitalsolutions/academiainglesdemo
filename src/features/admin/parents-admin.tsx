"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Mail, Pencil, Phone, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ParentListItem } from "@/application/admin-use-cases";
import { DEMO_PASSWORD } from "@/application/demo-constants";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageHeader } from "@/components/layout/page-header";
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
import { MAX_GUARDIANS, fullName, type Student } from "@/domain/student";
import { displayName } from "@/domain/user";
import { errorMessage } from "@/lib/error-message";
import { getServices } from "@/providers/services";
import { useAsyncData } from "@/providers/use-async-data";
import { ConfirmDelete } from "./confirm-delete";

interface FormState {
  id?: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  childIds: string[];
}

const EMPTY: FormState = {
  firstName: "",
  lastName: "",
  username: "",
  email: "",
  phone: "",
  childIds: [],
};

/** Container: parents (guardians) with their linked children. */
export function ParentsAdmin() {
  const { data, error, loading, reload } = useAsyncData("admin-parents", async (s) => {
    const [parents, students, courses] = await Promise.all([
      s.admin.listParents(),
      s.admin.listStudents(),
      s.admin.listCourses(),
    ]);
    return {
      parents,
      students: students.map((x) => x.student),
      courses: courses.map((c) => c.course),
    };
  });
  const [form, setForm] = useState<FormState | null>(null);

  async function handleDelete(item: ParentListItem) {
    try {
      await getServices().admin.deleteParent(item.parent.id);
      toast.success(`${displayName(item.parent)} fue eliminado/a.`);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <>
      <PageHeader
        title="Familias"
        description="Padres, madres o tutores con acceso al boletín en línea."
        actions={
          <Button size="lg" className="font-semibold" onClick={() => setForm(EMPTY)}>
            <Plus aria-hidden />
            Nueva familia
          </Button>
        }
      />
      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {data && (
        <>
          <ul className="grid gap-3 md:grid-cols-2">
            {data.parents.map((item) => (
              <li key={item.parent.id} className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm">
                <div>
                  <p className="font-semibold text-navy">
                    {item.parent.lastName}, {item.parent.firstName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Usuario: <span className="font-mono">{item.parent.username}</span>
                  </p>
                </div>
                <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                  {item.parent.email && (
                    <span className="inline-flex items-center gap-2">
                      <Mail className="size-4" aria-hidden /> {item.parent.email}
                    </span>
                  )}
                  {item.parent.phone && (
                    <span className="inline-flex items-center gap-2">
                      <Phone className="size-4" aria-hidden /> {item.parent.phone}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {item.children.length === 0 ? (
                    <span className="text-xs text-muted-foreground">Sin hijos vinculados</span>
                  ) : (
                    item.children.map((c) => (
                      <span
                        key={c.id}
                        className="rounded-full bg-celeste-light px-2.5 py-0.5 text-xs font-medium text-navy"
                      >
                        {c.firstName} {c.lastName} · {courseName(data.courses, c)}
                      </span>
                    ))
                  )}
                </div>
                <div className="mt-auto flex gap-2 border-t pt-3">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() =>
                      setForm({
                        id: item.parent.id,
                        firstName: item.parent.firstName,
                        lastName: item.parent.lastName,
                        username: item.parent.username,
                        email: item.parent.email,
                        phone: item.parent.phone,
                        childIds: item.children.map((c) => c.id),
                      })
                    }
                  >
                    <Pencil aria-hidden />
                    Editar
                  </Button>
                  <ConfirmDelete
                    title={`¿Eliminar a ${displayName(item.parent)}?`}
                    description="Se eliminará el acceso de esta familia y se desvinculará de sus hijos."
                    onConfirm={() => handleDelete(item)}
                  >
                    <Button variant="destructive" size="lg">
                      <Trash2 aria-hidden />
                      Eliminar
                    </Button>
                  </ConfirmDelete>
                </div>
              </li>
            ))}
          </ul>
          {form && (
            <ParentDialog
              initial={form}
              students={data.students}
              courses={data.courses}
              onClose={() => setForm(null)}
              onSaved={() => {
                setForm(null);
                reload();
              }}
            />
          )}
        </>
      )}
    </>
  );
}

function courseName(courses: Course[], student: Student) {
  return courses.find((c) => c.id === student.courseId)?.name ?? "";
}

function ParentDialog({
  initial,
  students,
  courses,
  onClose,
  onSaved,
}: {
  initial: FormState;
  students: Student[];
  courses: Course[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (field: keyof Omit<FormState, "childIds" | "id">) => (value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const admin = getServices().admin;
      const parent = await admin.saveParent(form);
      await admin.setParentChildren(parent.id, form.childIds);
      toast.success(
        initial.id
          ? "Datos de la familia actualizados."
          : `Familia creada. Usuario: ${parent.username} · Contraseña: ${DEMO_PASSWORD}`,
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
          <DialogTitle>{initial.id ? "Editar familia" : "Nueva familia"}</DialogTitle>
          <DialogDescription>
            {initial.id
              ? "Actualice los datos y los hijos vinculados."
              : `La contraseña inicial de la demo es ${DEMO_PASSWORD}.`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="p-first" label="Nombre" value={form.firstName} onChange={set("firstName")} />
            <Field id="p-last" label="Apellido" value={form.lastName} onChange={set("lastName")} />
            <Field id="p-user" label="Usuario" value={form.username} onChange={set("username")} />
            <Field id="p-phone" label="Teléfono" value={form.phone} onChange={set("phone")} />
          </div>
          <Field id="p-email" label="Correo electrónico" type="email" value={form.email} onChange={set("email")} />
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Hijos vinculados</legend>
            <div className="max-h-56 overflow-y-auto rounded-lg border p-2">
              {students.map((s) => {
                const checked = form.childIds.includes(s.id);
                const othersLinked = s.guardianIds.filter((g) => g !== initial.id).length;
                const full = !checked && othersLinked >= MAX_GUARDIANS;
                return (
                  <label
                    key={s.id}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted has-disabled:cursor-not-allowed has-disabled:opacity-50"
                  >
                    <Checkbox
                      checked={checked}
                      disabled={full}
                      onCheckedChange={(v) =>
                        setForm((f) => ({
                          ...f,
                          childIds:
                            v === true ? [...f.childIds, s.id] : f.childIds.filter((id) => id !== s.id),
                        }))
                      }
                    />
                    <span>
                      {fullName(s)}{" "}
                      <span className="text-muted-foreground">· {courseName(courses, s)}</span>
                      {full && <span className="text-muted-foreground"> · ya tiene 2 responsables</span>}
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
            <Button type="button" variant="outline" size="lg" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" size="lg" className="font-semibold" disabled={busy}>
              {busy && <Loader2 className="animate-spin" aria-hidden />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} className="h-11" />
    </div>
  );
}
