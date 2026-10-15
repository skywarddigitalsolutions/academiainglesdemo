import type { Metadata } from "next";
import { ParentHome } from "@/features/parent/parent-home";

export const metadata: Metadata = { title: "Mis hijos" };

export default function Page() {
  return <ParentHome />;
}
