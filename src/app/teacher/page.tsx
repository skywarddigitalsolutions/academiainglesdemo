import type { Metadata } from "next";
import { TeacherDashboard } from "@/features/teacher/teacher-dashboard";

export const metadata: Metadata = { title: "Inicio" };

export default function Page() {
  return <TeacherDashboard />;
}
