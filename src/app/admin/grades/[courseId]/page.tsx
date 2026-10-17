import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/feedback/loading-state";
import { CourseGradesContainer } from "@/features/admin/course-grades";

export const metadata: Metadata = { title: "Notas del curso" };

export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <CourseGradesContainer />
    </Suspense>
  );
}
