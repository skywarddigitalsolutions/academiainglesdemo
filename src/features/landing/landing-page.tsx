import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  CheckCheck,
  Clock,
  GraduationCap,
  HeartHandshake,
  Mail,
  MapPin,
  PenLine,
  Phone,
  ShieldCheck,
  Smartphone,
  Users,
} from "lucide-react";
import { Crest } from "@/components/brand/crest";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "#instituto", label: "El instituto" },
  { href: "#niveles", label: "Niveles" },
  { href: "#boletin", label: "Boletín en línea" },
  { href: "#contacto", label: "Contacto" },
];

const VALUES = [
  {
    icon: Users,
    title: "Grupos reducidos",
    text: "Clases con pocos alumnos para que cada estudiante participe y reciba atención personalizada.",
  },
  {
    icon: GraduationCap,
    title: "Profesores especializados",
    text: "Profesoras y profesores de inglés con formación específica y experiencia en todas las edades.",
  },
  {
    icon: HeartHandshake,
    title: "Cerca de las familias",
    text: "Comunicación clara y periódica sobre el progreso de cada alumno, ahora también en línea.",
  },
];

const LEVELS = [
  {
    name: "Kids",
    range: "1° a 4° grado",
    grading: "Evaluación conceptual",
    text: "Primer contacto con el idioma a través del juego, canciones y cuentos.",
  },
  {
    name: "Juniors",
    range: "5° a 7° grado",
    grading: "Calificación numérica",
    text: "Consolidación de la gramática, lectura y escritura, con proyectos en grupo.",
  },
  {
    name: "Teens",
    range: "1° a 5° año",
    grading: "Calificación numérica",
    text: "Inglés para comunicarse con fluidez: debates, presentaciones y escritura académica.",
  },
];

const STEPS = [
  {
    icon: PenLine,
    title: "El profesor carga el bimestre",
    text: "Nota de aplicación, conducta, inasistencias y una observación para cada alumno.",
  },
  {
    icon: CheckCheck,
    title: "Firma y cierra",
    text: "Al finalizar el bimestre, lo firma y queda listo para la revisión de Dirección.",
  },
  {
    icon: ShieldCheck,
    title: "Dirección aprueba",
    text: "Solo los bimestres aprobados por Dirección se publican para las familias.",
  },
  {
    icon: Smartphone,
    title: "La familia lo consulta",
    text: "Desde el celular o la computadora, con la opción de marcar “Leído” e imprimir.",
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
      <header className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 text-foreground">
            <Crest className="h-7" />
            <span className="text-sm font-semibold">Instituto Inmaculada Concepción</span>
          </Link>
          <nav aria-label="Secciones" className="hidden md:block">
            <ul className="flex gap-8 text-sm text-muted-foreground">
              {NAV.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="transition-colors hover:text-foreground">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <Button asChild>
            <Link href="/login">Ingresar</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <p className="mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
                <span className="size-1.5 rounded-full bg-primary" aria-hidden />
                Instituto de Inglés
              </p>
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                El progreso de cada alumno, claro y al día.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                En el Instituto Inmaculada Concepción acompañamos a nuestros alumnos a
                comunicarse en inglés con confianza. Las familias consultan el
                boletín de calificaciones en línea.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-11 px-6">
                  <Link href="/login">
                    Ingresar
                    <ArrowRight aria-hidden />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-11 px-6">
                  <a href="#boletin">Cómo funciona</a>
                </Button>
              </div>
            </div>
            <ReportCardPreview />
          </div>
        </section>

        {/* About */}
        <Section
          id="instituto"
          eyebrow="El instituto"
          title="Una comunidad que aprende inglés"
          text="Una propuesta cálida y exigente, pensada para cada etapa de la escolaridad."
        >
          <div className="grid gap-8 md:grid-cols-3">
            {VALUES.map(({ icon: Icon, title, text }) => (
              <div key={title}>
                <Icon className="mb-4 size-5 text-primary" aria-hidden />
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Levels */}
        <Section
          id="niveles"
          eyebrow="Niveles"
          title="Un recorrido para cada edad"
          text="Evaluación conceptual en los primeros grados y numérica a partir de 5° grado."
          muted
        >
          <div className="grid gap-4 md:grid-cols-3">
            {LEVELS.map((level) => (
              <div key={level.name} className="rounded-lg border bg-card p-6 shadow-xs">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-lg font-semibold">{level.name}</h3>
                  <span className="text-sm text-muted-foreground">{level.range}</span>
                </div>
                <p className="mt-1 text-xs font-medium text-primary">{level.grading}</p>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{level.text}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Online report card */}
        <Section
          id="boletin"
          eyebrow="Boletín en línea"
          title="Las calificaciones, al alcance de las familias"
          text="Un boletín digital, seguro y fácil de consultar, que reemplaza al boletín en papel."
        >
          <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="border-t pt-6">
                <div className="mb-4 flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="font-mono tabular-nums">0{i + 1}</span>
                  <Icon className="size-4 text-primary" aria-hidden />
                </div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </li>
            ))}
          </ol>
        </Section>

        {/* Contact */}
        <Section
          id="contacto"
          eyebrow="Contacto"
          title="Estamos para ayudarlos"
          text="Consultas sobre inscripciones, horarios o el acceso al boletín en línea."
          muted
        >
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CONTACT.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex items-start gap-3 rounded-lg border bg-card p-5 shadow-xs">
                <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                <div>
                  <dt className="text-sm font-medium">{title}</dt>
                  <dd className="text-sm text-muted-foreground">{text}</dd>
                </div>
              </div>
            ))}
          </dl>
        </Section>
      </main>
      <SiteFooter />
    </div>
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
    <section id={id} className={muted ? "scroll-mt-16 border-y bg-background" : "scroll-mt-16"}>
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mb-12 max-w-2xl">
          <p className="text-sm font-medium text-primary">{eyebrow}</p>
          <h2 className="mt-2 text-3xl font-semibold">{title}</h2>
          <p className="mt-3 text-muted-foreground">{text}</p>
        </div>
        {children}
      </div>
    </section>
  );
}

/** Static, decorative preview of the online report card. */
function ReportCardPreview() {
  const rows = [
    { label: "Nota de aplicación", values: ["8", "9", "8,5", "—"] },
    { label: "Conducta", values: ["Muy bueno", "Muy bueno", "Excelente", "—"] },
    { label: "Inasistencias", values: ["1", "0", "2", "—"] },
  ];
  return (
    <div aria-hidden className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between border-b pb-4">
        <div>
          <p className="text-sm font-semibold">Boletín de calificaciones</p>
          <p className="text-xs text-muted-foreground">Ana García · 5° Grado A</p>
        </div>
        <span className="inline-flex h-6 items-center gap-1.5 rounded-md border border-success-border bg-success-soft px-2 text-xs font-medium text-success">
          <span className="size-1.5 rounded-full bg-success" />
          Publicado
        </span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-muted-foreground uppercase">
            <th className="pb-2 text-left font-medium tracking-wide">Concepto</th>
            {["1°", "2°", "3°", "4°"].map((b) => (
              <th key={b} className="pb-2 text-center font-medium">
                {b}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-t">
              <td className="py-2.5 pr-2 text-xs text-slate-700 sm:text-sm">{row.label}</td>
              {row.values.map((v, i) => (
                <td key={i} className="px-1 py-2.5 text-center text-xs tabular-nums text-slate-700 sm:text-sm">
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
