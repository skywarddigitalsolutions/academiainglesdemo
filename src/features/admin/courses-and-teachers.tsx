"use client";

import { useState } from "react";
import { BookOpen, Pencil, Plus, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import type { CourseOverview, TeacherListItem } from "@/application/admin-use-cases";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
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
import { gradingTypeLabel, schoolLevelLabel } from "@/domain/course";
import { displayName } from "@/domain/user";
import { errorMessage } from "@/lib/error-message";
import { getServices } from "@/providers/services";
import { useAsyncData } from "@/providers/use-async-data";
import { ConfirmDelete } from "./confirm-delete";
import {
  CourseDialog,
  editCourseForm,
  newCourseForm,
  type CourseFormState,
} from "./course-dialog";
import {
  TeacherDialog,
  editTeacherForm,
  newTeacherForm,
  type TeacherFormState,
} from "./teacher-dialog";

const deleteButtonClass = "text-muted-foreground hover:bg-danger-soft hover:text-danger";

/** Container: Cursos (create, edit and delete; grading type is set per course). */
export function CoursesList() {
  const { data, error, loading, reload } = useAsyncData("admin-courses", async (s) => {
    const [courses, teachers] = await Promise.all([s.admin.listCourses(), s.admin.listTeachers()]);
    return { courses, teachers: teachers.map((t) => t.teacher) };
  });
  const [form, setForm] = useState<CourseFormState | null>(null);

  async function handleDelete({ course }: CourseOverview) {
    try {
      await getServices().admin.deleteCourse(course.id);
      toast.success(`El curso ${course.name} fue eliminado.`);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  const editing = data?.courses.find((c) => c.course.id === form?.id);

  return (
    <>
      <PageHeader
        title="Cursos"
        description="El tipo de calificación se define por curso: conceptual o numérica."
        actions={
          <Button disabled={!data} onClick={() => setForm(newCourseForm())}>
            <Plus aria-hidden />
            Nuevo curso
          </Button>
        }
      />
      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {data && data.courses.length === 0 && (
        <EmptyState icon={BookOpen} title="Todavía no hay cursos cargados" />
      )}
      {data && data.courses.length > 0 && (
        <TableCard>
          <Table stackOnMobile>
            <TableHeader>
              <TableRow>
                <TableHead>Curso</TableHead>
                <TableHead>Calificación</TableHead>
                <TableHead>Horario</TableHead>
                <TableHead>Docente</TableHead>
                <TableHead className="text-right">Alumnos</TableHead>
                <TableHead>Curso siguiente</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.courses.map((item) => {
                const { course, teachers, studentCount } = item;
                return (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium whitespace-nowrap">{course.name}</TableCell>
                    <TableCell data-label="Calificación">
                      <span className="text-xs whitespace-nowrap text-muted-foreground">
                        {schoolLevelLabel(course.level)} · {gradingTypeLabel(course.gradingType)}
                      </span>
                    </TableCell>
                    <TableCell data-label="Horario" className="whitespace-nowrap text-muted-foreground tabular-nums">
                      {course.schedule}
                    </TableCell>
                    <TableCell data-label="Docente" className="whitespace-nowrap">
                      {teachers.map(displayName).join(", ") || "Sin asignar"}
                    </TableCell>
                    <TableCell data-label="Alumnos" className="text-right tabular-nums">
                      {studentCount}
                    </TableCell>
                    <TableCell data-label="Curso siguiente" className="whitespace-nowrap text-muted-foreground">
                      {course.nextCourseName || "—"}
                    </TableCell>
                    <TableCell data-stack="actions">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setForm(editCourseForm(course))}
                          aria-label={`Editar ${course.name}`}
                          title="Editar"
                        >
                          <Pencil aria-hidden />
                        </Button>
                        <ConfirmDelete
                          title={`¿Eliminar ${course.name}?`}
                          description="Se eliminará el curso. Solo es posible si no tiene alumnos. Esta acción no se puede deshacer."
                          onConfirm={() => handleDelete(item)}
                        >
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className={deleteButtonClass}
                            aria-label={`Eliminar ${course.name}`}
                            title="Eliminar"
                          >
                            <Trash2 aria-hidden />
                          </Button>
                        </ConfirmDelete>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableCard>
      )}
      {data && form && (
        <CourseDialog
          initial={form}
          teachers={data.teachers}
          hasStudents={(editing?.studentCount ?? 0) > 0}
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

/** Container: Docentes (accounts and assigned courses). */
export function TeachersList() {
  const { data, error, loading, reload } = useAsyncData("admin-teachers", async (s) => {
    const [teachers, courses] = await Promise.all([s.admin.listTeachers(), s.admin.listCourses()]);
    return { teachers, courses: courses.map((c) => c.course) };
  });
  const [form, setForm] = useState<TeacherFormState | null>(null);

  async function handleDelete({ teacher }: TeacherListItem) {
    try {
      await getServices().admin.deleteTeacher(teacher.id);
      toast.success(`${displayName(teacher)} fue eliminado/a.`);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <>
      <PageHeader
        title="Docentes"
        description="Docentes del instituto, sus usuarios de acceso y cursos asignados."
        actions={
          <Button disabled={!data} onClick={() => setForm(newTeacherForm())}>
            <Plus aria-hidden />
            Nuevo docente
          </Button>
        }
      />
      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {data && data.teachers.length === 0 && (
        <EmptyState icon={UserRound} title="Todavía no hay docentes cargados" />
      )}
      {data && data.teachers.length > 0 && (
        <TableCard>
          <Table stackOnMobile>
            <TableHeader>
              <TableRow>
                <TableHead>Docente</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Correo electrónico</TableHead>
                <TableHead>Cursos</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.teachers.map((item) => {
                const { teacher, courses } = item;
                const name = displayName(teacher);
                return (
                  <TableRow key={teacher.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                          {teacher.firstName[0]}
                          {teacher.lastName[0]}
                        </span>
                        <span className="font-medium whitespace-nowrap">{name}</span>
                      </div>
                    </TableCell>
                    <TableCell data-label="Usuario" className="text-muted-foreground">
                      {teacher.username}
                    </TableCell>
                    <TableCell data-label="Correo" className="text-muted-foreground">
                      {teacher.email || "—"}
                    </TableCell>
                    <TableCell data-label="Cursos">
                      <div className="flex flex-wrap justify-end gap-1.5 md:justify-start">
                        {courses.length === 0 && (
                          <span className="text-sm text-muted-foreground">Sin cursos</span>
                        )}
                        {courses.map((c) => (
                          <StatusBadge key={c.id}>{c.name}</StatusBadge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell data-stack="actions">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setForm(editTeacherForm(teacher, courses))}
                          aria-label={`Editar a ${name}`}
                          title="Editar"
                        >
                          <Pencil aria-hidden />
                        </Button>
                        <ConfirmDelete
                          title={`¿Eliminar a ${name}?`}
                          description="Se eliminará la cuenta del docente. Solo es posible si no tiene cursos asignados. Esta acción no se puede deshacer."
                          onConfirm={() => handleDelete(item)}
                        >
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className={deleteButtonClass}
                            aria-label={`Eliminar a ${name}`}
                            title="Eliminar"
                          >
                            <Trash2 aria-hidden />
                          </Button>
                        </ConfirmDelete>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableCard>
      )}
      {data && form && (
        <TeacherDialog
          initial={form}
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
