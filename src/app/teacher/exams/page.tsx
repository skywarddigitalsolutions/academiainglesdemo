import type { Metadata } from "next";
import { TeacherExamsContainer } from "@/features/teacher/teacher-exams";

export const metadata: Metadata = { title: "Exámenes" };

export default function Page() {
  return <TeacherExamsContainer />;
}
