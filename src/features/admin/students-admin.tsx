"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { FileText, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { StudentListItem } from "@/application/admin-use-cases";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Course } from "@/domain/course";
import { MAX_GUARDIANS, fullName } from "@/domain/student";
import { displayName, type User } from "@/domain/user";
import { errorMessage } from "@/lib/error-message";
import { getServices } from "@/providers/services";
import { useAsyncData } from "@/providers/use-async-data";
import { ConfirmDelete } from "./confirm-delete";

const ALL = "__all__";

interface FormState {
  id?: string;
  firstName: string;
  lastName: string;
  courseId: string;
  guardianIds: string[];
}

/** Container: student list with create/edit/delete. */
export function StudentsAdmin() {
  const params = useSearchParams();
  const { data, error, loading, reload } = useAsyncData("admin-students", async (s) => {
    const [students, courses, parents] = await Promise.all([
      s.admin.listStudents(),
      s.admin.listCourses(),
      s.admin.listParents(),
    ]);
    return {
      students,
      courses: courses.map((c) => c.course),
      parents: parents.map((p) => p.parent),
    };
  });
  const [form, setForm] = useState<FormState | null>(null);
  const [query, setQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState(params.get("course") ?? ALL);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.students.filter(
      (s) =>
        (courseFilter === ALL || s.student.courseId === courseFilter) &&
        (q === "" || fullName(s.student).toLowerCase().includes(q)),
    );
  }, [data, query, courseFilter]);

  async function handleDelete(item: StudentListItem) {
    try {
      await getServices().admin.deleteStudent(item.student.id);
      toast.success(`${fullName(item.student)} fue eliminado/a.`);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <>
      <PageHeader
        title="Alumnos"
        description="Alta, edición y vínculo con las familias responsables."
        actions={
          <Button
            size="lg"
            className="font-semibold"
            disabled={!data}
            onClick={() =>
              setForm({
                firstName: "",
                lastName: "",
                courseId: courseFilter !== ALL ? courseFilter : (data?.courses[0]?.id ?? ""),
                guardianIds: [],
              })
            }
          >
            <Plus aria-hidden />
            Nuevo alumno
          </Button>
        }
      />
      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {data && (
        <>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                aria-label="Buscar alumno"
                placeholder="Buscar por nombre o apellido"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-11 pl-9"
              />
            </div>
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger aria-label="Filtrar por curso" className="h-11 w-full sm:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos los cursos</SelectItem>
                {data.courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <StudentTable
            items={filtered}
            onEdit={(item) =>
              setForm({
                id: item.student.id,
                firstName: item.student.firstName,
                lastName: item.student.lastName,
                courseId: item.student.courseId,
                guardianIds: item.student.guardianIds,
              })
            }
            onDelete={handleDelete}
          />
          {form && (
            <StudentDialog
              initial={form}
              courses={data.courses}
              parents={data.parents}
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

function StudentTable({
  items,
  onEdit,
  onDelete,
}: {
  items: StudentListItem[];
  onEdit: (item: StudentListItem) => void;
  onDelete: (item: StudentListItem) => Promise<void>;
}) {
  if (items.length === 0) {
    return <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">No se encontraron alumnos.</p>;
  }
  return (
    <ul className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      {items.map((item) => (
        <li
          key={item.student.id}
          className="flex flex-col gap-3 border-b p-4 last:border-b-0 md:flex-row md:items-center md:justify-between"
        >
          <div className="min-w-0">
            <p className="font-semibold text-navy">{fullName(item.student)}</p>
            <p className="text-sm text-muted-foreground">
              {item.course?.name ?? "Sin curso"} ·{" "}
              {item.guardians.length > 0
                ? `Responsables: ${item.guardians.map(displayName).join(", ")}`
                : "Sin responsables vinculados"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="lg">
              <Link href={`/admin/report-cards/${item.student.id}`}>
                <FileText aria-hidden />
                Boletín
              </Link>
            </Button>
            <Button variant="outline" size="lg" onClick={() => onEdit(item)}>
              <Pencil aria-hidden />
              Editar
            </Button>
            <ConfirmDelete
              title={`¿Eliminar a ${fullName(item.student)}?`}
              description="Se eliminará el alumno y su boletín del ciclo lectivo. Esta acción no se puede deshacer."
              onConfirm={() => onDelete(item)}
            >
              <Button variant="destructive" size="lg">
                <Trash2 aria-hidden />
                <span className="sr-only md:not-sr-only">Eliminar</span>
              </Button>
            </ConfirmDelete>
          </div>
        </li>
      ))}
    </ul>
  );
}

function StudentDialog({
  initial,
  courses,
  parents,
  onClose,
  onSaved,
}: {
  initial: FormState;
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
                className="h-11"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="st-last">Apellido</Label>
              <Input
                id="st-last"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="h-11"
                required
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="st-course">Curso</Label>
            <Select value={form.courseId} onValueChange={(courseId) => setForm({ ...form, courseId })}>
              <SelectTrigger id="st-course" className="h-11 w-full">
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
