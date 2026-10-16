"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import type { CourseRoster as Roster } from "@/application/teacher-use-cases";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageHeader } from "@/components/layout/page-header";
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
import { gradingTypeLabel } from "@/domain/course";
import { fullName } from "@/domain/student";
import { BimesterStatusBadge } from "@/features/report-card/bimester-status-badge";
import { useAsyncData } from "@/providers/use-async-data";
import { useSession } from "@/providers/session-provider";

/** Container: loads the roster of a course for the current teacher. */
export function CourseRosterContainer() {
  const { courseId } = useParams<{ courseId: string }>();
  const { state } = useSession();
  const teacherId = state.session?.userId ?? "";
  const { data, error, loading } = useAsyncData(`roster:${teacherId}:${courseId}`, (s) =>
    s.teacher.getCourseRoster(teacherId, courseId),
  );

  if (loading) return <LoadingState />;
  if (error || !data) {
    return <ErrorState message={error ?? "Curso no encontrado."} backHref="/teacher" />;
  }
  return <CourseRosterView roster={data} />;
}

/** Presentational: students of a course with their bimester statuses. */
function CourseRosterView({ roster }: { roster: Roster }) {
  const { course, students } = roster;
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q === ""
      ? students
      : students.filter(({ student }) => fullName(student).toLowerCase().includes(q));
  }, [students, query]);

  return (
    <>
      <PageHeader
        title={course.name}
        breadcrumbs={[{ label: "Mis cursos", href: "/teacher" }, { label: course.name }]}
        description={`${gradingTypeLabel(course.gradingType)} · ${course.schedule} · ${students.length} alumnos`}
      />

      <div className="mb-4">
        <SearchInput
          aria-label="Buscar alumno"
          placeholder="Buscar alumno"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No se encontraron alumnos" />
      ) : (
        <>
          {/* Mobile: list */}
          <ul className="divide-y rounded-lg border bg-card shadow-xs md:hidden">
            {filtered.map(({ student, statuses }) => (
              <li key={student.id}>
                <Link
                  href={`/teacher/students/${student.id}`}
                  className="flex items-center justify-between gap-3 p-4"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{fullName(student)}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {statuses.map((status, i) => (
                        <span key={i} className="inline-flex items-center gap-1 text-xs">
                          <span className="text-muted-foreground">B{i + 1}</span>
                          <BimesterStatusBadge status={status} compact />
                        </span>
                      ))}
                    </div>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-slate-400" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop: table */}
          <TableCard className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alumno/a</TableHead>
                  {[1, 2, 3, 4].map((n) => (
                    <TableHead key={n} className="text-center">
                      {n}° Bim.
                    </TableHead>
                  ))}
                  <TableHead>
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(({ student, statuses }) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{fullName(student)}</TableCell>
                    {statuses.map((status, i) => (
                      <TableCell key={i} className="text-center">
                        <BimesterStatusBadge status={status} compact />
                      </TableCell>
                    ))}
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/teacher/students/${student.id}`}>Abrir boletín</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
        </>
      )}
    </>
  );
}
