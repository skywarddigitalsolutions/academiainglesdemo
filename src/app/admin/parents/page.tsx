import type { Metadata } from "next";
import { ParentsAdmin } from "@/features/admin/parents-admin";

export const metadata: Metadata = { title: "Familias" };

export default function Page() {
  return <ParentsAdmin />;
}
