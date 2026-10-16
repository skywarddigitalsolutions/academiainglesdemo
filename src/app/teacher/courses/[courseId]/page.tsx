import { Suspense } from "react";
import { LoadingState } from "@/components/feedback/loading-state";
import { GradeSheetContainer } from "@/features/teacher/grade-sheet/grade-sheet";

export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <GradeSheetContainer />
    </Suspense>
  );
}
