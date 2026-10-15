import { Suspense } from "react";
import { LoadingState } from "@/components/feedback/loading-state";
import { ParentReportCardContainer } from "@/features/parent/parent-report-card";

export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ParentReportCardContainer />
    </Suspense>
  );
}
