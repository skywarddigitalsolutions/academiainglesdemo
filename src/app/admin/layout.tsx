import { RoleGuard } from "@/features/auth/role-guard";
import { AdminShell } from "@/features/admin/admin-shell";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <RoleGuard role="admin">
      <AdminShell>{children}</AdminShell>
    </RoleGuard>
  );
}
