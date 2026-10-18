import type { Metadata } from "next";
import { AdminExamsContainer } from "@/features/admin/admin-exams";

export const metadata: Metadata = { title: "Exámenes" };

export default function Page() {
  return <AdminExamsContainer />;
}
