import Link from "next/link";
import {
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { SchoolMetrics } from "@/application/dashboard";
import { cn } from "@/lib/utils";
import { countLabel, formatPercent } from "./dashboard-model";

type KpiTone = "neutral" | "success" | "warning" | "danger";

const ICON_TONES: Record<KpiTone, string> = {
  neutral: "bg-primary-soft text-primary-strong",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};

interface Kpi {
  id: string;
  icon: LucideIcon;
  tone: KpiTone;
  label: string;
  value: string;
  helper: string;
  href?: string;
}

function kpis(school: SchoolMetrics): Kpi[] {
  const atRisk = school.atRiskHigh + school.atRiskMedium;
  return [
    {
      id: "average",
      icon: GraduationCap,
      tone: "neutral",
      label: "Promedio general",
      value: school.average === null ? "—" : String(school.average).replace(".", ","),
      helper: "Sobre 10, de todos los alumnos con notas",
    },
    {
      id: "passed",
      icon: CheckCircle2,
      tone: "success",
      label: "Aprobados",
      value: formatPercent(school.passRate),
      helper: `${school.passed} de ${countLabel(school.passed + school.failed, "alumno", "alumnos")} con notas`,
    },
    {
      id: "failed",
      icon: XCircle,
      tone: school.failed > 0 ? "danger" : "success",
      label: "Desaprobados",
      value: formatPercent(school.failRate),
      helper: `${countLabel(school.failed, "alumno", "alumnos")} con promedio menor a 6`,
    },
    {
      id: "risk",
      icon: AlertTriangle,
      tone: atRisk > 0 ? "warning" : "success",
      label: "En riesgo de rendir en marzo",
      value: String(atRisk),
      helper: `${school.atRiskHigh} alto · ${school.atRiskMedium} medio. Ver quiénes`,
      href: "#riesgo",
    },
    {
      id: "attendance",
      icon: CalendarCheck,
      tone: "neutral",
      label: "Asistencia estimada",
      value: formatPercent(school.attendanceRate),
      helper: `${school.absences} inasistencias en total`,
    },
    {
      id: "exams",
      icon: ClipboardList,
      tone: "neutral",
      label: "Exámenes tomados",
      value: String(school.examsTaken),
      helper: `${school.examsUpcoming} próximos`,
    },
  ];
}

function Tile({ kpi }: { kpi: Kpi }) {
  const Icon = kpi.icon;
  const body = (
    <>
      <span className={cn("flex size-10 items-center justify-center rounded-lg", ICON_TONES[kpi.tone])}>
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="mt-3 font-serif text-4xl leading-none font-semibold text-navy tabular-nums">
        {kpi.value}
      </span>
      <span className="mt-2 text-base font-semibold text-foreground">{kpi.label}</span>
      <span className="mt-1 text-sm leading-snug text-muted-foreground">{kpi.helper}</span>
    </>
  );
  const classes = "surface-card flex h-full flex-col items-start p-4";
  return kpi.href ? (
    <Link
      href={kpi.href}
      className={cn(
        classes,
        "transition-colors hover:bg-primary-tint focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none",
      )}
    >
      {body}
    </Link>
  ) : (
    <div className={classes}>{body}</div>
  );
}

/** Headline figures of the whole school, each with a plain-language helper line. */
export function KpiRow({ school }: { school: SchoolMetrics }) {
  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {kpis(school).map((kpi) => (
        <li key={kpi.id} className="min-w-0">
          <Tile kpi={kpi} />
        </li>
      ))}
    </ul>
  );
}
