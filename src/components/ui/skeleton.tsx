import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Shimmering placeholder block used while data loads. */
export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-shimmer rounded-md bg-[linear-gradient(90deg,#eef2f6_0%,#f6f8fa_50%,#eef2f6_100%)] bg-[length:200%_100%]",
        className,
      )}
      {...props}
    />
  );
}
