import type { Metadata } from "next";
import { Approvals } from "@/features/admin/approvals";

export const metadata: Metadata = { title: "Aprobaciones pendientes" };

export default function Page() {
  return <Approvals />;
}
