import type { Course } from "@/domain/course";
import { DomainError } from "@/domain/errors";
import {
  publishBimester,
  publishClosing,
  updateBimester,
  updateClosing,
  type BimesterNumber,
  type BimesterPatch,
  type ClosingPatch,
  type ReportCard,
  type ReportPeriod,
} from "@/domain/report-card";
import type { Student } from "@/domain/student";
import { isPublishable, summarizeProgress, type PeriodProgress } from "./progress";
import {
  forbidden,
  loadOrCreateReportCard,
  loadStudentReportCard,
  requireCourse,
  type StudentReportCard,
  type UseCaseDeps,
} from "./shared";

export interface TeacherCourseSummary {
  course: Course;
  studentCount: number;
  progress: PeriodProgress[];
}

export interface GradeSheetRow {
  student: Student;
  card: ReportCard;
}

export interface GradeSheet {
  course: Course;
  rows: GradeSheetRow[];
}

export type GradeSheetChange<P extends ReportPeriod> = {
  studentId: string;
  patch: P extends "closing" ? ClosingPatch : BimesterPatch;
};

export interface PublishResult {
  /** Students whose period was published by this call. */
  published: string[];
  /** Students skipped because required grades are missing. */
  incomplete: string[];
}

export function createTeacherUseCases(deps: UseCaseDeps) {
  const { courses, students, reportCards } = deps.repositories;

  async function requireAssignedCourse(teacherId: string, courseId: string) {
    const course = await requireCourse(deps, courseId);
    if (!course.teacherIds.includes(teacherId)) throw forbidden();
    return course;
  }

  async function requireAssignedStudent(
    teacherId: string,
    studentId: string,
  ): Promise<StudentReportCard> {
    const data = await loadStudentReportCard(deps, studentId);
    if (!data.course.teacherIds.includes(teacherId)) throw forbidden();
    return data;
  }

  async function loadRows(course: Course): Promise<GradeSheetRow[]> {
    const list = await students.listByCourse(course.id);
    return Promise.all(
      list.map(async (student) => ({
        student,
        card: await loadOrCreateReportCard(deps, student),
      })),
    );
  }

  async function change(
    teacherId: string,
    studentId: string,
    apply: (data: StudentReportCard) => ReportCard,
  ): Promise<ReportCard> {
    const data = await requireAssignedStudent(teacherId, studentId);
    const updated = apply(data);
    await reportCards.save(updated);
    return updated;
  }

  function applyPatch(
    card: ReportCard,
    period: ReportPeriod,
    patch: BimesterPatch | ClosingPatch,
    course: Course,
  ): ReportCard {
    return period === "closing"
      ? updateClosing(card, patch as ClosingPatch, course.gradingType)
      : updateBimester(card, period, patch as BimesterPatch, course.gradingType);
  }

  return {
    async listCourses(teacherId: string): Promise<TeacherCourseSummary[]> {
      const assigned = await courses.listByTeacher(teacherId);
      return Promise.all(
        assigned.map(async (course) => {
          const rows = await loadRows(course);
          return {
            course,
            studentCount: rows.length,
            progress: summarizeProgress(rows.map((r) => r.card)),
          };
        }),
      );
    },

    async getGradeSheet(teacherId: string, courseId: string): Promise<GradeSheet> {
      const course = await requireAssignedCourse(teacherId, courseId);
      return { course, rows: await loadRows(course) };
    },

    /**
     * Saves the changed rows of one period as drafts (published periods stay
     * published). Every row is validated before anything is written.
     */
    async saveGradeSheet<P extends ReportPeriod>(
      teacherId: string,
      courseId: string,
      period: P,
      changes: GradeSheetChange<P>[],
    ): Promise<GradeSheet> {
      const course = await requireAssignedCourse(teacherId, courseId);
      const rows = await loadRows(course);
      const updated = changes.map(({ studentId, patch }) => {
        const row = rows.find((r) => r.student.id === studentId);
        if (!row) {
          throw new DomainError(
            "student-not-in-course",
            "El alumno no pertenece a este curso.",
          );
        }
        return applyPatch(row.card, period, patch, course);
      });
      for (const card of updated) await reportCards.save(card);
      return { course, rows: await loadRows(course) };
    },

    /** Publishes the period for every student with the required grades. */
    async publishGradeSheet(
      teacherId: string,
      courseId: string,
      period: ReportPeriod,
    ): Promise<PublishResult> {
      const course = await requireAssignedCourse(teacherId, courseId);
      const rows = await loadRows(course);
      const now = deps.clock.now();
      const result: PublishResult = { published: [], incomplete: [] };
      for (const { student, card } of rows) {
        const state = isPublishable(card, period);
        if (state === "already-published") continue;
        if (state === "incomplete") {
          result.incomplete.push(student.id);
          continue;
        }
        await reportCards.save(
          period === "closing"
            ? publishClosing(card, now)
            : publishBimester(card, period, now),
        );
        result.published.push(student.id);
      }
      return result;
    },

    getReportCard(teacherId: string, studentId: string) {
      return requireAssignedStudent(teacherId, studentId);
    },

    saveBimester(
      teacherId: string,
      studentId: string,
      bimester: BimesterNumber,
      patch: BimesterPatch,
    ) {
      return change(teacherId, studentId, ({ card, course }) =>
        updateBimester(card, bimester, patch, course.gradingType),
      );
    },

    saveClosing(teacherId: string, studentId: string, patch: ClosingPatch) {
      return change(teacherId, studentId, ({ card, course }) =>
        updateClosing(card, patch, course.gradingType),
      );
    },
  };
}

export type TeacherUseCases = ReturnType<typeof createTeacherUseCases>;
