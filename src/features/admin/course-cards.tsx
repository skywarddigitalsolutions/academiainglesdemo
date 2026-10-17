import Link from "next/link";
import { ArrowRight, Users, type LucideIcon } from "lucide-react";
import type { CourseOverview } from "@/application/admin-use-cases";
import { EmptyState } from "@/components/feedback/empty-state";
import { SectionHeading } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { displayName } from "@/domain/user";
import { Schedule } from "@/features/grade-sheet/course-picker";
import { cn } from "@/lib/utils";

/**
 * One card per course, in the style of the Notas course picker. Each card
 * links to `${basePath}?course=<id>`.
 */
export function CourseCards({
  courses,
  basePath,
  countLabel,
  linkLabel,
  icon: Icon = Users,
}: {
  courses: CourseOverview[];
  basePath: string;
  /** Footer summary for a course, e.g. "3 alumnos". */
  countLabel: (overview: CourseOverview) => string;
  /** Button text, e.g. "Ver alumnos". */
  linkLabel: string;
  icon?: LucideIcon;
}) {
  if (courses.length === 0) {
    return <EmptyState icon={Icon} title="Todavía no hay cursos cargados." />;
  }
  return (
    <section>
      <SectionHeading title="Cursos" />
      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((overview) => {
          const { course, teachers } = overview;
          const href = `${basePath}?course=${course.id}`;
          return (
            <li key={course.id}>
              <article className="surface-card flex h-full flex-col overflow-hidden">
                <header className="px-5 pt-4 pb-3.5">
                  <h3 className="font-serif text-lg leading-tight font-semibold text-navy">
                    <Link
                      href={href}
                      className="rounded-sm hover:text-primary-strong focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
                    >
                      {course.name}
                    </Link>
                  </h3>
                  <p className="mt-1 text-[13px] leading-snug text-muted-foreground">
                    <Schedule value={course.schedule} />
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground/90">
                    {teachers.map(displayName).join(", ") || "Sin docente asignado"}
                  </p>
                </header>
                <div className="mt-auto flex items-center justify-between gap-3 border-t border-border bg-primary-tint/50 px-5 py-3">
                  <span className="flex items-center gap-1.5 text-sm text-foreground tabular-nums">
                    <Icon className="size-4 text-muted-foreground" aria-hidden />
                    {countLabel(overview)}
                  </span>
                  <Link
                    href={href}
                    aria-label={`${linkLabel} de ${course.name}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-10 sm:h-8")}
                  >
                    {linkLabel}
                    <ArrowRight aria-hidden />
                  </Link>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
