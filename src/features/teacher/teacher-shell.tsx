"use client";

import type { ReactNode } from "react";
import { ClipboardList } from "lucide-react";
import { AppShell, type NavItem } from "@/components/layout/app-shell";
import { useAsyncData } from "@/providers/use-async-data";
import { useSession } from "@/providers/session-provider";

/** Container: teacher navigation, with the assigned courses listed. */
export function TeacherShell({ children }: { children: ReactNode }) {
  const { state } = useSession();
  const teacherId = state.session?.userId ?? "";
  const { data } = useAsyncData(`teacher-nav:${teacherId}`, (s) =>
    s.teacher.listCourses(teacherId),
  );

  const nav: NavItem[] = [
    {
      label: "Mis cursos",
      href: "/teacher",
      icon: ClipboardList,
      exact: true,
      children: (data ?? []).map(({ course }) => ({
        href: `/teacher/courses/${course.id}`,
        label: course.name,
      })),
    },
  ];

  return (
    <AppShell role="teacher" nav={nav}>
      {children}
    </AppShell>
  );
}
