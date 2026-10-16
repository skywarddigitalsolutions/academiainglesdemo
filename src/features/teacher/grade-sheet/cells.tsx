"use client";

import { useState, type ComponentProps } from "react";
import { ChevronDown, MessageSquarePlus, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { isLowGrade } from "./sheet-model";

/*
 * Compact spreadsheet cells. Every focusable cell carries `data-cell="row:col"`
 * so the sheet can move focus with Enter / arrow keys.
 */

const cellBase =
  "h-8 w-full rounded-md border border-slate-200 bg-white text-[13px] text-foreground tabular-nums shadow-[0_1px_1px_rgb(15_23_42/0.03)] transition-[border-color,box-shadow,background-color] duration-150 outline-none hover:border-slate-300 focus:border-primary/70 focus:ring-4 focus:ring-primary/12 disabled:cursor-not-allowed disabled:border-slate-100 disabled:bg-slate-50 disabled:text-slate-400 disabled:shadow-none";

const lowTone = "border-danger-border bg-danger-soft/80 text-danger hover:border-danger/40";
const invalidTone = "border-danger/70 ring-2 ring-danger/15 hover:border-danger/70";

export function TextCell({
  cell,
  value,
  onValueChange,
  invalid,
  hintLow = false,
  className,
  ...props
}: Omit<ComponentProps<"input">, "value" | "onChange"> & {
  cell: string;
  value: string;
  onValueChange: (value: string) => void;
  invalid?: boolean;
  /** Tint values below the pass mark (hint only). */
  hintLow?: boolean;
}) {
  return (
    <input
      type="text"
      autoComplete="off"
      spellCheck={false}
      data-cell={cell}
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      onFocus={(e) => e.currentTarget.select()}
      aria-invalid={invalid || undefined}
      className={cn(
        cellBase,
        "px-2 text-center font-medium placeholder:font-normal placeholder:text-slate-300",
        hintLow && isLowGrade(value) && lowTone,
        invalid && invalidTone,
        className,
      )}
      {...props}
    />
  );
}

export function SelectCell({
  cell,
  value,
  onValueChange,
  options,
  placeholder = "—",
  hintLow = false,
  className,
  ...props
}: Omit<ComponentProps<"select">, "value" | "onChange"> & {
  cell: string;
  value: string;
  onValueChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
  placeholder?: string;
  hintLow?: boolean;
}) {
  return (
    <div className={cn("relative", className)}>
      <select
        data-cell={cell}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className={cn(
          cellBase,
          "appearance-none truncate pr-7 pl-2.5",
          value === "" && "text-slate-400",
          hintLow && isLowGrade(value) && lowTone,
        )}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-slate-400"
        aria-hidden
      />
    </div>
  );
}

export function ObservationCell({
  cell,
  studentName,
  value,
  onValueChange,
}: {
  cell: string;
  studentName: string;
  value: string;
  onValueChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const filled = value.trim() !== "";
  const Icon = filled ? MessageSquareText : MessageSquarePlus;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-cell={cell}
          aria-label={`Observación de ${studentName}${filled ? " (con texto)" : " (vacía)"}`}
          title={filled ? value : "Agregar observación"}
          className={cn(
            "relative inline-flex size-8 items-center justify-center rounded-md border transition-[border-color,box-shadow,background-color,color] duration-150 outline-none focus-visible:border-primary/70 focus-visible:ring-4 focus-visible:ring-primary/12",
            filled
              ? "border-blue-200 bg-primary-soft text-primary hover:border-blue-300"
              : "border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:text-slate-600",
          )}
        >
          <Icon className="size-4" aria-hidden />
          {filled && (
            <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-primary ring-2 ring-white" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] max-w-[calc(100vw-2rem)] p-0">
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-semibold">Observación</p>
          <p className="truncate text-xs text-muted-foreground">{studentName}</p>
        </div>
        <div className="p-4">
          <Textarea
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            rows={5}
            maxLength={600}
            placeholder="Comentario para la familia sobre el desempeño del bimestre."
            className="min-h-28 resize-none text-sm leading-relaxed"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) setOpen(false);
            }}
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground tabular-nums">{value.length}/600</span>
            <Button size="sm" onClick={() => setOpen(false)}>
              Listo
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
