import type { ReactNode } from "react";
import { CheckCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

const GRADES = [
  { label: "Nota de aplicación", value: "8" },
  { label: "Conducta", value: "MB" },
];

/**
 * Static replica of the family report card as seen on a phone
 * (features/parent/parent-report-card.tsx, mobile layout). Purely visual:
 * no app state, nothing inside is interactive.
 */
export function ParentPhonePreview() {
  return (
    <figure
      role="img"
      aria-label="Vista del boletín del 2° bimestre en el celular, con la observación del docente y el botón Confirmar lectura"
      className="mx-auto w-full max-w-[18.5rem]"
    >
      {/* Device frame */}
      <div
        aria-hidden
        className="rounded-[2.6rem] bg-navy p-2.5 shadow-[0_2px_4px_rgb(4_26_42/0.12),0_30px_60px_-28px_rgb(11_58_91/0.55)] ring-1 ring-navy/20"
      >
        <div className="relative flex aspect-[9/18.5] flex-col overflow-hidden rounded-[2.1rem] bg-background">
          {/* Speaker slot */}
          <div className="flex h-7 shrink-0 items-center justify-center">
            <span className="h-1.5 w-16 rounded-full bg-navy/15" />
          </div>

          <div className="px-3.5 pb-3">
            <p className="text-[0.62rem] font-semibold tracking-[0.12em] text-primary-strong uppercase">
              2° Grado A
            </p>
            <p className="mt-0.5 font-serif text-lg leading-tight font-semibold text-navy">
              Boletín de Sofía
            </p>
          </div>

          <div className="flex flex-1 flex-col gap-3 px-3">
            <Card
              number={2}
              badge={
                <StatusBadge tone="info" dot className="font-semibold">
                  Nuevo
                </StatusBadge>
              }
              isNew
            >
              <dl className="divide-y divide-primary/10 rounded-lg bg-primary-tint px-2.5">
                {GRADES.map(({ label, value }) => (
                  <div key={label} className="flex items-baseline justify-between gap-3 py-1.5">
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="text-sm font-semibold text-foreground tabular-nums">{value}</dd>
                  </div>
                ))}
              </dl>
              <div>
                <p className="text-[0.68rem] font-semibold text-navy">Observación del docente</p>
                <p className="mt-0.5 text-xs leading-relaxed text-foreground">
                  Participa con entusiasmo y mejoró mucho su lectura en voz alta. Seguir
                  practicando el vocabulario en casa.
                </p>
              </div>
              <span className={cn(buttonVariants({ size: "sm" }), "pointer-events-none h-9 w-full text-xs")}>
                <CheckCheck />
                Confirmar lectura
              </span>
            </Card>

            <Card number={1} badge={<StatusBadge tone="success">Leído</StatusBadge>} />
          </div>
        </div>
      </div>
    </figure>
  );
}

function Card({
  number,
  badge,
  isNew = false,
  children,
}: {
  number: number;
  badge: ReactNode;
  isNew?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "surface-card shrink-0 overflow-hidden",
        isNew && "border-primary/60 ring-2 ring-primary/15",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between gap-2 px-3 py-2",
          children && "border-b",
          isNew ? "border-primary/20 bg-primary-soft" : "border-border bg-primary-tint",
        )}
      >
        <p className="flex items-center gap-2">
          <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-navy font-serif text-sm font-semibold text-white">
            {number}°
          </span>
          <span className="font-serif text-base font-semibold text-navy">{number}° Bimestre</span>
        </p>
        {badge}
      </div>
      {children && <div className="flex flex-col gap-3 p-3">{children}</div>}
    </div>
  );
}
