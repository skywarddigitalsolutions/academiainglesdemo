import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BellRing,
  CheckCheck,
  Clock,
  FileSpreadsheet,
  Layers,
  Mail,
  MapPin,
  Phone,
  Printer,
  Send,
  ShieldCheck,
} from "lucide-react";
import { CrestTile, LogoCrest, LogoLockup } from "@/components/brand/logo";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "#boletin", label: "Boletín digital" },
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#contacto", label: "Contacto" },
];

const FEATURES = [
  {
    icon: FileSpreadsheet,
    title: "Una planilla por curso",
    text: "El docente carga aplicación, conducta, inasistencias y observaciones de todo el curso en una sola pantalla.",
  },
  {
    icon: Send,
    title: "Publicación inmediata",
    text: "Las notas se guardan como borrador y se publican a las familias cuando el docente lo decide.",
  },
  {
    icon: CheckCheck,
    title: "Confirmación de lectura",
    text: "Cada familia marca el bimestre como leído y queda registrada la fecha y la hora.",
  },
  {
    icon: Layers,
    title: "Conceptual o numérica",
    text: "Cada curso define su escala: de Excelente a Insuficiente, o notas de 1 a 10.",
  },
  {
    icon: Printer,
    title: "Listo para imprimir",
    text: "El boletín conserva el formato institucional y se imprime en A4 cuando haga falta.",
  },
  {
    icon: ShieldCheck,
    title: "Acceso por perfil",
    text: "Dirección, docentes y familias ven solo la información que les corresponde.",
  },
];

const STEPS = [
  {
    title: "El docente carga las notas",
    text: "Elige el curso y el bimestre, y completa la planilla con el teclado, celda por celda.",
  },
  {
    title: "Publica a las familias",
    text: "Con un clic, los boletines completos quedan disponibles. Los incompletos siguen en borrador.",
  },
  {
    title: "La familia lo lee",
    text: "Lo consulta desde el celular o la computadora y confirma la lectura. Dirección ve el avance.",
  },
];

const CONTACT = [
  { icon: MapPin, title: "Dirección", text: "Av. San Martín 1234, Buenos Aires" },
  { icon: Phone, title: "Teléfono", text: "(011) 4000-0000" },
  { icon: Mail, title: "Correo", text: "secretaria@inmaculada.edu.ar" },
  { icon: Clock, title: "Secretaría", text: "Lunes a viernes de 13 a 19 h" },
];

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Hero />
      <main className="flex-1">
        <Section
          id="boletin"
          eyebrow="Boletín digital"
          title="Todo lo que hacía el boletín en papel, sin papeles."
          text="Pensado para el trabajo real del instituto: rápido para los docentes, claro para las familias y ordenado para Dirección."
        >
          <ul className="grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="bg-white p-7">
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary-soft text-primary ring-1 ring-blue-100 ring-inset">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-5 font-semibold tracking-[-0.01em]">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section
          id="como-funciona"
          eyebrow="Cómo funciona"
          title="Tres pasos, sin intermediarios."
          text="El docente es responsable de sus notas. Dirección acompaña con una vista general del avance."
          muted
        >
          <ol className="relative grid gap-10 md:grid-cols-3 md:gap-8">
            <span
              aria-hidden
              className="absolute top-5 right-[16%] left-[16%] hidden h-px bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 md:block"
            />
            {STEPS.map(({ title, text }, i) => (
              <li key={title} className="relative flex flex-col items-start md:items-center md:text-center">
                <span className="relative z-10 flex size-10 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-semibold text-primary tabular-nums shadow-card">
                  {i + 1}
                </span>
                <h3 className="mt-5 font-semibold tracking-[-0.01em]">{title}</h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">{text}</p>
              </li>
            ))}
          </ol>
        </Section>

        <section id="contacto" className="scroll-mt-16">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-24 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:px-8">
            <div>
              <p className="text-sm font-medium text-primary">Contacto</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
                Estamos para ayudarlos.
              </h2>
              <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">
                Consultas sobre inscripciones, horarios o el acceso al boletín digital.
                Secretaría responde dentro del día hábil.
              </p>
              <Button asChild size="lg" className="mt-8">
                <Link href="/login">
                  Ingresar al boletín
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>
            <dl className="grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-2">
              {CONTACT.map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex items-start gap-4 bg-white p-6">
                  <Icon className="mt-0.5 size-5 shrink-0 text-slate-400" aria-hidden />
                  <div>
                    <dt className="text-sm font-medium">{title}</dt>
                    <dd className="mt-1 text-sm text-muted-foreground">{text}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

/* ------------------------------------------------------------------------- */

function Hero() {
  return (
    <div className="relative isolate overflow-hidden bg-ink text-white">
      {/* Background: soft glow + faint grid that fades out. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(60%_55%_at_70%_0%,rgb(30_64_175/0.38),transparent_70%),radial-gradient(40%_40%_at_10%_20%,rgb(30_64_175/0.16),transparent_70%)]"
      />
      <div
        aria-hidden
        className="bg-grid-dark absolute inset-0 -z-10 [mask-image:radial-gradient(70%_60%_at_50%_30%,black,transparent)]"
      />

      <header className="relative z-20">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <LogoCrest className="h-9" />
            <span className="hidden leading-tight sm:block">
              <span className="block text-sm font-semibold tracking-[-0.01em]">
                Instituto Inmaculada Concepción
              </span>
              <span className="block text-xs text-slate-400">Instituto de Inglés</span>
            </span>
          </Link>
          <nav aria-label="Secciones" className="hidden md:block">
            <ul className="flex gap-8 text-sm text-slate-400">
              {NAV.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="transition-colors duration-150 hover:text-white">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <Button
            asChild
            className="bg-white text-ink shadow-none hover:bg-slate-200 focus-visible:ring-white/30"
          >
            <Link href="/login">Ingresar</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-14 px-4 pt-14 pb-24 sm:px-6 sm:pt-20 lg:grid-cols-[1fr_1.05fr] lg:gap-12 lg:px-8 lg:pt-24 lg:pb-32">
        <div>
          <LogoLockup priority className="h-20 sm:h-24" />
          <h1 className="mt-10 text-[2.5rem] leading-[1.05] font-semibold tracking-[-0.035em] text-white sm:text-6xl">
            El boletín de calificaciones, ahora en línea.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-400">
            Los docentes cargan las notas de cada curso en una planilla, las publican
            cuando están listas y las familias las consultan desde cualquier dispositivo.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-11 bg-white px-5 text-ink shadow-none hover:bg-slate-200 focus-visible:ring-white/30"
            >
              <Link href="/login">
                Ingresar al boletín
                <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="h-11 px-5 text-slate-300 ring-1 ring-white/15 ring-inset hover:bg-white/5 hover:text-white"
            >
              <a href="#como-funciona">Cómo funciona</a>
            </Button>
          </div>
        </div>
        <ProductMockup />
      </section>

      {/* Hairline tied to the logo gold. */}
      <div
        aria-hidden
        className="h-px bg-gradient-to-r from-transparent via-gold/45 to-transparent"
      />
    </div>
  );
}

/** Static, decorative preview of the report card as families see it. */
function ProductMockup() {
  const rows = [
    { label: "Aplicación", values: ["8", "9", "8,5", null] },
    { label: "Conducta", values: ["Muy bueno", "Excelente", "Muy bueno", null] },
    { label: "Inasistencias", values: ["1", "0", "2", null] },
  ];
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-xl lg:max-w-none">
      <div className="absolute -inset-x-6 -inset-y-8 -z-10 rounded-[2rem] bg-[radial-gradient(closest-side,rgb(30_64_175/0.35),transparent)] blur-2xl" />
      <div className="overflow-hidden rounded-xl bg-white text-foreground shadow-float">
        {/* Window chrome */}
        <div className="flex h-9 items-center gap-1.5 border-b border-slate-200 bg-slate-50 px-3">
          <span className="size-2.5 rounded-full bg-slate-300" />
          <span className="size-2.5 rounded-full bg-slate-300" />
          <span className="size-2.5 rounded-full bg-slate-300" />
          <span className="ml-3 h-5 flex-1 rounded-md bg-white px-2 text-[10px] leading-5 text-slate-400 ring-1 ring-slate-200">
            boletin.inmaculada.edu.ar/familia
          </span>
        </div>
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <CrestTile className="size-9" />
              <div className="leading-tight">
                <p className="text-sm font-semibold">Boletín de calificaciones</p>
                <p className="text-xs text-muted-foreground">Tomás Romero · 5° Grado A · 2026</p>
              </div>
            </div>
            <Pill tone="info">Nuevo</Pill>
          </div>
          <table className="mt-4 w-full text-[13px]">
            <thead>
              <tr className="text-[10.5px] tracking-[0.04em] text-slate-400 uppercase">
                <th className="pb-2 text-left font-medium">Concepto</th>
                {["1° Bim", "2° Bim", "3° Bim", "4° Bim"].map((b) => (
                  <th key={b} className="pb-2 text-center font-medium">
                    {b}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-t border-slate-100">
                  <td className="py-2.5 pr-2 text-[11px] text-slate-600 sm:text-[13px]">{row.label}</td>
                  {row.values.map((v, i) => (
                    <td key={i} className="px-1 py-2.5 text-center text-[11px] font-medium whitespace-nowrap tabular-nums sm:text-[13px]">
                      {v ?? <span className="text-xs font-normal text-slate-300">Pendiente</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200/70 ring-inset">
            <p className="text-[11px] font-medium tracking-[0.04em] text-slate-400 uppercase">
              Observación · 3° Bimestre
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-slate-600">
              Participa activamente en clase. Se sugiere reforzar la escritura en casa.
            </p>
          </div>
        </div>
      </div>

      {/* Floating confirmation */}
      <div className="absolute -bottom-6 -left-2 flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-foreground shadow-raised ring-1 ring-slate-200 sm:-left-8">
        <span className="flex size-8 items-center justify-center rounded-full bg-success-soft text-success ring-1 ring-success-border">
          <BellRing className="size-4" />
        </span>
        <div className="leading-tight">
          <p className="text-[13px] font-semibold">3° Bimestre publicado</p>
          <p className="text-xs text-muted-foreground">Leído por la familia · 12/10 20:45 h</p>
        </div>
      </div>
    </div>
  );
}

function Pill({ tone, children }: { tone: "info" | "success"; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center gap-1.5 rounded-full border px-2 text-[11.5px] font-medium",
        tone === "info"
          ? "border-blue-200/80 bg-primary-soft text-primary"
          : "border-success-border bg-success-soft text-success",
      )}
    >
      <span className={cn("size-1.5 rounded-full", tone === "info" ? "bg-primary" : "bg-success")} />
      {children}
    </span>
  );
}

function Section({
  id,
  eyebrow,
  title,
  text,
  muted = false,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  text: string;
  muted?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn("scroll-mt-16", muted && "border-y border-slate-200/80 bg-slate-50")}
    >
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mb-14 max-w-2xl">
          <p className="text-sm font-medium text-primary">{eyebrow}</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">{title}</h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{text}</p>
        </div>
        {children}
      </div>
    </section>
  );
}
