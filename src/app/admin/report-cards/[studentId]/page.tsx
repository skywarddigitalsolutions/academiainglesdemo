import { Suspense } from "react";
import { LoadingState } from "@/components/feedback/loading-state";
import { AdminReportCardContainer } from "@/features/admin/admin-report-card";

export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <AdminReportCardContainer />
    </Suspense>
  );
}
