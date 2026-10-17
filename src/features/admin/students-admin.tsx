"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import type { StudentListItem } from "@/application/admin-use-cases";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageHeader, SectionHeading } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import {
  Table,
  TableBody,
  TableCard,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fullName } from "@/domain/student";
import { displayName } from "@/domain/user";
import { Schedule } from "@/features/grade-sheet/course-picker";
import { errorMessage } from "@/lib/error-message";
import { getServices } from "@/providers/services";
import { useAsyncData } from "@/providers/use-async-data";
import { ConfirmDelete } from "./confirm-delete";
import { CourseCards } from "./course-cards";
import {
  StudentDialog,
  editStudentForm,
  newStudentForm,
  type StudentFormState,
} from "./student-dialog";
import { searchStudents } from "./student-search";

/**
 * Container: Alumnos. Without `?course=` it shows the courses plus a search
 * across the whole institute; with it, that course's student list.
 */
export function StudentsAdmin() {
  const params = useSearchParams();
  const { data, error, loading, reload } = useAsyncData("admin-students", async (s) => {
    const [students, courses, parents] = await Promise.all([
      s.admin.listStudents(),
      s.admin.listCourses(),
      s.admin.listParents(),
    ]);
    return { students, courses, parents: parents.map((p) => p.parent) };
  });
  const [form, setForm] = useState<StudentFormState | null>(null);
  const [query, setQuery] = useState("");
  const [courseQuery, setCourseQuery] = useState("");

  const courseId = params.get("course");
  const overview = data?.courses.find((c) => c.course.id === courseId) ?? null;

  async function handleDelete(item: StudentListItem) {
    try {
      await getServices().admin.deleteStudent(item.student.id);
      toast.success(`${fullName(item.student)} fue eliminado/a.`);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  const newButton = (
    <Button
      disabled={!data}
      onClick={() =>
        setForm(newStudentForm(overview?.course.id ?? data?.courses[0]?.course.id ?? ""))
      }
    >
      <Plus aria-hidden />
      Nuevo alumno
    </Button>
  );

  const tableProps = {
    onEdit: (item: StudentListItem) => setForm(editStudentForm(item.student)),
    onDelete: handleDelete,
  };

  return (
    <>
      {overview ? (
        <PageHeader
          title={overview.course.name}
          breadcrumbs={[
            { label: "Alumnos", href: "/admin/students" },
            { label: overview.course.name },
          ]}
          description={
            <>
              {overview.studentCount === 1 ? "1 alumno" : `${overview.studentCount} alumnos`} ·{" "}
              {overview.teachers.map(displayName).join(", ") || "Sin docente asignado"}
              <span className="hidden sm:inline">
                {" · "}
                <Schedule value={overview.course.schedule} />
              </span>
              . Haga clic en un nombre para ver el boletín completo.
            </>
          }
          actions={newButton}
        />
      ) : (
        <PageHeader
          title="Alumnos"
          description="Elija un curso para ver sus alumnos, o busque por nombre en todo el instituto."
          actions={newButton}
        />
      )}
      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {data && overview && (
        <CourseStudents
          items={data.students.filter((s) => s.student.courseId === overview.course.id)}
          query={courseQuery}
          onQueryChange={setCourseQuery}
          {...tableProps}
        />
      )}
      {data && !overview && (
        <>
          <div className="mb-6">
            <SearchInput
              aria-label="Buscar alumno en todos los cursos"
              placeholder="Buscar alumno por nombre o apellido"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {query.trim() !== "" && (
            <section className="mb-10" aria-live="polite">
              <SectionHeading title="Resultados" />
              <StudentTable items={searchStudents(data.students, query)} showCourse {...tableProps} />
            </section>
          )}
          <CourseCards
            courses={data.courses}
            basePath="/admin/students"
            countLabel={({ studentCount: n }) => (n === 1 ? "1 alumno" : `${n} alumnos`)}
            linkLabel="Ver alumnos"
          />
        </>
      )}
      {data && form && (
        <StudentDialog
          initial={form}
          courses={data.courses.map((c) => c.course)}
          parents={data.parents}
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

function CourseStudents({
  items,
  query,
  onQueryChange,
  ...tableProps
}: {
  items: StudentListItem[];
  query: string;
  onQueryChange: (query: string) => void;
  onEdit: (item: StudentListItem) => void;
  onDelete: (item: StudentListItem) => Promise<void>;
}) {
  const filtered = useMemo(
    () => (query.trim() === "" ? items : searchStudents(items, query)),
    [items, query],
  );
  return (
    <>
      <div className="mb-4">
        <SearchInput
          aria-label="Buscar alumno en este curso"
          placeholder="Buscar en este curso"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
      </div>
      <StudentTable items={filtered} {...tableProps} />
    </>
  );
}

function StudentTable({
  items,
  showCourse = false,
  onEdit,
  onDelete,
}: {
  items: StudentListItem[];
  showCourse?: boolean;
  onEdit: (item: StudentListItem) => void;
  onDelete: (item: StudentListItem) => Promise<void>;
}) {
  if (items.length === 0) {
    return <EmptyState icon={Users} title="No se encontraron alumnos" />;
  }
  return (
    <TableCard>
      <Table stackOnMobile>
        <TableHeader>
          <TableRow>
            <TableHead>Alumno/a</TableHead>
            {showCourse && <TableHead>Curso</TableHead>}
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
                <Link
                  href={`/admin/report-cards/${item.student.id}`}
                  title="Ver boletín completo"
                  className="rounded-sm hover:text-primary-strong hover:underline focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
                >
                  {item.student.lastName}, {item.student.firstName}
                </Link>
              </TableCell>
              {showCourse && (
                <TableCell data-label="Curso" className="whitespace-nowrap text-muted-foreground">
                  {item.course ? (
                    <Link
                      href={`/admin/students?course=${item.course.id}`}
                      className="rounded-sm hover:text-primary-strong hover:underline focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
                    >
                      {item.course.name}
                    </Link>
                  ) : (
                    "Sin curso"
                  )}
                </TableCell>
              )}
              <TableCell data-label="Responsables" className="text-muted-foreground md:min-w-48">
                {item.guardians.length > 0
                  ? item.guardians.map(displayName).join(", ")
                  : "Sin responsables vinculados"}
              </TableCell>
              <TableCell data-stack="actions">
                <div className="flex justify-end gap-1">
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
