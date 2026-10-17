import Image from "next/image";
import { cn } from "@/lib/utils";

/*
 * The institutional crest (public/logo-crest.png) is gold artwork on a
 * transparent background, so it works on light and dark surfaces alike.
 * On light surfaces use a slightly larger size so the thin gold lines read.
 */

const ALT = "Instituto Inmaculada Concepción";

/** The crest, without any background tile. */
export function LogoCrest({
  className,
  decorative = false,
}: {
  className?: string;
  decorative?: boolean;
}) {
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
