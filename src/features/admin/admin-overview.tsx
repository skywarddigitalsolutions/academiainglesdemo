"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, ClipboardCheck, Users, type LucideIcon } from "lucide-react";
import type { CourseOverview } from "@/application/admin-use-cases";
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
import { gradingTypeLabel } from "@/domain/course";
import { displayName } from "@/domain/user";
import { useAsyncData } from "@/providers/use-async-data";

/** Container: institution overview for the director. */
export function AdminOverview() {
  const { data, error, loading } = useAsyncData("admin-overview", (s) =>
    s.admin.getOverview(),
  );

  return (
    <>
      <PageHeader
        title="Inicio"
        description="Estado general de los boletines del ciclo lectivo."
        actions={
          <Button asChild>
            <Link href="/admin/approvals">
              <ClipboardCheck aria-hidden />
              Revisar aprobaciones
            </Link>
          </Button>
        }
      />
      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {data && (
        <>
          <ul className="mb-10 grid gap-4 sm:grid-cols-3">
            <StatCard label="Alumnos" value={data.totals.students} icon={Users} href="/admin/students" />
            <StatCard label="Cursos" value={data.courses.length} icon={BookOpen} href="/admin/courses" />
            <StatCard
              label="Aprobaciones pendientes"
              value={data.totals.pendingApprovals}
              icon={ClipboardCheck}
              href="/admin/approvals"
              hint={data.totals.pendingApprovals > 0 ? "Requieren revisión" : "Todo al día"}
            />
          </ul>
          <CourseTable courses={data.courses} />
        </>
      )}
    </>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  href,
  hint,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  href: string;
  hint?: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="group flex h-full flex-col rounded-lg border bg-card p-5 shadow-xs transition-colors hover:border-slate-300 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{label}</span>
          <Icon className="size-4 text-slate-400" aria-hidden />
        </div>
        <span className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{value}</span>
        {hint && <span className="mt-1 text-xs text-muted-foreground">{hint}</span>}
      </Link>
    </li>
  );
}

function CourseTable({ courses }: { courses: CourseOverview[] }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold">Cursos</h2>
      <TableCard>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Curso</TableHead>
              <TableHead>Calificación</TableHead>
              <TableHead>Profesor/a</TableHead>
              <TableHead className="text-right">Alumnos</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.map(({ course, teachers, studentCount, pendingApprovals }) => (
              <TableRow key={course.id}>
                <TableCell className="font-medium whitespace-nowrap">{course.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {gradingTypeLabel(course.gradingType)}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {teachers.map(displayName).join(", ") || "Sin asignar"}
                </TableCell>
                <TableCell className="text-right tabular-nums">{studentCount}</TableCell>
                <TableCell>
                  {pendingApprovals > 0 ? (
                    <StatusBadge tone="warning" dot>
                      {pendingApprovals} por aprobar
                    </StatusBadge>
                  ) : (
                    <StatusBadge tone="success" dot>
                      Al día
                    </StatusBadge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/admin/students?course=${course.id}`}
                    className="inline-flex items-center gap-1 text-sm font-medium whitespace-nowrap text-primary hover:underline"
                  >
                    Ver alumnos <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableCard>
    </section>
  );
}
