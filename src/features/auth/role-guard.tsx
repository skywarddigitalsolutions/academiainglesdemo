"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ROLE_HOME, type Role } from "@/domain/user";
import { useSession } from "@/providers/session-provider";
import { LoadingState } from "@/components/feedback/loading-state";

/**
 * Client-side route guard: only shows children for the given role.
 *
 * Children are always rendered (hidden until access is confirmed) so the
 * route segment below this layout is part of the prerender. Dropping it made
 * Next.js skip instant-navigation validation for the nested page.
 * Data hooks wait for an authenticated session before loading.
 */
export function RoleGuard({ role, children }: { role: Role; children: ReactNode }) {
  const { state } = useSession();
  const router = useRouter();
  const allowed = state.status === "authenticated" && state.session.role === role;

  useEffect(() => {
    if (state.status === "anonymous") router.replace("/login");
    if (state.status === "authenticated" && state.session.role !== role) {
      router.replace(ROLE_HOME[state.session.role]);
    }
  }, [state, role, router]);

  return (
    <>
      {!allowed && <LoadingState label="Verificando acceso…" fullScreen />}
      <div hidden={!allowed}>{children}</div>
    </>
  );
}
