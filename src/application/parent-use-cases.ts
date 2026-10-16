import type { Course } from "@/domain/course";
import {
  acknowledgeBimester,
  getBimesterStatus,
  toParentView,
  type BimesterNumber,
  type ParentReportCardView,
} from "@/domain/report-card";
import type { Student } from "@/domain/student";
import {
  forbidden,
  loadOrCreateReportCard,
  loadStudentReportCard,
  requireCourse,
  type UseCaseDeps,
} from "./shared";

export interface ChildSummary {
  student: Student;
  course: Course;
  publishedBimesters: number;
  /** Published bimesters not yet marked as read. */
  pendingAcknowledgements: number;
}

export interface ParentReportCard {
  student: Student;
  course: Course;
  teacherNames: string[];
  view: ParentReportCardView;
}

export function createParentUseCases(deps: UseCaseDeps) {
  const { students, users, reportCards } = deps.repositories;

  async function requireChild(parentId: string, studentId: string) {
    const data = await loadStudentReportCard(deps, studentId);
    if (!data.student.guardianIds.includes(parentId)) throw forbidden();
    return data;
  }

  async function present(
    data: Awaited<ReturnType<typeof requireChild>>,
  ): Promise<ParentReportCard> {
    const teachers = await users.listByRole("teacher");
    return {
      student: data.student,
      course: data.course,
      teacherNames: teachers
        .filter((t) => data.course.teacherIds.includes(t.id))
        .map((t) => `${t.firstName} ${t.lastName}`),
      view: toParentView(data.card),
    };
  }

  return {
    async listChildren(parentId: string): Promise<ChildSummary[]> {
      const children = await students.listByGuardian(parentId);
      return Promise.all(
        children.map(async (student) => {
          const course = await requireCourse(deps, student.courseId);
          const card = await loadOrCreateReportCard(deps, student);
          const statuses = card.bimesters.map(getBimesterStatus);
          return {
            student,
            course,
            publishedBimesters: statuses.filter(
              (s) => s === "published" || s === "read",
            ).length,
            pendingAcknowledgements: statuses.filter((s) => s === "published")
              .length,
          };
        }),
      );
    },

    async getReportCard(parentId: string, studentId: string) {
      return present(await requireChild(parentId, studentId));
    },

    async acknowledgeBimester(
      parentId: string,
      studentId: string,
      bimester: BimesterNumber,
    ): Promise<ParentReportCard> {
      const data = await requireChild(parentId, studentId);
      const card = acknowledgeBimester(data.card, bimester, deps.clock.now());
      await reportCards.save(card);
      return present({ ...data, card });
    },
  };
}

export type ParentUseCases = ReturnType<typeof createParentUseCases>;
