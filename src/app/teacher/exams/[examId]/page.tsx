import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/feedback/loading-state";
import { TeacherExamContainer } from "@/features/teacher/teacher-exams";

export const metadata: Metadata = { title: "Examen" };

export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <TeacherExamContainer />
    </Suspense>
  );
}
