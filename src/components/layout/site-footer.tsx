export function SiteFooter() {
  return (
    <footer className="border-t-2 border-gold bg-navy text-white/80 print:hidden">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-5 text-xs sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="font-heading text-sm text-white">
            Instituto Inmaculada Concepción
          </span>{" "}
          · Instituto de Inglés
        </p>
        <p>Versión de demostración · Los datos se guardan solo en este navegador.</p>
      </div>
    </footer>
  );
}
