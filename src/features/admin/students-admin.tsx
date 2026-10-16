"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { FileText, Loader2, Pencil, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import type { StudentListItem } from "@/application/admin-use-cases";
import { EmptyState } from "@/components/feedback/empty-state";
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
import { SearchInput } from "@/components/ui/search-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCard,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
            <SearchInput
              aria-label="Buscar alumno"
              placeholder="Buscar por nombre o apellido"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger aria-label="Filtrar por curso" className="h-9 w-full bg-card sm:w-52">
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
    return <EmptyState icon={Users} title="No se encontraron alumnos" />;
  }
  return (
    <TableCard>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Alumno/a</TableHead>
            <TableHead>Curso</TableHead>
            <TableHead>Responsables</TableHead>
            <TableHead>
              <span className="sr-only">Acciones</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.student.id}>
              <TableCell className="font-medium whitespace-nowrap">
                {item.student.lastName}, {item.student.firstName}
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {item.course?.name ?? "Sin curso"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {item.guardians.length > 0
                  ? item.guardians.map(displayName).join(", ")
                  : "Sin responsables vinculados"}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/report-cards/${item.student.id}`}>
                      <FileText aria-hidden />
                      Boletín
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onEdit(item)}
                    aria-label={`Editar a ${fullName(item.student)}`}
                    title="Editar"
                  >
                    <Pencil aria-hidden />
                  </Button>
                  <ConfirmDelete
                    title={`¿Eliminar a ${fullName(item.student)}?`}
                    description="Se eliminará el alumno y su boletín del ciclo lectivo. Esta acción no se puede deshacer."
                    onConfirm={() => onDelete(item)}
                  >
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:bg-danger-soft hover:text-danger"
                      aria-label={`Eliminar a ${fullName(item.student)}`}
                      title="Eliminar"
                    >
                      <Trash2 aria-hidden />
                    </Button>
                  </ConfirmDelete>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableCard>
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
