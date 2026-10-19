"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useState, useSyncExternalStore, type ComponentProps, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, LogOut, Menu, type LucideIcon } from "lucide-react";
import { LogoCrest } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ROLE_LABELS, type Role } from "@/domain/user";
import { ResetDemoButton } from "@/features/demo/reset-demo-button";
import { cn } from "@/lib/utils";
import { useSession } from "@/providers/session-provider";

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

const COLLAPSED_KEY = "panel-sidebar-collapsed";

/*
 * Collapsed sidebar preference, remembered per browser (best effort): a tiny
 * external store over localStorage, with an in-memory value when storage is
 * unavailable. The server snapshot is always "expanded".
 */
let collapsedInMemory: boolean | null = null;
const collapsedListeners = new Set<() => void>();

function readCollapsed(): boolean {
  if (collapsedInMemory !== null) return collapsedInMemory;
  try {
    return window.localStorage.getItem(COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

function subscribeCollapsed(listener: () => void) {
  collapsedListeners.add(listener);
  return () => {
    collapsedListeners.delete(listener);
  };
}

function useCollapsed(): [boolean, () => void] {
  const collapsed = useSyncExternalStore(subscribeCollapsed, readCollapsed, () => false);
  function toggle() {
    const next = !readCollapsed();
    collapsedInMemory = next;
    try {
      window.localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
    } catch {
      // Ignore: the preference is just not remembered.
    }
    collapsedListeners.forEach((listener) => listener());
  }
  return [collapsed, toggle];
}

export function AppShell({
  role,
  nav,
  headerAction,
  children,
}: {
  role: Role;
  nav: NavItem[];
  /** Top-bar control on the right (e.g. the family notifications bell). */
  headerAction?: ReactNode;
  children: ReactNode;
}) {
  const [collapsed, toggleCollapsed] = useCollapsed();
  const [mobileOpen, setMobileOpen] = useState(false);
  const home = nav.find((item) => item.href)?.href ?? "/";

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Desktop sidebar */}
        <aside
          id="panel-sidebar"
          className={cn(
            "fixed inset-y-0 left-0 z-40 hidden transition-[width] duration-200 motion-reduce:transition-none md:block print:hidden",
            collapsed ? "w-[4.5rem]" : "w-64",
          )}
        >
          <Sidebar role={role} nav={nav} collapsed={collapsed} />
          {/* Collapse handle, centered on the sidebar edge. */}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-controls="panel-sidebar"
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
            title={collapsed ? "Expandir menú" : "Contraer menú"}
            className="absolute top-1/2 -right-3.5 z-10 flex size-7 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-sidebar-accent text-white shadow-[0_1px_3px_rgb(4_26_42/0.25)] transition-[background-color,border-color,transform] duration-150 hover:scale-110 hover:border-white/50 hover:bg-primary-strong focus-visible:border-white focus-visible:bg-primary-strong focus-visible:ring-4 focus-visible:ring-primary/35 focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:scale-100"
          >
            {collapsed ? (
              <ChevronRight className="size-4" aria-hidden />
            ) : (
              <ChevronLeft className="size-4" aria-hidden />
            )}
          </button>
        </aside>

        {/* Mobile drawer */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="left"
            aria-describedby={undefined}
            className="w-[min(18rem,85vw)] border-none bg-navy p-0 text-sidebar-foreground [&>button]:text-white"
          >
            <SheetTitle className="sr-only">Menú</SheetTitle>
            <Sidebar role={role} nav={nav} onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        <div
          className={cn(
            "flex min-h-screen min-w-0 flex-col transition-[padding] duration-200 motion-reduce:transition-none print:pl-0",
            collapsed ? "md:pl-[4.5rem]" : "md:pl-64",
          )}
        >
          {/* Phones and tablets only: on desktop the sidebar carries the brand. */}
          <header className="sticky top-0 z-30 flex h-14 items-center gap-1 border-b border-border bg-card/90 px-2 backdrop-blur-md sm:px-4 md:hidden print:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="size-11 shrink-0 text-navy"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu className="size-5" />
            </Button>
            <Link
              href={home}
              className="flex min-h-11 min-w-0 items-center gap-2 rounded-md px-1 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
            >
              <LogoCrest decorative className="h-8 shrink-0" />
              <span className="truncate font-serif text-[0.95rem] font-semibold text-navy">
                Inmaculada Concepción
              </span>
            </Link>
            {headerAction && <div className="ml-auto shrink-0">{headerAction}</div>}
          </header>
          {headerAction && (
            <div className="sticky top-0 z-30 hidden h-14 items-center justify-end border-b border-border bg-card/90 px-6 backdrop-blur-md md:flex lg:px-10 print:hidden">
              {headerAction}
            </div>
          )}
          <main className="mx-auto w-full max-w-7xl min-w-0 flex-1 px-4 pt-6 pb-16 md:pt-10 sm:px-6 lg:px-10 print:max-w-none print:p-0">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}

type SidebarProps = Omit<ComponentProps<typeof SidebarBody>, "pathname">;

/*
 * The pathname is URL data: reading it outside <Suspense> blocks prerendering
 * of dynamic routes. The fallback renders the same sidebar without highlight.
 */
function Sidebar(props: SidebarProps) {
  return (
    <Suspense fallback={<SidebarBody {...props} pathname="" />}>
      <SidebarWithPath {...props} />
    </Suspense>
  );
}

function SidebarWithPath(props: SidebarProps) {
  return <SidebarBody {...props} pathname={usePathname()} />;
}

function SidebarBody({
  role,
  nav,
  pathname,
  collapsed = false,
  onNavigate,
}: {
  role: Role;
  nav: NavItem[];
  pathname: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
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
    <div className="navy-grain flex h-full flex-col text-sidebar-foreground">
      <Link
        href={home}
        onClick={onNavigate}
        title={collapsed ? "Instituto Inmaculada Concepción" : undefined}
        className={cn(
          "flex h-[4.5rem] shrink-0 items-center gap-3 border-b border-white/10 text-white focus-visible:ring-2 focus-visible:ring-navy-muted/60 focus-visible:outline-none focus-visible:ring-inset",
          collapsed ? "justify-center px-2" : "px-5",
        )}
      >
        <LogoCrest className="h-9 shrink-0" />
        {!collapsed && (
          <span className="min-w-0 leading-tight">
            <span className="block font-serif text-[0.95rem] font-semibold">
              Inmaculada Concepción
            </span>
            <span className="block truncate text-xs text-sidebar-muted">Boletín digital</span>
          </span>
        )}
      </Link>

      <nav
        aria-label="Navegación principal"
        className="flex-1 overflow-x-hidden overflow-y-auto px-3 py-5"
      >
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

      <div className="shrink-0 border-t border-white/10 p-3">
        <div
          className={cn(
            "mb-2 flex items-center gap-3 rounded-lg",
            collapsed ? "justify-center py-1" : "bg-white/5 px-2.5 py-2",
          )}
          title={collapsed ? `${name} · ${ROLE_LABELS[role]}` : undefined}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 font-serif text-[0.8rem] font-semibold text-white ring-1 ring-white/25">
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
    "h-9 w-full text-[13px] font-normal text-sidebar-foreground shadow-none hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-navy-muted/60",
    collapsed ? "justify-center px-0" : "justify-start gap-3 px-3",
  );
}

const itemBase =
  "relative flex h-10 items-center gap-3 rounded-lg text-[13.5px] font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-navy-muted/60 focus-visible:outline-none";

/* Active row: a light pill plus a celeste marker on the left edge. */
const activeMarker =
  "before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-navy-muted";

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
      <Icon className="size-[18px] shrink-0" aria-hidden />
      {collapsed ? <span className="sr-only">{item.label}</span> : <span className="truncate">{item.label}</span>}
    </>
  );

  const rowClass = (active: boolean) =>
    cn(
      itemBase,
      collapsed ? "justify-center px-0" : "px-3",
      active
        ? cn("bg-white/12 text-white", activeMarker)
        : "text-sidebar-foreground/90 hover:bg-white/6 hover:text-white",
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
        <ul className="mt-0.5 mb-1 ml-5 flex flex-col gap-0.5 border-l border-white/15 pl-3">
          {item.children.map((child) => {
            const active = matches(pathname, child.href);
            return (
              <li key={child.href}>
                <Link
                  href={child.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex h-8 items-center rounded-md px-2.5 text-[13px] transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-navy-muted/60 focus-visible:outline-none",
                    active
                      ? cn("bg-white/12 font-medium text-white", activeMarker)
                      : "text-sidebar-foreground/85 hover:bg-white/6 hover:text-white",
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
