import { RoleGuard } from "@/features/auth/role-guard";
import { ParentShell } from "@/features/parent/parent-shell";

export default function ParentLayout({ children }: LayoutProps<"/parent">) {
  return (
    <RoleGuard role="parent">
      <ParentShell>{children}</ParentShell>
    </RoleGuard>
  );
}
