import { LogoCrest } from "@/components/brand/logo";

export function SiteFooter() {
  return (
    <footer className="bg-ink text-slate-400 print:hidden">
      <div
        aria-hidden
        className="h-px bg-gradient-to-r from-transparent via-gold/35 to-transparent"
      />
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <LogoCrest className="h-10" />
          <div className="leading-tight">
            <p className="font-medium text-white">Instituto Inmaculada Concepción</p>
            <p className="text-xs">Instituto de Inglés · 130 años</p>
          </div>
        </div>
        <p className="max-w-sm text-xs leading-relaxed sm:text-right">
          Versión de demostración. Los datos se guardan solo en este navegador.
        </p>
      </div>
    </footer>
  );
}
