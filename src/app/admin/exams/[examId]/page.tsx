import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/feedback/loading-state";
import { AdminExamContainer } from "@/features/admin/admin-exams";

export const metadata: Metadata = { title: "Examen" };

export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <AdminExamContainer />
    </Suspense>
  );
}
