import Image from "next/image";
import { cn } from "@/lib/utils";

/*
 * The institutional logo (public/logo.png) is gold on an opaque black
 * background, so it only reads well on dark surfaces. `logo-mark.png` and
 * `logo-crest.png` are the same artwork with the black keyed out.
 * On light surfaces use <Wordmark />: the crest inside a dark tile plus text.
 */

const ALT = "Instituto Inmaculada Concepción";

/** Full lockup (crest + name). Dark surfaces only. */
export function LogoLockup({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src="/logo-mark.png"
      alt={ALT}
      width={751}
      height={265}
      priority={priority}
      className={cn("h-16 w-auto select-none", className)}
    />
  );
}

/** Crest only. Dark surfaces only. */
export function LogoCrest({ className, decorative = false }: { className?: string; decorative?: boolean }) {
  return (
    <Image
      src="/logo-crest.png"
      alt={decorative ? "" : ALT}
      width={316}
      height={261}
      className={cn("h-8 w-auto select-none", className)}
    />
  );
}

/** Crest on a small dark tile, usable on light surfaces (and in print). */
export function CrestTile({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-ink shadow-[inset_0_0_0_1px_rgb(184_145_47/0.35)]",
        className,
      )}
    >
      <LogoCrest decorative className="h-[62%]" />
    </span>
  );
}

/** Text wordmark with the crest tile, for light surfaces. */
export function Wordmark({
  className,
  subtitle = "Instituto de Inglés",
  tileClassName,
}: {
  className?: string;
  subtitle?: string;
  tileClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <CrestTile className={tileClassName} />
      <span className="leading-tight">
        <span className="block text-sm font-semibold tracking-[-0.01em] text-foreground">
          Instituto Inmaculada Concepción
        </span>
        {subtitle && <span className="block text-xs text-muted-foreground">{subtitle}</span>}
      </span>
    </span>
  );
}
