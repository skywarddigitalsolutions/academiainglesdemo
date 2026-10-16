import { cn } from "@/lib/utils";

/**
 * Monochrome mark for the institute. It inherits `currentColor`, so it works
 * on the dark sidebar and on white surfaces.
 * Replace by dropping the real logo at `public/logo.png` (see BrandLogo).
 */
export function Crest({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 36"
      role="img"
      aria-label="Escudo del Instituto Inmaculada Concepción"
      className={cn("h-8 w-auto", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    >
      <path d="M16 2 L29 6 V17 C29 25.5 23.5 31 16 34 C8.5 31 3 25.5 3 17 V6 Z" />
      <path d="M9.5 21.5c2.2-1.1 4.4-1.1 6.5.3c2.1-1.4 4.3-1.4 6.5-.3v5c-2.2-1.1-4.4-1.1-6.5.3c-2.1-1.4-4.3-1.4-6.5-.3z" strokeWidth="1.6" />
      <path d="M16 21.8v5" strokeWidth="1.4" />
      <path d="M16 8.5v7M12.5 12h7" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
