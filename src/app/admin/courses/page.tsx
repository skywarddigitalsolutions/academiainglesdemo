import type { Metadata } from "next";
import { CoursesList } from "@/features/admin/courses-and-teachers";

export const metadata: Metadata = { title: "Cursos" };

export default function Page() {
  return <CoursesList />;
}
