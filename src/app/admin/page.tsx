import type { Metadata } from "next";
import { AdminOverview } from "@/features/admin/admin-overview";

export const metadata: Metadata = { title: "Dirección" };

export default function Page() {
  return <AdminOverview />;
}
