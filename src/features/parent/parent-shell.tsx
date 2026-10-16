"use client";

import type { ReactNode } from "react";
import { Users } from "lucide-react";
import { AppShell, type NavItem } from "@/components/layout/app-shell";
import { useAsyncData } from "@/providers/use-async-data";
import { useSession } from "@/providers/session-provider";

/** Container: family navigation, with one item per child (their report card). */
export function ParentShell({ children }: { children: ReactNode }) {
  const { state } = useSession();
  const parentId = state.session?.userId ?? "";
  const { data } = useAsyncData(`parent-nav:${parentId}`, (s) =>
    s.parent.listChildren(parentId),
  );

  const nav: NavItem[] = [
    {
      label: "Mis hijos",
      href: "/parent",
      icon: Users,
      exact: true,
      children: (data ?? []).map(({ student }) => ({
        href: `/parent/report-cards/${student.id}`,
        label: `Boletín de ${student.firstName}`,
      })),
    },
  ];

  return (
    <AppShell role="parent" nav={nav}>
      {children}
    </AppShell>
  );
}
