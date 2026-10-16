"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FileText } from "lucide-react";
import type { CourseRoster } from "@/application/teacher-use-cases";
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
import { fullName } from "@/domain/student";
import { BimesterStatusBadge } from "@/features/report-card/bimester-status-badge";
import { useAsyncData } from "@/providers/use-async-data";
import { useSession } from "@/providers/session-provider";

/** Container: every report card of the teacher, across all courses. */
export function TeacherReportCards() {
  const { state } = useSession();
  const teacherId = state.session?.userId ?? "";
  const { data, error, loading } = useAsyncData(
    `teacher-report-cards:${teacherId}`,
    async (s) => {
      const courses = await s.teacher.listCourses(teacherId);
      return Promise.all(
        courses.map(({ course }) => s.teacher.getCourseRoster(teacherId, course.id)),
      );
    },
  );

  return (
    <>
      <PageHeader
        title="Boletines"
        description="Todos los boletines de sus cursos, con el estado de cada bimestre."
      />
      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {data && <ReportCardTable rosters={data} />}
    </>
  );
}

/** Presentational: searchable table of students and bimester statuses. */
function ReportCardTable({ rosters }: { rosters: CourseRoster[] }) {
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rosters
      .flatMap(({ course, students }) => students.map((entry) => ({ course, ...entry })))
      .filter(
        ({ student, course }) =>
          q === "" ||
          fullName(student).toLowerCase().includes(q) ||
          course.name.toLowerCase().includes(q),
      );
  }, [rosters, query]);

  return (
    <>
      <div className="mb-4">
        <SearchInput
          aria-label="Buscar por alumno o curso"
          placeholder="Buscar por alumno o curso"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={FileText} title="No se encontraron boletines" />
      ) : (
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alumno/a</TableHead>
                <TableHead>Curso</TableHead>
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
              {rows.map(({ student, course, statuses }) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium whitespace-nowrap">
                    {fullName(student)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {course.name}
                  </TableCell>
                  {statuses.map((status, i) => (
                    <TableCell key={i} className="text-center">
                      <BimesterStatusBadge status={status} compact />
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/teacher/students/${student.id}`}>Abrir</Link>
                    </Button>
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
