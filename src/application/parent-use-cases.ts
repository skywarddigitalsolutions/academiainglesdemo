import type { Course } from "@/domain/course";
import { sortPastFirst, splitAgenda, upcomingWithin } from "@/domain/exam";
import {
  acknowledgeBimester,
  getBimesterStatus,
  toParentView,
  type BimesterNumber,
  type ParentReportCardView,
} from "@/domain/report-card";
import type { Student } from "@/domain/student";
import { today, toParentExamView, type ParentExamGrade, type ParentExamView } from "./exams";
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
  /** What the family may see of the report card (published data only). */
  view: ParentReportCardView;
}

export interface ParentReportCard {
  student: Student;
  course: Course;
  teacherNames: string[];
  view: ParentReportCardView;
}

export interface ParentUpcomingExam {
  student: Student;
  course: Course;
  exam: ParentExamView;
}

export interface ChildExams {
  /** From today on, ascending (not yet published). */
  upcoming: ParentExamView[];
  /** Published exams, newest first, with the child's grade (null when not graded). */
  graded: ParentExamGrade[];
}

/** Days ahead shown in "Próximos exámenes". */
export const PARENT_UPCOMING_EXAM_DAYS = 21;

export function createParentUseCases(deps: UseCaseDeps) {
  const { students, users, reportCards, exams } = deps.repositories;

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
            view: toParentView(card),
          };
        }),
      );
    },

    /** Dates are always shown; grades never come with this list. */
    async listUpcomingExams(parentId: string): Promise<ParentUpcomingExam[]> {
      const children = await students.listByGuardian(parentId);
      const day = today(deps);
      const perChild = await Promise.all(
        children.map(async (student) => {
          const course = await requireCourse(deps, student.courseId);
          const list = await exams.listByCourse(course.id, deps.year);
          return upcomingWithin(list, day, PARENT_UPCOMING_EXAM_DAYS).map((exam) => ({
            student,
            course,
            exam: toParentExamView(exam),
          }));
        }),
      );
      return perChild
        .flat()
        .sort(
          (a, b) => a.exam.date.localeCompare(b.exam.date) || a.exam.id.localeCompare(b.exam.id),
        );
    },

    /** Upcoming exams of a child and the grades already published. */
    async getChildExams(parentId: string, studentId: string): Promise<ChildExams> {
      const { student } = await requireChild(parentId, studentId);
      const list = await exams.listByCourse(student.courseId, deps.year);
      const { upcoming } = splitAgenda(list, today(deps));
      return {
        upcoming: upcoming.filter((e) => e.publishedAt === null).map(toParentExamView),
        graded: sortPastFirst(list.filter((e) => e.publishedAt !== null)).map((exam) => ({
          exam: toParentExamView(exam),
          grade: exam.grades[student.id] ?? null,
        })),
      };
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
