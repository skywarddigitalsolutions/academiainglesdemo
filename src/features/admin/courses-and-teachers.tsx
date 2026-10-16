"use client";

import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageHeader } from "@/components/layout/page-header";
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
import { gradingTypeLabel } from "@/domain/course";
import { displayName } from "@/domain/user";
import { useAsyncData } from "@/providers/use-async-data";

/** Read-only list of courses (grading type is configured per course). */
export function CoursesList() {
  const { data, error, loading } = useAsyncData("admin-courses", (s) => s.admin.listCourses());
  return (
    <>
      <PageHeader
        title="Cursos"
        description="El tipo de calificación se define por curso: conceptual o numérica."
      />
      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {data && (
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Curso</TableHead>
                <TableHead>Calificación</TableHead>
                <TableHead>Horario</TableHead>
                <TableHead>Docente</TableHead>
                <TableHead className="text-right">Alumnos</TableHead>
                <TableHead>Curso siguiente</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(({ course, teachers, studentCount }) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium whitespace-nowrap">{course.name}</TableCell>
                  <TableCell>
                    <StatusBadge>{gradingTypeLabel(course.gradingType)}</StatusBadge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{course.schedule}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {teachers.map(displayName).join(", ") || "Sin asignar"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{studentCount}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {course.nextCourseName}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
      )}
    </>
  );
}

/** Read-only list of teachers and their courses. */
export function TeachersList() {
  const { data, error, loading } = useAsyncData("admin-teachers", (s) => s.admin.listTeachers());
  return (
    <>
      <PageHeader title="Docentes" description="Docentes del instituto y cursos asignados." />
      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {data && (
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Docente</TableHead>
                <TableHead>Correo electrónico</TableHead>
                <TableHead>Cursos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(({ teacher, courses }) => (
                <TableRow key={teacher.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                        {teacher.firstName[0]}
                        {teacher.lastName[0]}
                      </span>
                      <span className="font-medium whitespace-nowrap">{displayName(teacher)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{teacher.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {courses.map((c) => (
                        <StatusBadge key={c.id}>{c.name}</StatusBadge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
      )}
    </>
  );
}
