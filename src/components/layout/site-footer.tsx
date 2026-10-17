import Link from "next/link";
import { LogoCrest } from "@/components/brand/logo";
import { INSTITUTION_CONTACT } from "@/lib/institution";

const CONTACT = [
  { title: "Dirección", text: INSTITUTION_CONTACT.address },
  { title: "Teléfono", text: INSTITUTION_CONTACT.phone, href: `tel:${INSTITUTION_CONTACT.phone.replace(/\D/g, "")}` },
  { title: "Correo", text: INSTITUTION_CONTACT.email, href: `mailto:${INSTITUTION_CONTACT.email}` },
  { title: "Horario de Secretaría", text: INSTITUTION_CONTACT.hours },
];

/** Navy footer: crest, Secretaría contact (the landing's #contacto anchor) and staff access. */
export function SiteFooter() {
  return (
    <footer id="contacto" className="navy-grain scroll-mt-20 text-sm text-navy-muted print:hidden">
      <div className="mx-auto max-w-6xl px-4 pt-16 pb-10 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3">
              <LogoCrest decorative className="h-12 shrink-0" />
              <p className="leading-tight">
                <span className="font-serif text-base font-semibold text-white">
                  Instituto Inmaculada Concepción
                </span>
                <span className="block text-xs">Instituto de Inglés · Buenos Aires</span>
              </p>
            </div>
            <p className="mt-5 max-w-[22rem] leading-relaxed">
              Consultas sobre inscripciones, horarios o el acceso de su familia al boletín.
            </p>
          </div>

          <div className="lg:col-span-8">
            <h2 className="text-xs font-semibold tracking-[0.16em] text-white uppercase">Contacto · Secretaría</h2>
            <dl className="mt-5 grid gap-x-8 sm:grid-cols-2">
              {CONTACT.map(({ title, text, href }) => (
                <div key={title} className="border-t border-white/15 py-4">
                  <dt className="text-xs tracking-[0.06em]">{title}</dt>
                  <dd className="mt-1 text-[0.95rem] text-white tabular-nums">
                    {href ? (
                      <a href={href} className="underline-offset-4 hover:underline">
                        {text}
                      </a>
                    ) : (
                      text
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/15 pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/login"
            className="-my-2 self-start py-2 underline-offset-4 transition-colors hover:text-white hover:underline"
          >
            Acceso docentes y Dirección
          </Link>
          <p>Versión de demostración. Los datos se guardan solo en este navegador.</p>
        </div>
      </div>
    </footer>
  );
}
