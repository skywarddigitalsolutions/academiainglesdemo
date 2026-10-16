import type { Metadata } from "next";
import { TeacherReportCards } from "@/features/teacher/teacher-report-cards";

export const metadata: Metadata = { title: "Boletines" };

export default function Page() {
  return <TeacherReportCards />;
}
