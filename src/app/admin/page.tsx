import type { Metadata } from "next";
import { AdminOverview } from "@/features/admin/admin-overview";

export const metadata: Metadata = { title: "Tablero" };

export default function Page() {
  return <AdminOverview />;
}
