import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/feedback/loading-state";
import { StudentsAdmin } from "@/features/admin/students-admin";

export const metadata: Metadata = { title: "Alumnos" };

export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <StudentsAdmin />
    </Suspense>
  );
}
