import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import type { Course } from "@/domain/course";
import { cn } from "@/lib/utils";
import { LandingHeader } from "./landing-header";
import { Reveal } from "./reveal";
import { ParentPhonePreview } from "./parent-phone-preview";
import { ReportCardDocument } from "./report-card-document";

const FAMILY_POINTS = [
  {
    title: "El boletín de cada bimestre",
    text: "Notas y la observación del docente, en cuanto el instituto lo publica.",
  },
  {
    title: "Todos sus hijos en una cuenta",
    text: "Si tiene más de un hijo en el instituto, los encuentra juntos al ingresar.",
  },
  {
    title: "Aviso de lo nuevo",
    text: "Cada bimestre nuevo aparece señalado. Al confirmar la lectura, el instituto sabe que lo recibió.",
  },
  {
    title: "El cierre del año, para imprimir",
    text: "Examen cuatrimestral y situación final, en el formato institucional y en hoja A4.",
  },
];

const ACCESS_STEPS = [
  {
    title: "Solicite su usuario",
    text: "Secretaría entrega a cada familia un usuario y una contraseña personales.",
  },
  {
    title: "Ingrese desde cualquier dispositivo",
    text: "Desde el celular, la tablet o la computadora. No hace falta instalar nada.",
  },
  {
    title: "Elija a su hijo",
    text: "Consulte los bimestres publicados y confirme la lectura de cada uno.",
  },
];

/** Mirrors the courses of the demo seed. */
const COURSES: Pick<Course, "name" | "schedule">[] = [
  { name: "2° Grado A", schedule: "Lunes y miércoles · 14:00 a 15:30" },
  { name: "5° Grado A", schedule: "Martes y jueves · 15:00 a 16:30" },
  { name: "1° Año", schedule: "Lunes y viernes · 17:00 a 18:30" },
];

const CONTAINER = "mx-auto max-w-6xl px-4 sm:px-6 lg:px-8";

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <LandingHeader />
      <main className="flex-1">
        <Hero />
        <FeaturesSection />
        <AccessSection />
        <InstituteSection />
      </main>
      <SiteFooter />
    </div>
  );
}

/* ------------------------------------------------------------------------- */

function Hero() {
  return (
    <section className="navy-backdrop relative isolate overflow-hidden">
      <div className={cn(CONTAINER, "grid items-center gap-16 pt-32 pb-16 sm:pt-36 sm:pb-20 lg:grid-cols-12 lg:gap-8 lg:pt-44 lg:pb-28")}>
        <div className="lg:col-span-7 lg:pr-8">
          <Label inverted>Boletín en línea para familias</Label>
          <h1 className="mt-6 max-w-[14ch] font-serif text-[2.5rem] leading-[1.05] font-semibold tracking-[-0.03em] text-white sm:text-5xl lg:text-6xl">
            Acompañe el aprendizaje de sus hijos.
          </h1>
          <p className="mt-6 max-w-[32rem] text-lg leading-relaxed text-navy-muted">
            Consulte el boletín de cada bimestre apenas el instituto lo publica, desde el celular o
            la computadora.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5">
            <FamilyLoginButton onNavy />
            <ArrowLink href="#acceso" inverted>
              Cómo acceder
            </ArrowLink>
          </div>
        </div>
        <div className="lg:col-span-5">
          <ReportCardDocument />
        </div>
      </div>
    </section>
  );
}

/** Tint band: what families get, next to the real report card on a phone. */
function FeaturesSection() {
  return (
    <section id="que-va-a-ver" className="scroll-mt-20 bg-primary-tint">
      <div className={cn(CONTAINER, "grid items-center gap-14 py-24 lg:grid-cols-12 lg:gap-8 lg:py-28")}>
        <div className="lg:col-span-6">
          <Label>Qué va a ver</Label>
          <Heading className="mt-5">El boletín de sus hijos, en su celular.</Heading>
          <Reveal>
            <ul className="mt-10 grid gap-x-8 sm:grid-cols-2">
              {FAMILY_POINTS.map(({ title, text }) => (
                <li key={title} className="border-t border-navy/15 py-6">
                  <h3 className="font-serif text-xl font-semibold tracking-[-0.01em] text-navy">{title}</h3>
                  <p className="mt-2 leading-relaxed text-slate-600">{text}</p>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
        <Reveal className="lg:col-span-5 lg:col-start-8">
          <ParentPhonePreview />
        </Reveal>
      </div>
    </section>
  );
}

/** Navy band: three steps in a row, then the single call to action. */
function AccessSection() {
  return (
    <section id="acceso" className="navy-grain scroll-mt-20 text-white">
      <div className={cn(CONTAINER, "py-24 lg:py-28")}>
        <Label inverted>Cómo acceder</Label>
        <Heading className="mt-5 text-white">Ingresar es simple.</Heading>
        <Reveal>
          <ol className="mt-12 grid gap-x-8 md:grid-cols-3">
            {ACCESS_STEPS.map(({ title, text }, i) => (
              <li key={title} className="grid grid-cols-[2.5rem_1fr] gap-x-3 border-t border-white/20 py-6 md:block">
                <span className="font-serif text-3xl leading-none text-navy-muted tabular-nums">{i + 1}</span>
                <div className="md:mt-5">
                  <h3 className="text-lg font-semibold text-white">{title}</h3>
                  <p className="mt-1.5 max-w-[40ch] leading-relaxed text-navy-muted">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>
        <div className="mt-10">
          <FamilyLoginButton onNavy />
        </div>
      </div>
    </section>
  );
}

/** White band: editorial statement, then the courses and their schedules. */
function InstituteSection() {
  return (
    <section id="instituto" className="scroll-mt-20 bg-white">
      <div className={cn(CONTAINER, "py-24 lg:py-32")}>
        <Label>El instituto</Label>
        <Reveal>
          <p className="mt-8 max-w-4xl font-serif text-3xl leading-[1.2] font-medium tracking-[-0.02em] text-navy sm:text-[2.6rem]">
            Desde hace 130 años, el Instituto Inmaculada Concepción acompaña a sus alumnos en el
            aprendizaje del inglés, en diálogo permanente con las familias.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h3 className="font-serif text-xl font-semibold text-navy">Cursos y horarios</h3>
            <p className="mt-3 max-w-[30rem] leading-relaxed text-slate-600">
              Desde los primeros grados hasta el nivel secundario.
            </p>
          </div>
          <ul className="border-t border-navy/80 lg:col-span-7 lg:col-start-6">
            {COURSES.map((course) => (
              <li
                key={course.name}
                className="flex flex-col gap-1 border-b border-slate-200 py-5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
              >
                <span className="font-serif text-lg font-semibold text-navy">{course.name}</span>
                <span className="text-slate-600 tabular-nums">{course.schedule}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------- */

function FamilyLoginButton({ onNavy = false }: { onNavy?: boolean }) {
  return (
    <Button
      asChild
      size="lg"
      className={cn(
        "h-12 px-6 text-[0.95rem]",
        onNavy && "bg-white text-navy hover:bg-navy-muted focus-visible:ring-white/40",
      )}
    >
      <Link href="/login">
        Ingresar como familia
        <ArrowRight aria-hidden className="transition-transform duration-200 group-hover/button:translate-x-0.5" />
      </Link>
    </Button>
  );
}

function ArrowLink({
  href,
  inverted = false,
  children,
}: {
  href: string;
  inverted?: boolean;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className={cn(
        "group inline-flex min-h-11 items-center gap-2 text-[0.95rem] font-medium underline underline-offset-[6px] transition-colors",
        inverted
          ? "text-white decoration-white/35 hover:decoration-white"
          : "text-navy decoration-navy/25 hover:decoration-navy",
      )}
    >
      {children}
      <ArrowRight aria-hidden className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
    </a>
  );
}

/** Small-caps section label. */
function Label({ inverted = false, children }: { inverted?: boolean; children: ReactNode }) {
  return (
    <p
      className={cn(
        "text-xs font-semibold tracking-[0.16em] uppercase",
        inverted ? "text-navy-muted" : "text-primary-strong",
      )}
    >
      {children}
    </p>
  );
}

function Heading({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <h2
      className={cn(
        "font-serif text-4xl leading-[1.08] font-semibold tracking-[-0.025em] text-navy sm:text-5xl",
        className,
      )}
    >
      {children}
    </h2>
  );
}
