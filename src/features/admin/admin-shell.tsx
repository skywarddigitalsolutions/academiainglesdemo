"use client";

import type { ReactNode } from "react";
import {
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  Users,
  UsersRound,
} from "lucide-react";
import { AppShell, type NavItem } from "@/components/layout/app-shell";

const NAV: NavItem[] = [
  { label: "Inicio", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Aprobaciones pendientes", href: "/admin/approvals", icon: ClipboardCheck },
  { label: "Alumnos", href: "/admin/students", icon: Users },
  { label: "Familias", href: "/admin/parents", icon: UsersRound },
  { label: "Cursos", href: "/admin/courses", icon: BookOpen },
  { label: "Profesores", href: "/admin/teachers", icon: GraduationCap },
];

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <AppShell role="admin" nav={NAV}>
      {children}
    </AppShell>
  );
}
