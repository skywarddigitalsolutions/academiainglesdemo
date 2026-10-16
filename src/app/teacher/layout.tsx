import { RoleGuard } from "@/features/auth/role-guard";
import { TeacherShell } from "@/features/teacher/teacher-shell";

export default function TeacherLayout({ children }: LayoutProps<"/teacher">) {
  return (
    <RoleGuard role="teacher">
      <TeacherShell>{children}</TeacherShell>
    </RoleGuard>
  );
}
