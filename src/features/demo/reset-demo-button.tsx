"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSession } from "@/providers/session-provider";

export function ResetDemoButton({
  className,
  variant = "ghost",
  iconOnly = false,
}: {
  className?: string;
  variant?: "ghost" | "outline";
  iconOnly?: boolean;
}) {
  const { resetDemo } = useSession();
  const [busy, setBusy] = useState(false);

  async function handleReset() {
    setBusy(true);
    try {
      await resetDemo();
      toast.success("La demo se reinició con los datos de ejemplo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant={variant}
          className={cn(className)}
          disabled={busy}
          title={iconOnly ? "Reiniciar demo" : undefined}
        >
          <RotateCcw aria-hidden />
          {iconOnly ? <span className="sr-only">Reiniciar demo</span> : "Reiniciar demo"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Reiniciar la demo?</AlertDialogTitle>
          <AlertDialogDescription>
            Se descartarán todos los cambios realizados y se restaurarán los
            datos de ejemplo originales.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleReset}>Reiniciar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
