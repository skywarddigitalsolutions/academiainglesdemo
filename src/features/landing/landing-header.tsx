"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { LogoCrest } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { activeSection } from "./active-section";

const NAV = [
  { id: "que-va-a-ver", label: "Qué va a ver" },
  { id: "acceso", label: "Cómo acceder" },
  { id: "instituto", label: "El instituto" },
  { id: "contacto", label: "Contacto" },
];
const NAV_IDS = NAV.map((item) => item.id);

/** Current section for aria-current and the active indicator. */
function useScrollspy(): string | null {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const inBand = new Set<string>();
    // The footer (#contacto) is short and may never cross the reading line:
    // at the very bottom of the page it is the current section.
    const atBottom = () =>
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    const update = () =>
      setActive(atBottom() ? NAV_IDS[NAV_IDS.length - 1] : activeSection(NAV_IDS, inBand));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) inBand.add(entry.target.id);
          else inBand.delete(entry.target.id);
        }
        update();
      },
      // A thin reading line a little above the middle of the screen.
      { rootMargin: "-40% 0px -55% 0px" },
    );
    for (const id of NAV_IDS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", update);
    };
  }, []);
  return active;
}

function useScrolled(): boolean {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 24);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return scrolled;
}

/**
 * Floating, translucent navy bar. Translucent navy keeps white text readable
 * over the light sections too; it tightens a little once the page scrolls.
 */
export function LandingHeader() {
  const active = useScrollspy();
  const scrolled = useScrolled();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-4 sm:pt-4 print:hidden">
      <div
        className={cn(
          "mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-2xl border border-white/10 px-3 backdrop-blur-md transition-[height,background-color,box-shadow] duration-300 motion-reduce:transition-none sm:px-4",
          scrolled
            ? "h-14 bg-navy/85 shadow-[0_10px_30px_-12px_rgb(4_26_42/0.55)]"
            : "h-16 bg-navy/55 shadow-[0_6px_20px_-14px_rgb(4_26_42/0.5)]",
        )}
      >
        <Brand />

        <nav aria-label="Secciones" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV.map((item) => {
              const current = active === item.id;
              return (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    aria-current={current ? "location" : undefined}
                    className={cn(
                      "relative inline-flex h-10 items-center rounded-full px-3.5 text-sm transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-navy-muted/70 focus-visible:outline-none",
                      "after:absolute after:inset-x-3.5 after:bottom-1 after:h-0.5 after:rounded-full after:bg-navy-muted after:transition-opacity after:duration-200",
                      current
                        ? "bg-white/10 text-white after:opacity-100"
                        : "text-navy-muted after:opacity-0 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="hidden shrink-0 items-center gap-4 lg:flex">
          <Link
            href="/login"
            className="text-sm text-navy-muted underline-offset-[6px] transition-colors hover:text-white hover:underline"
          >
            Acceso docentes
          </Link>
          <Button asChild className="h-10 bg-white px-4 text-navy hover:bg-navy-muted">
            <Link href="/login">Ingresar</Link>
          </Button>
        </div>

        <MobileMenu open={menuOpen} onOpenChange={setMenuOpen} active={active} />
      </div>
    </header>
  );
}

function Brand({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onNavigate}
      className="flex min-h-11 min-w-0 items-center gap-2.5 rounded-lg focus-visible:ring-2 focus-visible:ring-navy-muted/70 focus-visible:outline-none"
    >
      <LogoCrest decorative className="h-9 shrink-0 sm:h-10" />
      <span className="min-w-0 leading-tight">
        <span className="block font-serif text-[0.98rem] font-semibold text-white">
          <span className="hidden xl:inline">Instituto </span>Inmaculada Concepción
        </span>
        <span className="hidden text-xs tracking-[0.02em] text-navy-muted sm:block">
          Instituto de Inglés
        </span>
      </span>
    </Link>
  );
}

/** Full-screen navy menu for phones and tablets (focus trap and Escape via Radix Dialog). */
function MobileMenu({
  open,
  onOpenChange,
  active,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  active: string | null;
}) {
  const close = () => onOpenChange(false);
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label="Abrir menú"
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-white transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-navy-muted/70 focus-visible:outline-none lg:hidden"
        >
          <Menu className="size-5" aria-hidden />
        </button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="navy-backdrop fixed inset-0 z-50 flex flex-col overflow-y-auto px-4 pt-3 pb-8 text-white data-[state=open]:animate-in data-[state=open]:fade-in-0 motion-reduce:animate-none sm:px-6 sm:pt-4"
        >
          <DialogPrimitive.Title className="sr-only">Menú</DialogPrimitive.Title>
          <div className="flex h-16 items-center justify-between gap-4 px-3">
            <Brand onNavigate={close} />
            <DialogPrimitive.Close
              aria-label="Cerrar menú"
              className="inline-flex size-11 items-center justify-center rounded-xl text-white transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-navy-muted/70 focus-visible:outline-none"
            >
              <X className="size-5" aria-hidden />
            </DialogPrimitive.Close>
          </div>

          <nav aria-label="Secciones" className="mt-8 px-3">
            <ul className="border-t border-white/15">
              {NAV.map((item) => (
                <li key={item.id} className="border-b border-white/15">
                  <a
                    href={`#${item.id}`}
                    onClick={close}
                    aria-current={active === item.id ? "location" : undefined}
                    className={cn(
                      "flex min-h-16 items-center font-serif text-3xl font-semibold transition-colors focus-visible:text-white focus-visible:outline-none",
                      active === item.id ? "text-white" : "text-navy-muted hover:text-white",
                    )}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-auto flex flex-col gap-3 px-3 pt-10">
            <Button asChild size="lg" className="h-12 bg-white text-[0.95rem] text-navy hover:bg-navy-muted">
              <Link href="/login" onClick={close}>
                Ingresar
              </Link>
            </Button>
            <Link
              href="/login"
              onClick={close}
              className="inline-flex min-h-11 items-center justify-center text-sm text-navy-muted hover:text-white"
            >
              Acceso docentes y Dirección
            </Link>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
