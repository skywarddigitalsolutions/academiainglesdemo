import { Suspense } from "react";
import { LoadingState } from "@/components/feedback/loading-state";
import { CourseRosterContainer } from "@/features/teacher/course-roster";

export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <CourseRosterContainer />
    </Suspense>
  );
}
