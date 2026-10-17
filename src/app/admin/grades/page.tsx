import type { Metadata } from "next";
import { GradesCourses } from "@/features/admin/grades-courses";

export const metadata: Metadata = { title: "Notas" };

export default function Page() {
  return <GradesCourses />;
}
