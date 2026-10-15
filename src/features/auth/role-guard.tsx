"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ROLE_HOME, type Role } from "@/domain/user";
import { useSession } from "@/providers/session-provider";
import { LoadingState } from "@/components/feedback/loading-state";

/** Client-side route guard: only renders children for the given role. */
export function RoleGuard({ role, children }: { role: Role; children: ReactNode }) {
  const { state } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (state.status === "anonymous") router.replace("/login");
    if (state.status === "authenticated" && state.session.role !== role) {
      router.replace(ROLE_HOME[state.session.role]);
    }
  }, [state, role, router]);

  if (state.status !== "authenticated" || state.session.role !== role) {
    return <LoadingState label="Verificando acceso…" fullScreen />;
  }
  return <>{children}</>;
}
