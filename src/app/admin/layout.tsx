import { AppShell } from "@/components/layout/app-shell";
import { RoleGuard } from "@/features/auth/role-guard";

const NAV = [
  { href: "/admin", label: "Resumen", exact: true },
  { href: "/admin/approvals", label: "Aprobaciones" },
  { href: "/admin/students", label: "Alumnos" },
  { href: "/admin/parents", label: "Familias" },
  { href: "/admin/courses", label: "Cursos" },
  { href: "/admin/teachers", label: "Docentes" },
];

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <RoleGuard role="admin">
      <AppShell role="admin" nav={NAV}>
        {children}
      </AppShell>
    </RoleGuard>
  );
}
