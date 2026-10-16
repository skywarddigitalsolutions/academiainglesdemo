import { Crest } from "@/components/brand/crest";

export function SiteFooter() {
  return (
    <footer className="border-t bg-card print:hidden">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="flex items-center gap-2">
          <Crest className="h-5 text-foreground" />
          <span className="font-medium text-foreground">Instituto Inmaculada Concepción</span>
          <span aria-hidden>·</span>
          <span>Instituto de Inglés</span>
        </p>
        <p>Versión de demostración. Los datos se guardan solo en este navegador.</p>
      </div>
    </footer>
  );
}
