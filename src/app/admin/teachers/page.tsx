import type { Metadata } from "next";
import { TeachersList } from "@/features/admin/courses-and-teachers";

export const metadata: Metadata = { title: "Profesores" };

export default function Page() {
  return <TeachersList />;
}
