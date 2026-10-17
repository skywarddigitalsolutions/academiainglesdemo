"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { Loader2, Mail, Pencil, Phone, Plus, Trash2, UsersRound } from "lucide-react";
import { toast } from "sonner";
import type { ParentListItem } from "@/application/admin-use-cases";
import { DEMO_PASSWORD } from "@/application/demo-constants";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageHeader, SectionHeading } from "@/components/layout/page-header";
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
import { StatusBadge } from "@/components/ui/status-badge";
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
import { MAX_GUARDIANS, fullName, type Student } from "@/domain/student";
import { displayName } from "@/domain/user";
import { Schedule } from "@/features/grade-sheet/course-picker";
import { errorMessage } from "@/lib/error-message";
import { getServices } from "@/providers/services";
import { useAsyncData } from "@/providers/use-async-data";
import { ConfirmDelete } from "./confirm-delete";
import { CourseCards } from "./course-cards";
import { familiesInCourse, searchFamilies } from "./family-search";

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

/**
 * Container: Familias. Without `?course=` it shows the courses plus a search
 * across the whole institute; with it, the families with a child in that course.
 */
export function ParentsAdmin() {
  const params = useSearchParams();
  const { data, error, loading, reload } = useAsyncData("admin-parents", async (s) => {
    const [parents, students, overviews] = await Promise.all([
      s.admin.listParents(),
      s.admin.listStudents(),
      s.admin.listCourses(),
    ]);
    return {
      parents,
      students: students.map((x) => x.student),
      overviews,
      courses: overviews.map((c) => c.course),
    };
  });
  const [form, setForm] = useState<FormState | null>(null);
  const [query, setQuery] = useState("");
  const [courseQuery, setCourseQuery] = useState("");

  const courseId = params.get("course");
  const overview = data?.overviews.find((c) => c.course.id === courseId) ?? null;

  async function handleDelete(item: ParentListItem) {
    try {
      await getServices().admin.deleteParent(item.parent.id);
      toast.success(`${displayName(item.parent)} fue eliminado/a.`);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  const newButton = (
    <Button disabled={!data} onClick={() => setForm(EMPTY)}>
      <Plus aria-hidden />
      Nueva familia
    </Button>
  );

  const tableProps = {
    courses: data?.courses ?? [],
    onEdit: (item: ParentListItem) =>
      setForm({
        id: item.parent.id,
        firstName: item.parent.firstName,
        lastName: item.parent.lastName,
        username: item.parent.username,
        email: item.parent.email,
        phone: item.parent.phone,
        childIds: item.children.map((c) => c.id),
      }),
    onDelete: handleDelete,
  };

  return (
    <>
      {overview ? (
        <PageHeader
          title={overview.course.name}
          breadcrumbs={[
            { label: "Familias", href: "/admin/parents" },
            { label: overview.course.name },
          ]}
          description={
            <>
              Familias con al menos un hijo en este curso ·{" "}
              {overview.teachers.map(displayName).join(", ") || "Sin docente asignado"}
              <span className="hidden sm:inline">
                {" · "}
                <Schedule value={overview.course.schedule} />
              </span>
              .
            </>
          }
          actions={newButton}
        />
      ) : (
        <PageHeader
          title="Familias"
          description="Elija un curso para ver sus familias, o busque por responsable, usuario o hijo en todo el instituto."
          actions={newButton}
        />
      )}
      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {data && overview && (
        <CourseFamilies
          items={familiesInCourse(data.parents, overview.course.id)}
          query={courseQuery}
          onQueryChange={setCourseQuery}
          {...tableProps}
        />
      )}
      {data && !overview && (
        <>
          <div className="mb-6">
            <SearchInput
              aria-label="Buscar familia en todos los cursos"
              placeholder="Buscar por responsable, usuario o hijo"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {query.trim() !== "" && (
            <section className="mb-10" aria-live="polite">
              <SectionHeading title="Resultados" />
              <FamilyTable items={searchFamilies(data.parents, query)} {...tableProps} />
            </section>
          )}
          <CourseCards
            courses={data.overviews}
            basePath="/admin/parents"
            icon={UsersRound}
            countLabel={({ course }) => {
              const n = familiesInCourse(data.parents, course.id).length;
              return n === 1 ? "1 familia" : `${n} familias`;
            }}
            linkLabel="Ver familias"
          />
        </>
      )}
      {data && form && (
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
  );
}

interface FamilyTableProps {
  courses: Course[];
  onEdit: (item: ParentListItem) => void;
  onDelete: (item: ParentListItem) => Promise<void>;
}

function CourseFamilies({
  items,
  query,
  onQueryChange,
  ...tableProps
}: FamilyTableProps & {
  items: ParentListItem[];
  query: string;
  onQueryChange: (query: string) => void;
}) {
  const filtered = useMemo(
    () => (query.trim() === "" ? items : searchFamilies(items, query)),
    [items, query],
  );
  return (
    <>
      <div className="mb-4">
        <SearchInput
          aria-label="Buscar familia en este curso"
          placeholder="Buscar en este curso"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
      </div>
      <FamilyTable items={filtered} {...tableProps} />
    </>
  );
}

function FamilyTable({
  items,
  courses,
  onEdit,
  onDelete,
}: FamilyTableProps & { items: ParentListItem[] }) {
  if (items.length === 0) {
    return <EmptyState icon={UsersRound} title="No se encontraron familias" />;
  }
  return (
    <TableCard>
      <Table stackOnMobile>
        <TableHeader>
          <TableRow>
            <TableHead>Responsable</TableHead>
            <TableHead>Usuario</TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead>Hijos vinculados</TableHead>
            <TableHead>
              <span className="sr-only">Acciones</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.parent.id}>
              <TableCell className="font-medium whitespace-nowrap">
                {item.parent.lastName}, {item.parent.firstName}
              </TableCell>
              <TableCell data-label="Usuario" className="font-mono text-xs text-muted-foreground">
                {item.parent.username}
              </TableCell>
              <TableCell data-label="Contacto" className="text-muted-foreground">
                <div className="flex flex-col items-end gap-0.5 text-xs md:items-start">
                  {item.parent.email && (
                    <span className="inline-flex items-center gap-1.5 md:whitespace-nowrap">
                      <Mail className="size-3.5" aria-hidden /> {item.parent.email}
                    </span>
                  )}
                  {item.parent.phone && (
                    <span className="inline-flex items-center gap-1.5 md:whitespace-nowrap">
                      <Phone className="size-3.5" aria-hidden /> {item.parent.phone}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell data-label="Hijos">
                {item.children.length === 0 ? (
                  <span className="text-xs text-muted-foreground">Sin hijos vinculados</span>
                ) : (
                  <div className="flex flex-wrap justify-end gap-1.5 md:justify-start">
                    {item.children.map((c) => (
                      <StatusBadge key={c.id}>
                        {c.firstName} {c.lastName} · {courseName(courses, c)}
                      </StatusBadge>
                    ))}
                  </div>
                )}
              </TableCell>
              <TableCell data-stack="actions">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Editar a ${displayName(item.parent)}`}
                    title="Editar"
                    onClick={() => onEdit(item)}
                  >
                    <Pencil aria-hidden />
                  </Button>
                  <ConfirmDelete
                    title={`¿Eliminar a ${displayName(item.parent)}?`}
                    description="Se eliminará el acceso de esta familia y se desvinculará de sus hijos."
                    onConfirm={() => onDelete(item)}
                  >
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:bg-danger-soft hover:text-danger"
                      aria-label={`Eliminar a ${displayName(item.parent)}`}
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
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} className="h-10" />
    </div>
  );
}
