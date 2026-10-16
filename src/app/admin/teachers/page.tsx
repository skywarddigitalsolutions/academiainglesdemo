import type { Metadata } from "next";
import { TeachersList } from "@/features/admin/courses-and-teachers";

export const metadata: Metadata = { title: "Docentes" };

export default function Page() {
  return <TeachersList />;
}
