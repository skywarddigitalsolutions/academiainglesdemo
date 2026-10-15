import { AppShell } from "@/components/layout/app-shell";
import { RoleGuard } from "@/features/auth/role-guard";

const NAV = [{ href: "/teacher", label: "Mis cursos" }];

export default function TeacherLayout({ children }: LayoutProps<"/teacher">) {
  return (
    <RoleGuard role="teacher">
      <AppShell role="teacher" nav={NAV}>
        {children}
      </AppShell>
    </RoleGuard>
  );
}
