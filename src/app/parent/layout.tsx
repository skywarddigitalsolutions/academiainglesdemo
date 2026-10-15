import { AppShell } from "@/components/layout/app-shell";
import { RoleGuard } from "@/features/auth/role-guard";

const NAV = [{ href: "/parent", label: "Mis hijos" }];

export default function ParentLayout({ children }: LayoutProps<"/parent">) {
  return (
    <RoleGuard role="parent">
      <AppShell role="parent" nav={NAV}>
        {children}
      </AppShell>
    </RoleGuard>
  );
}
