import { cn } from "@/lib/utils";

/**
 * Placeholder emblem for the institute (gold on navy shield).
 * Replace by dropping the real logo at `public/logo.png` (see BrandLogo).
 */
export function Crest({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 140"
      role="img"
      aria-label="Escudo del Instituto Inmaculada Concepción"
      className={cn("h-12 w-auto", className)}
    >
      <defs>
        <linearGradient id="crest-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e2c25a" />
          <stop offset="55%" stopColor="#c9a227" />
          <stop offset="100%" stopColor="#a8851a" />
        </linearGradient>
      </defs>
      {/* Small cross on top */}
      <path
        d="M57 2h6v8h8v6h-8v10h-6V16h-8v-6h8z"
        fill="url(#crest-gold)"
      />
      {/* Shield */}
      <path
        d="M60 28 L108 40 V78 C108 106 86 126 60 136 C34 126 12 106 12 78 V40 Z"
        fill="#001d39"
        stroke="url(#crest-gold)"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path
        d="M60 37 L100 47 V78 C100 101 82 118 60 127 C38 118 20 101 20 78 V47 Z"
        fill="none"
        stroke="url(#crest-gold)"
        strokeWidth="1.2"
        opacity="0.8"
      />
      {/* Open book */}
      <path
        d="M36 92c8-4 16-4 24 1c8-5 16-5 24-1v14c-8-4-16-4-24 1c-8-5-16-5-24-1z"
        fill="none"
        stroke="url(#crest-gold)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M60 93v14" stroke="url(#crest-gold)" strokeWidth="1.6" />
      {/* Monogram */}
      <text
        x="60"
        y="80"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="30"
        fontWeight="700"
        fill="url(#crest-gold)"
        letterSpacing="1"
      >
        IC
      </text>
      {/* Star */}
      <path
        d="M60 46l2.4 5 5.4.6-4 3.7 1.1 5.3L60 58l-4.9 2.6 1.1-5.3-4-3.7 5.4-.6z"
        fill="url(#crest-gold)"
      />
    </svg>
  );
}
