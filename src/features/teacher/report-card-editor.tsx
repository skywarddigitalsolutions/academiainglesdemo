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

const STATUS_DOT: Record<string, string> = {
  empty: "bg-muted-foreground/40",
  draft: "bg-warning",
  "pending-approval": "bg-celeste",
  approved: "bg-success",
  acknowledged: "bg-success",
};

/** Presentational: tabs per bimester plus the closing section. */
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
        backHref={`/teacher/courses/${course.id}`}
        backLabel={course.name}
        description={`${course.name} · Calificación ${gradingTypeLabel(course.gradingType).toLowerCase()} · Ciclo lectivo ${card.year}`}
      />

      <div className="mb-5 flex items-start gap-2 rounded-xl border border-celeste/60 bg-celeste-light/60 px-4 py-3 text-sm text-navy">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p>
          El sistema registra; las decisiones las toma el docente. Al firmar un
          bimestre, se envía a Dirección para su aprobación y luego se publica a
          la familia.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="-mx-4 overflow-x-auto px-4 pb-1">
          <TabsList className="h-11 w-max">
            {card.bimesters.map((b) => (
              <TabsTrigger key={b.number} value={String(b.number)} className="h-9 gap-2 px-3">
                <span
                  className={cn("size-2 rounded-full", STATUS_DOT[getBimesterStatus(b)])}
                  aria-hidden
                />
                {bimesterLabel(b.number)}
              </TabsTrigger>
            ))}
            <TabsTrigger value="closing" className="h-9 px-3">
              Cierre
            </TabsTrigger>
          </TabsList>
        </div>

        {card.bimesters.map((b) => (
          <TabsContent key={b.number} value={String(b.number)} className="mt-4">
            <BimesterForm
              key={`${b.number}:${b.signatures.teacher.at ?? "open"}`}
              bimester={b}
              gradingType={course.gradingType}
              actions={actions}
            />
          </TabsContent>
        ))}
        <TabsContent value="closing" className="mt-4">
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
