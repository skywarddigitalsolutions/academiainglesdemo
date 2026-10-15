import Link from "next/link";
import {
  BookOpen,
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
import { BrandLogo } from "@/components/brand/brand-logo";
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
    text: "Clases con pocos alumnos para que cada estudiante participe, practique y reciba atención personalizada.",
  },
  {
    icon: GraduationCap,
    title: "Docentes especializados",
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
    text: "Primer contacto con el idioma a través del juego, canciones y cuentos. Vocabulario, comprensión oral y primeras producciones.",
  },
  {
    name: "Juniors",
    range: "5° a 7° grado",
    grading: "Calificación numérica",
    text: "Consolidación de la gramática, lectura y escritura. Proyectos en grupo y desarrollo de la expresión oral.",
  },
  {
    name: "Teens",
    range: "1° a 5° año",
    grading: "Calificación numérica",
    text: "Inglés para comunicarse con fluidez: debates, presentaciones, comprensión de textos auténticos y escritura académica.",
  },
];

const STEPS = [
  {
    icon: PenLine,
    title: "El docente carga el bimestre",
    text: "Nota de aplicación, conducta, inasistencias y una observación personalizada para cada alumno.",
  },
  {
    icon: CheckCheck,
    title: "Firma y cierra",
    text: "Al finalizar el bimestre, el docente lo firma y queda listo para la revisión de Dirección.",
  },
  {
    icon: ShieldCheck,
    title: "Dirección aprueba",
    text: "Solo los bimestres aprobados por Dirección se publican para las familias.",
  },
  {
    icon: Smartphone,
    title: "La familia lo consulta",
    text: "Desde el celular o la computadora, con la opción de marcar “Leído / Notificado” e imprimir.",
  },
];

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-30 border-b border-gold/60 bg-navy/95 text-white backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="flex items-center gap-3">
            <Crest className="h-10" />
            <span className="hidden font-heading text-lg font-semibold sm:inline">
              Instituto Inmaculada Concepción
            </span>
          </Link>
          <nav aria-label="Secciones" className="hidden md:block">
            <ul className="flex gap-6 text-sm text-white/85">
              {NAV.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="hover:text-celeste">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <Button asChild size="lg" className="h-10 px-5 font-semibold">
            <Link href="/login">Ingresar</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-navy text-white">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(110,193,228,0.28),transparent_55%)]"
          />
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:py-24 md:grid-cols-[1.3fr_1fr]">
            <div>
              <p className="mb-4 text-xs font-semibold tracking-[0.3em] text-celeste uppercase">
                Instituto de Inglés
              </p>
              <h1 className="font-heading text-4xl leading-tight font-semibold text-white sm:text-5xl lg:text-6xl">
                Instituto Inmaculada Concepción
              </h1>
              <div className="my-6 h-0.5 w-24 bg-gold" aria-hidden />
              <p className="max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
                Acompañamos a nuestros alumnos a comunicarse en inglés con
                confianza, desde los primeros grados hasta el secundario. Ahora,
                las familias pueden consultar el boletín de calificaciones en línea.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 px-6 text-base font-semibold">
                  <Link href="/login">Ingresar al boletín en línea</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-12 border-white/40 bg-transparent px-6 text-base text-white hover:bg-white/10 hover:text-white"
                >
                  <a href="#instituto">Conocer el instituto</a>
                </Button>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="relative flex size-64 items-center justify-center rounded-full border border-gold/50 bg-white/5 sm:size-80">
                <div className="absolute inset-3 rounded-full border border-gold/25" aria-hidden />
                <BrandLogo className="h-40 sm:h-52" />
              </div>
            </div>
          </div>
        </section>

        {/* About */}
        <section id="instituto" className="scroll-mt-20 bg-background py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <SectionTitle
              eyebrow="El instituto"
              title="Una comunidad que aprende inglés"
              text="Somos un instituto de inglés con una propuesta cálida y exigente, pensada para cada etapa de la escolaridad."
            />
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {VALUES.map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl border bg-card p-6 shadow-sm">
                  <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-celeste-light">
                    <Icon className="size-5 text-navy" aria-hidden />
                  </div>
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Levels */}
        <section id="niveles" className="scroll-mt-20 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <SectionTitle
              eyebrow="Niveles"
              title="Un recorrido para cada edad"
              text="Cada curso define su forma de evaluación: conceptual en los primeros grados y numérica a partir de 5° grado."
            />
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {LEVELS.map((level) => (
                <div
                  key={level.name}
                  className="relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm"
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-celeste" aria-hidden />
                  <BookOpen className="mb-3 size-6 text-celeste-strong" aria-hidden />
                  <h3 className="text-2xl font-semibold">{level.name}</h3>
                  <p className="text-sm font-medium text-navy">{level.range}</p>
                  <span className="mt-2 inline-block rounded-full bg-celeste-light px-2.5 py-0.5 text-xs font-medium text-navy">
                    {level.grading}
                  </span>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{level.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Online report card */}
        <section id="boletin" className="scroll-mt-20 bg-celeste-light/60 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <SectionTitle
              eyebrow="Boletín en línea"
              title="Las calificaciones, al alcance de las familias"
              text="Reemplazamos el boletín en papel por un boletín digital, seguro y fácil de consultar."
            />
            <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map(({ icon: Icon, title, text }, i) => (
                <li key={title} className="rounded-2xl border bg-card p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-full bg-navy font-heading text-sm text-white">
                      {i + 1}
                    </span>
                    <Icon className="size-5 text-celeste-strong" aria-hidden />
                  </div>
                  <h3 className="text-base font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </li>
              ))}
            </ol>
            <div className="mt-10 flex justify-center">
              <Button asChild size="lg" className="h-12 px-8 text-base font-semibold">
                <Link href="/login">Ingresar</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contacto" className="scroll-mt-20 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <SectionTitle
              eyebrow="Contacto"
              title="Estamos para ayudarlos"
              text="Consultas sobre inscripciones, horarios o el acceso al boletín en línea."
            />
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <ContactItem icon={MapPin} title="Dirección" text="Av. San Martín 1234, Buenos Aires" />
              <ContactItem icon={Phone} title="Teléfono" text="(011) 4000-0000" />
              <ContactItem icon={Mail} title="Correo" text="secretaria@inmaculada.edu.ar" />
              <ContactItem icon={Clock} title="Secretaría" text="Lunes a viernes de 13 a 19 h" />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-semibold tracking-[0.25em] text-celeste-strong uppercase">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">{title}</h2>
      <div className="mx-auto my-4 h-0.5 w-16 bg-gold" aria-hidden />
      <p className="text-muted-foreground">{text}</p>
    </div>
  );
}

function ContactItem({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof MapPin;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border bg-card p-5">
      <Icon className="mt-0.5 size-5 shrink-0 text-celeste-strong" aria-hidden />
      <div>
        <p className="text-sm font-semibold text-navy">{title}</p>
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
