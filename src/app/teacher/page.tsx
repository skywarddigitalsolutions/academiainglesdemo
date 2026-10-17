import type { Metadata } from "next";
import { TeacherDashboard } from "@/features/teacher/teacher-dashboard";

export const metadata: Metadata = { title: "Mis cursos" };

export default function Page() {
  return <TeacherDashboard />;
}
