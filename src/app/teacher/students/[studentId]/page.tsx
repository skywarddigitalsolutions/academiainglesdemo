import { Suspense } from "react";
import { LoadingState } from "@/components/feedback/loading-state";
import { ReportCardEditorContainer } from "@/features/teacher/report-card-editor";

export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ReportCardEditorContainer />
    </Suspense>
  );
}
