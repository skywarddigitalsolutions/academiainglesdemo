import type { Course } from "@/domain/course";
import {
  getBimesterStatus,
  reopenBimester,
  signBimesterAsTeacher,
  updateBimester,
  updateClosing,
  type BimesterNumber,
  type BimesterPatch,
  type BimesterStatus,
  type ClosingPatch,
  type ReportCard,
} from "@/domain/report-card";
import type { Student } from "@/domain/student";
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
  /** Bimesters with grades loaded but not signed yet. */
  drafts: number;
  /** Bimesters signed by the teacher, waiting for the director. */
  awaitingApproval: number;
}

export interface RosterEntry {
  student: Student;
  statuses: BimesterStatus[];
  card: ReportCard;
}

export interface CourseRoster {
  course: Course;
  students: RosterEntry[];
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

  async function roster(course: Course): Promise<RosterEntry[]> {
    const list = await students.listByCourse(course.id);
    return Promise.all(
      list.map(async (student) => {
        const card = await loadOrCreateReportCard(deps, student);
        return {
          student,
          card,
          statuses: card.bimesters.map(getBimesterStatus),
        };
      }),
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

  return {
    async listCourses(teacherId: string): Promise<TeacherCourseSummary[]> {
      const assigned = await courses.listByTeacher(teacherId);
      return Promise.all(
        assigned.map(async (course) => {
          const entries = await roster(course);
          const all = entries.flatMap((e) => e.statuses);
          return {
            course,
            studentCount: entries.length,
            drafts: all.filter((s) => s === "draft").length,
            awaitingApproval: all.filter((s) => s === "pending-approval").length,
          };
        }),
      );
    },

    async getCourseRoster(teacherId: string, courseId: string): Promise<CourseRoster> {
      const course = await requireAssignedCourse(teacherId, courseId);
      return { course, students: await roster(course) };
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

    signBimester(teacherId: string, studentId: string, bimester: BimesterNumber) {
      return change(teacherId, studentId, ({ card }) =>
        signBimesterAsTeacher(card, bimester, deps.clock.now()),
      );
    },

    reopenBimester(teacherId: string, studentId: string, bimester: BimesterNumber) {
      return change(teacherId, studentId, ({ card }) =>
        reopenBimester(card, bimester),
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
