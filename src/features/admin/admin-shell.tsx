"use client";

import type { ReactNode } from "react";
import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Users,
  UsersRound,
} from "lucide-react";
import { AppShell, type NavItem } from "@/components/layout/app-shell";

const NAV: NavItem[] = [
  { label: "Inicio", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Alumnos", href: "/admin/students", icon: Users },
  { label: "Notas", href: "/admin/grades", icon: ClipboardList },
  { label: "Exámenes", href: "/admin/exams", icon: CalendarDays },
  { label: "Familias", href: "/admin/parents", icon: UsersRound },
  { label: "Cursos", href: "/admin/courses", icon: BookOpen },
  { label: "Docentes", href: "/admin/teachers", icon: GraduationCap },
];

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <AppShell role="admin" nav={NAV}>
      {children}
    </AppShell>
  );
}
