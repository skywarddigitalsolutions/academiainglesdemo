"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { Info } from "lucide-react";
import { toast } from "sonner";
import type { StudentReportCard } from "@/application/shared";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { gradingTypeLabel } from "@/domain/course";
import {
  getBimesterStatus,
  type BimesterNumber,
  type BimesterPatch,
  type ClosingPatch,
  type ReportCard,
} from "@/domain/report-card";
import { fullName } from "@/domain/student";
import { errorMessage } from "@/lib/error-message";
import { bimesterLabel } from "@/lib/format";
import { bimesterStatusDot } from "@/features/report-card/bimester-status-badge";
import { cn } from "@/lib/utils";
import { getServices } from "@/providers/services";
import { useAsyncData } from "@/providers/use-async-data";
import { useSession } from "@/providers/session-provider";
import { BimesterForm } from "./bimester-form";
import { ClosingForm } from "./closing-form";

export interface EditorActions {
  saveBimester(n: BimesterNumber, patch: BimesterPatch): Promise<boolean>;
  signBimester(n: BimesterNumber, patch: BimesterPatch): Promise<boolean>;
  reopenBimester(n: BimesterNumber): Promise<boolean>;
  saveClosing(patch: ClosingPatch): Promise<boolean>;
}

/** Container: loads the report card and wires the teacher use cases. */
export function ReportCardEditorContainer() {
  const { studentId } = useParams<{ studentId: string }>();
  const { state } = useSession();
  const teacherId = state.session?.userId ?? "";
  const { data, error, loading, setData } = useAsyncData(
    `teacher-card:${teacherId}:${studentId}`,
    (s) => s.teacher.getReportCard(teacherId, studentId),
  );

  if (loading) return <LoadingState />;
  if (error || !data) {
    return <ErrorState message={error ?? "Alumno no encontrado."} backHref="/teacher" />;
  }

  async function run(
    action: () => Promise<ReportCard>,
    success: string,
  ): Promise<boolean> {
    try {
      const card = await action();
      setData({ ...data!, card });
      toast.success(success);
      return true;
    } catch (err) {
      toast.error(errorMessage(err));
      return false;
    }
  }

  const teacher = () => getServices().teacher;
  const actions: EditorActions = {
    saveBimester: (n, patch) =>
      run(
        () => teacher().saveBimester(teacherId, studentId, n, patch),
        `${bimesterLabel(n)}: cambios guardados.`,
      ),
    signBimester: (n, patch) =>
      run(async () => {
        await teacher().saveBimester(teacherId, studentId, n, patch);
        return teacher().signBimester(teacherId, studentId, n);
      }, `${bimesterLabel(n)} firmado y enviado a Dirección.`),
    reopenBimester: (n) =>
      run(
        () => teacher().reopenBimester(teacherId, studentId, n),
        `${bimesterLabel(n)} reabierto para edición.`,
      ),
    saveClosing: (patch) =>
      run(
        () => teacher().saveClosing(teacherId, studentId, patch),
        "Cierre del ciclo lectivo guardado.",
      ),
  };

  return <ReportCardEditor data={data} actions={actions} />;
}

const SEGMENT = "h-8 gap-2 px-3 data-active:bg-white data-active:shadow-xs";

/** Presentational: segmented control per bimester plus the closing section. */
function ReportCardEditor({
  data,
  actions,
}: {
  data: StudentReportCard;
  actions: EditorActions;
}) {
  const { student, course, card } = data;
  const firstOpen =
    card.bimesters.find((b) => !b.signatures.teacher.signed)?.number ?? 4;
  const [tab, setTab] = useState(String(firstOpen));

  return (
    <>
      <PageHeader
        title={fullName(student)}
        breadcrumbs={[
          { label: "Mis cursos", href: "/teacher" },
          { label: course.name, href: `/teacher/courses/${course.id}` },
          { label: fullName(student) },
        ]}
        description={`${course.name} · Calificación ${gradingTypeLabel(course.gradingType).toLowerCase()} · Ciclo lectivo ${card.year}`}
      />

      <div className="mb-6 flex items-start gap-2 rounded-md border bg-card px-4 py-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <p>
          El sistema registra; las decisiones las toma el docente. Al firmar un
          bimestre, se envía a Dirección para su aprobación y luego se publica a
          la familia.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="gap-6">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList aria-label="Bimestres" className="h-10 w-max bg-slate-100 p-1">
            {card.bimesters.map((b) => (
              <TabsTrigger key={b.number} value={String(b.number)} className={SEGMENT}>
                <span
                  className={cn("size-1.5 rounded-full", bimesterStatusDot(getBimesterStatus(b)))}
                  aria-hidden
                />
                {bimesterLabel(b.number)}
              </TabsTrigger>
            ))}
            <TabsTrigger value="closing" className={SEGMENT}>
              Cierre
            </TabsTrigger>
          </TabsList>
        </div>

        {card.bimesters.map((b) => (
          <TabsContent key={b.number} value={String(b.number)}>
            <BimesterForm
              key={`${b.number}:${b.signatures.teacher.at ?? "open"}`}
              bimester={b}
              gradingType={course.gradingType}
              actions={actions}
            />
          </TabsContent>
        ))}
        <TabsContent value="closing">
          <ClosingForm
            key={card.closing.directorSignature.at ?? "open"}
            card={card}
            course={course}
            onSave={actions.saveClosing}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
