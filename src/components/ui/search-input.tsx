import { Search } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { Input } from "./input";

export function SearchInput({ className, ...props }: ComponentProps<typeof Input>) {
  return (
    <div className={cn("relative w-full sm:max-w-xs", className)}>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input type="search" className="h-9 bg-card pl-9" {...props} />
    </div>
  );
}
