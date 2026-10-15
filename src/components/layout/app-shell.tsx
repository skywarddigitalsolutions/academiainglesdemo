"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS, type Role } from "@/domain/user";
import { ResetDemoButton } from "@/features/demo/reset-demo-button";
import { cn } from "@/lib/utils";
import { useSession } from "@/providers/session-provider";
import { SiteFooter } from "./site-footer";

export interface NavItem {
  href: string;
  label: string;
  /** Match only the exact path (for section home links). */
  exact?: boolean;
}

export function AppShell({
  role,
  nav,
  children,
}: {
  role: Role;
  nav: NavItem[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { state, logout } = useSession();
  const name = state.status === "authenticated" ? state.session.displayName : "";

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b-2 border-gold bg-navy text-white print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link href={nav[0]?.href ?? "/"} className="flex min-w-0 items-center gap-3">
            <BrandLogo className="h-10" />
            <div className="min-w-0 leading-tight">
              <p className="truncate font-heading text-base font-semibold text-white sm:text-lg">
                Instituto Inmaculada Concepción
              </p>
              <p className="text-xs text-celeste">
                Boletín en línea · {ROLE_LABELS[role]}
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            <span className="mr-2 hidden text-sm text-white/85 md:inline">{name}</span>
            <ResetDemoButton className="hidden text-white hover:bg-white/10 hover:text-white sm:inline-flex" />
            <Button
              variant="ghost"
              size="lg"
              onClick={handleLogout}
              className="text-white hover:bg-white/10 hover:text-white"
            >
              <LogOut aria-hidden />
              <span className="hidden sm:inline">Salir</span>
              <span className="sr-only sm:hidden">Cerrar sesión</span>
            </Button>
          </div>
        </div>
        <nav aria-label="Secciones" className="border-t border-white/10 bg-navy-soft">
          <ul className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item) ? "page" : undefined}
                  className={cn(
                    "inline-flex h-11 items-center border-b-2 border-transparent px-3 text-sm font-medium whitespace-nowrap text-white/80 transition-colors hover:text-white",
                    isActive(item) && "border-celeste text-white",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8 print:max-w-none print:p-0">
        {children}
      </main>
      <div className="mx-auto w-full max-w-6xl px-4 pb-4 sm:hidden print:hidden">
        <ResetDemoButton variant="outline" className="w-full" />
      </div>
      <SiteFooter />
    </div>
  );
}
