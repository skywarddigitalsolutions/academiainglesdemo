"use client";

import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { CoursePicker } from "@/features/grade-sheet/course-picker";
import { useAsyncData } from "@/providers/use-async-data";

/** Container: Notas starts by choosing a course. */
export function GradesCourses() {
  const { data, error, loading } = useAsyncData("admin-grade-courses", (s) =>
    s.admin.listCourses(),
  );

  return (
    <>
      <PageHeader
        title="Notas"
        description="Elija un curso para ver y corregir las calificaciones de cada período."
      />
      {loading && <LoadingState variant="cards" />}
      {error && <ErrorState message={error} />}
      {data && <CoursePicker courses={data} hrefFor={(id) => `/admin/grades/${id}`} />}
    </>
  );
}
