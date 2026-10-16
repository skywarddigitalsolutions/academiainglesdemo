"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { LogOut, Menu, PanelLeft, type LucideIcon } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ROLE_LABELS, type Role } from "@/domain/user";
import { ResetDemoButton } from "@/features/demo/reset-demo-button";
import { cn } from "@/lib/utils";
import { useSession } from "@/providers/session-provider";
import { BreadcrumbProvider, Breadcrumbs } from "./breadcrumbs";

export interface NavChild {
  href: string;
  label: string;
}

export interface NavItem {
  label: string;
  icon: LucideIcon;
  /** Omit for a group header that only lists its children. */
  href?: string;
  /** Match only the exact path (for section home links). */
  exact?: boolean;
  children?: NavChild[];
}

function matches(pathname: string, href: string, exact = false) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
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
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <BreadcrumbProvider>
      <div className="min-h-screen bg-background">
        {/* Desktop sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 hidden transition-[width] duration-200 md:block print:hidden",
            collapsed ? "w-16" : "w-64",
          )}
        >
          <SidebarBody role={role} nav={nav} collapsed={collapsed} />
        </aside>

        {/* Mobile drawer */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="left"
            aria-describedby={undefined}
            className="border-none bg-sidebar p-0 text-sidebar-foreground [&>button]:text-white"
          >
            <SheetTitle className="sr-only">Menú</SheetTitle>
            <SidebarBody role={role} nav={nav} onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        <div
          className={cn(
            "flex min-h-screen flex-col transition-[padding] duration-200 print:pl-0",
            collapsed ? "md:pl-16" : "md:pl-64",
          )}
        >
          <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-card/90 px-4 backdrop-blur sm:px-6 print:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="-ml-2 md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="-ml-2 hidden text-muted-foreground md:inline-flex"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? "Expandir barra lateral" : "Contraer barra lateral"}
              aria-pressed={collapsed}
            >
              <PanelLeft />
            </Button>
            <span className="mr-1 hidden h-5 w-px bg-border md:block" aria-hidden />
            <Breadcrumbs />
          </header>
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8 print:max-w-none print:p-0">
            {children}
          </main>
        </div>
      </div>
    </BreadcrumbProvider>
  );
}

function SidebarBody({
  role,
  nav,
  collapsed = false,
  onNavigate,
}: {
  role: Role;
  nav: NavItem[];
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { state, logout } = useSession();
  const name = state.status === "authenticated" ? state.session.displayName : "";
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  const home = nav.find((item) => item.href)?.href ?? "/";

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <Link
        href={home}
        onClick={onNavigate}
        className={cn(
          "flex h-14 shrink-0 items-center gap-3 border-b border-sidebar-border text-white",
          collapsed ? "justify-center px-2" : "px-5",
        )}
      >
        <BrandLogo className="h-7 shrink-0" />
        {!collapsed && (
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-semibold">Inmaculada Concepción</span>
            <span className="block truncate text-xs text-sidebar-muted">Boletín en línea</span>
          </span>
        )}
      </Link>

      <nav aria-label="Navegación principal" className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-1">
          {nav.map((item) => (
            <SidebarItem
              key={item.label}
              item={item}
              pathname={pathname}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-sidebar-border p-3">
        <div
          className={cn("mb-2 flex items-center gap-3", collapsed ? "justify-center" : "px-2 py-1")}
          title={collapsed ? `${name} · ${ROLE_LABELS[role]}` : undefined}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold text-white">
            {initials}
          </span>
          {!collapsed && (
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-medium text-white">{name}</span>
              <span className="block truncate text-xs text-sidebar-muted">{ROLE_LABELS[role]}</span>
            </span>
          )}
        </div>
        <div className="flex flex-col gap-0.5">
          <ResetDemoButton iconOnly={collapsed} className={sidebarButton(collapsed)} />
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={sidebarButton(collapsed)}
            title={collapsed ? "Cerrar sesión" : undefined}
          >
            <LogOut aria-hidden />
            {collapsed ? <span className="sr-only">Cerrar sesión</span> : "Cerrar sesión"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function sidebarButton(collapsed: boolean) {
  return cn(
    "h-9 w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-white focus-visible:ring-blue-400/60",
    collapsed ? "justify-center px-0" : "justify-start gap-3 px-3",
  );
}

const itemBase =
  "relative flex h-9 items-center gap-3 rounded-md text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-blue-400/60 focus-visible:outline-none";

function SidebarItem({
  item,
  pathname,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const childActive = item.children?.some((c) => matches(pathname, c.href)) ?? false;
  const selfActive = item.href ? matches(pathname, item.href, item.exact) : false;
  const href = item.href ?? item.children?.[0]?.href;

  const content = (
    <>
      <Icon className="size-4 shrink-0" aria-hidden />
      {collapsed ? <span className="sr-only">{item.label}</span> : <span className="truncate">{item.label}</span>}
    </>
  );

  const rowClass = (active: boolean) =>
    cn(
      itemBase,
      collapsed ? "justify-center px-0" : "px-3",
      active
        ? "bg-sidebar-accent text-white before:absolute before:inset-y-2 before:-left-3 before:w-0.5 before:rounded-full before:bg-white"
        : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-white",
    );

  if (collapsed) {
    if (!href) return null;
    return (
      <li>
        <Link
          href={href}
          title={item.label}
          aria-current={selfActive ? "page" : undefined}
          className={rowClass(selfActive || childActive)}
        >
          {content}
        </Link>
      </li>
    );
  }

  return (
    <li>
      {item.href ? (
        <Link
          href={item.href}
          onClick={onNavigate}
          aria-current={selfActive ? "page" : undefined}
          className={rowClass(selfActive)}
        >
          {content}
        </Link>
      ) : (
        <div className={cn(itemBase, "px-3 text-sidebar-foreground", childActive && "text-white")}>
          {content}
        </div>
      )}
      {item.children && item.children.length > 0 && (
        <ul className="mt-0.5 mb-1 ml-5 flex flex-col gap-0.5 border-l border-sidebar-border pl-3">
          {item.children.map((child) => {
            const active = matches(pathname, child.href);
            return (
              <li key={child.href}>
                <Link
                  href={child.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-8 items-center rounded-md px-2.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-blue-400/60 focus-visible:outline-none",
                    active
                      ? "bg-sidebar-accent font-medium text-white"
                      : "text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-white",
                  )}
                >
                  <span className="truncate">{child.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}
