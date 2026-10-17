import { LogoCrest } from "@/components/brand/logo";

const ROWS = [
  { label: "Nota de aplicación", values: ["8", "9", "8", "—"] },
  { label: "Conducta", values: ["MB", "E", "MB", "—"] },
  { label: "Inasistencias", values: ["1", "0", "2", "—"] },
];

/**
 * Decorative illustration of the printed report card: an A4 sheet laid over
 * a second one. Purely visual; the real sheet lives in features/report-card.
 */
export function ReportCardDocument() {
  return (
    <figure
      role="img"
      aria-label="Ejemplo de boletín de calificaciones impreso"
      className="relative mx-auto w-full max-w-[22rem] sm:max-w-[25rem]"
    >
      {/* Back sheet */}
      <div
        aria-hidden
        className="absolute inset-0 translate-x-5 translate-y-3 rotate-[4deg] rounded-[3px] border border-sky-100 bg-primary-tint shadow-[0_1px_2px_rgb(15_23_42/0.05)]"
      />
      {/* Front sheet */}
      <div
        aria-hidden
        className="relative flex aspect-[210/297] -rotate-[1.5deg] flex-col rounded-[3px] border border-stone-200 bg-white p-[8%] text-navy shadow-[0_1px_2px_rgb(15_23_42/0.06),0_24px_48px_-24px_rgb(11_58_91/0.28)]"
      >
        <div className="flex items-center gap-3 border-b border-navy/80 pb-3">
          <LogoCrest decorative className="h-10 shrink-0" />
          <div className="leading-tight">
            <p className="font-serif text-[0.8rem] font-semibold">Instituto Inmaculada Concepción</p>
            <p className="text-[0.62rem] tracking-[0.08em] text-slate-600 uppercase">Instituto de Inglés</p>
          </div>
        </div>

        <p className="mt-4 font-serif text-[1.3rem] leading-tight font-semibold tracking-[-0.01em]">
          Boletín de calificaciones
        </p>
        <p className="text-[0.66rem] text-slate-600">Ciclo lectivo 2026</p>

        <dl className="mt-3 grid grid-cols-2 gap-x-4 text-[0.66rem]">
          <div className="border-b border-stone-200 py-1">
            <dt className="text-[0.55rem] tracking-[0.08em] text-slate-600 uppercase">Alumno</dt>
            <dd className="font-medium">Tomás Romero</dd>
          </div>
          <div className="border-b border-stone-200 py-1">
            <dt className="text-[0.55rem] tracking-[0.08em] text-slate-600 uppercase">Curso</dt>
            <dd className="font-medium">5° Grado A</dd>
          </div>
        </dl>

        <table className="mt-4 w-full text-[0.66rem] tabular-nums">
          <thead>
            <tr className="text-[0.55rem] tracking-[0.06em] text-slate-600 uppercase">
              <th className="pb-1.5 text-left font-medium">Concepto</th>
              {["1°", "2°", "3°", "4°"].map((b) => (
                <th key={b} className="w-[11%] pb-1.5 text-center font-medium">
                  {b}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label} className="border-t border-stone-200">
                <td className="py-1.5 pr-2">{row.label}</td>
                {row.values.map((v, i) => (
                  <td key={i} className="py-1.5 text-center font-medium">
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 border-l-2 border-primary/60 pl-3">
          <p className="text-[0.55rem] tracking-[0.08em] text-slate-600 uppercase">
            Observación del docente · 3° bimestre
          </p>
          <p className="mt-1 font-serif text-[0.74rem] leading-snug italic">
            Muy buena comprensión oral. Se sugiere reforzar la escritura en casa.
          </p>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-6 pt-4 text-center text-[0.55rem] text-slate-600">
          <p className="border-t border-slate-300 pt-1">Firma del docente</p>
          <p className="border-t border-slate-300 pt-1">Dirección</p>
        </div>
      </div>
    </figure>
  );
}
