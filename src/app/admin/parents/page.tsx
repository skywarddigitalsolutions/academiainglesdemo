import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/feedback/loading-state";
import { ParentsAdmin } from "@/features/admin/parents-admin";

export const metadata: Metadata = { title: "Familias" };

export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ParentsAdmin />
    </Suspense>
  );
}
