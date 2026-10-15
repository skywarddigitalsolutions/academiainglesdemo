"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Crest } from "./crest";

/**
 * Shows `public/logo.png` when it exists; otherwise the SVG crest placeholder.
 * The crest is rendered first, so there is never a broken image.
 */
export function BrandLogo({ className }: { className?: string }) {
  const [hasLogo, setHasLogo] = useState(false);

  return (
    <>
      {!hasLogo && <Crest className={className} />}
      {/* eslint-disable-next-line @next/next/no-img-element -- optional asset, may not exist */}
      <img
        src="/logo.png"
        alt="Logo del Instituto Inmaculada Concepción"
        className={cn("h-12 w-auto object-contain", className, !hasLogo && "hidden")}
        onLoad={() => setHasLogo(true)}
        onError={() => setHasLogo(false)}
      />
    </>
  );
}
