import type { Course } from "@/domain/course";
import { unreadNoteCount, type CourseNote } from "@/domain/course-note";
import { DomainError } from "@/domain/errors";
import {
  createExam,
  updateExamDetails,
  type Exam,
  type ExamDetails,
  type ExamGradeChanges,
} from "@/domain/exam";
import {
  isLockedForTeacher,
  submitReview,
  withdrawReview,
  type PeriodReview,
} from "@/domain/period-review";
import {
  updateBimester,
  updateClosing,
  type BimesterNumber,
  type BimesterPatch,
  type ClosingPatch,
  type ReportCard,
  type ReportPeriod,
} from "@/domain/report-card";
import {
  loadExamAgenda,
  loadExamDetail,
  publishExamGrades,
  requireExam,
  saveExamGradeChanges,
  type ExamAgenda,
  type ExamDetail,
} from "./exams";
import {
  findReview,
  isPeriodPublished,
  loadGradeSheet,
  loadGradeSheetRows,
  saveGradeSheetChanges,
  type GradeSheet,
  type GradeSheetChange,
} from "./grade-sheet";
import { isPublishable, summarizeProgress, type PeriodProgress } from "./progress";
import {
  forbidden,
  loadStudentReportCard,
  requireCourse,
  type StudentReportCard,
  type UseCaseDeps,
} from "./shared";

export interface TeacherCourseSummary {
  course: Course;
  studentCount: number;
  progress: PeriodProgress[];
  reviews: PeriodReview[];
  /** Notes from Dirección written since the teacher last opened the course. */
  unreadNotes: number;
}

export interface ExamInput extends ExamDetails {
  courseId: string;
}

export interface SubmitResult {
  /** Students sent to Dirección in this batch. */
  submitted: string[];
  /** Students left out because required grades are missing. */
  incomplete: string[];
}

function lockedError(): DomainError {
  return new DomainError(
    "period-pending-approval",
    "Este período está esperando la aprobación de Dirección. Retire el envío para editarlo.",
  );
}

function publishedError(): DomainError {
  return new DomainError(
    "period-published",
    "Las notas publicadas solo las puede corregir Dirección.",
  );
}

export function createTeacherUseCases(deps: UseCaseDeps) {
  const { courses, reportCards, reviews, notes, exams } = deps.repositories;

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

  async function requireAssignedExam(teacherId: string, examId: string) {
    const exam = await requireExam(deps, examId);
    const course = await requireAssignedCourse(teacherId, exam.courseId);
    return { exam, course };
  }

  /** Single-student edits follow the same rules as the sheet. */
  async function change(
    teacherId: string,
    studentId: string,
    period: ReportPeriod,
    apply: (data: StudentReportCard) => ReportCard,
  ): Promise<ReportCard> {
    const data = await requireAssignedStudent(teacherId, studentId);
    if (isLockedForTeacher(await findReview(deps, data.course.id, period))) throw lockedError();
    if (isPeriodPublished(data.card, period)) throw publishedError();
    const updated = apply(data);
    await reportCards.save(updated);
    return updated;
  }

  return {
    async listCourses(teacherId: string): Promise<TeacherCourseSummary[]> {
      const assigned = await courses.listByTeacher(teacherId);
      return Promise.all(
        assigned.map(async (course) => {
          const [rows, courseReviews, courseNotes, seenAt] = await Promise.all([
            loadGradeSheetRows(deps, course),
            reviews.listByCourse(course.id, deps.year),
            notes.listByCourse(course.id, deps.year),
            notes.getSeenAt(teacherId, course.id),
          ]);
          return {
            course,
            studentCount: rows.length,
            progress: summarizeProgress(rows.map((r) => r.card)),
            reviews: courseReviews,
            unreadNotes: unreadNoteCount(courseNotes, seenAt),
          };
        }),
      );
    },

    async getGradeSheet(teacherId: string, courseId: string): Promise<GradeSheet> {
      const course = await requireAssignedCourse(teacherId, courseId);
      return loadGradeSheet(deps, course);
    },

    /**
     * Saves the changed rows of one period as drafts. The period cannot change
     * while Dirección reviews it, and published students are corrected by
     * Dirección only.
     */
    async saveGradeSheet<P extends ReportPeriod>(
      teacherId: string,
      courseId: string,
      period: P,
      changes: GradeSheetChange<P>[],
    ): Promise<GradeSheet> {
      const course = await requireAssignedCourse(teacherId, courseId);
      if (isLockedForTeacher(await findReview(deps, courseId, period))) throw lockedError();
      return saveGradeSheetChanges(deps, course, period, changes, ({ card }) => {
        if (isPeriodPublished(card, period)) throw publishedError();
      });
    },

    /** Sends every complete, unpublished student of the period to Dirección. */
    async submitForApproval(
      teacherId: string,
      courseId: string,
      period: ReportPeriod,
    ): Promise<SubmitResult> {
      const course = await requireAssignedCourse(teacherId, courseId);
      const rows = await loadGradeSheetRows(deps, course);
      const result: SubmitResult = { submitted: [], incomplete: [] };
      for (const { student, card } of rows) {
        const state = isPublishable(card, period);
        if (state === "ready") result.submitted.push(student.id);
        else if (state === "incomplete") result.incomplete.push(student.id);
      }
      const review = submitReview(await findReview(deps, courseId, period), {
        courseId,
        year: deps.year,
        period,
        studentIds: result.submitted,
        teacherId,
        now: deps.clock.now(),
      });
      await reviews.save(review);
      return result;
    },

    /** Takes back a batch that Dirección has not decided yet. */
    async withdrawSubmission(
      teacherId: string,
      courseId: string,
      period: ReportPeriod,
    ): Promise<GradeSheet> {
      const course = await requireAssignedCourse(teacherId, courseId);
      const review = await findReview(deps, courseId, period);
      if (!review) throw new DomainError("review-not-pending", "Este período no fue enviado.");
      withdrawReview(review);
      await reviews.delete(review.id);
      return loadGradeSheet(deps, course);
    },

    /** Notes from Dirección (newest first); opening them marks them as read. */
    async listCourseNotes(teacherId: string, courseId: string): Promise<CourseNote[]> {
      await requireAssignedCourse(teacherId, courseId);
      const list = await notes.listByCourse(courseId, deps.year);
      await notes.markSeen(teacherId, courseId, deps.clock.now().toISOString());
      return list;
    },

    getReportCard(teacherId: string, studentId: string) {
      return requireAssignedStudent(teacherId, studentId);
    },

    /** Exams of every assigned course, with their status as of today. */
    async listExams(teacherId: string): Promise<ExamAgenda> {
      return loadExamAgenda(deps, await courses.listByTeacher(teacherId));
    },

    /** Exams of one course (e.g. the exam average shown as a reference). */
    async listCourseExams(teacherId: string, courseId: string): Promise<Exam[]> {
      await requireAssignedCourse(teacherId, courseId);
      return exams.listByCourse(courseId, deps.year);
    },

    async getExam(teacherId: string, examId: string): Promise<ExamDetail> {
      const { exam, course } = await requireAssignedExam(teacherId, examId);
      return loadExamDetail(deps, exam, course);
    },

    async createExam(teacherId: string, input: ExamInput): Promise<Exam> {
      const { courseId, ...details } = input;
      await requireAssignedCourse(teacherId, courseId);
      const exam = createExam({
        id: deps.ids.next("exam"),
        courseId,
        year: deps.year,
        details,
        now: deps.clock.now(),
      });
      await exams.save(exam);
      return exam;
    },

    async updateExam(teacherId: string, examId: string, details: ExamDetails): Promise<Exam> {
      const { exam } = await requireAssignedExam(teacherId, examId);
      const updated = updateExamDetails(exam, details, deps.clock.now());
      await exams.save(updated);
      return updated;
    },

    async deleteExam(teacherId: string, examId: string): Promise<void> {
      await requireAssignedExam(teacherId, examId);
      await exams.delete(examId);
    },

    /** Grades stay private until published; corrections after publishing stay published. */
    async saveExamGrades(
      teacherId: string,
      examId: string,
      changes: ExamGradeChanges,
    ): Promise<ExamDetail> {
      const { exam, course } = await requireAssignedExam(teacherId, examId);
      return saveExamGradeChanges(deps, exam, course, changes);
    },

    /** Families see the grades right away: exams need no approval by Dirección. */
    async publishExamGrades(teacherId: string, examId: string): Promise<ExamDetail> {
      const { exam, course } = await requireAssignedExam(teacherId, examId);
      return publishExamGrades(deps, exam, course);
    },

    saveBimester(
      teacherId: string,
      studentId: string,
      bimester: BimesterNumber,
      patch: BimesterPatch,
    ) {
      return change(teacherId, studentId, bimester, ({ card, course }) =>
        updateBimester(card, bimester, patch, course.gradingType),
      );
    },

    saveClosing(teacherId: string, studentId: string, patch: ClosingPatch) {
      return change(teacherId, studentId, "closing", ({ card, course }) =>
        updateClosing(card, patch, course.gradingType),
      );
    },
  };
}

export type TeacherUseCases = ReturnType<typeof createTeacherUseCases>;
