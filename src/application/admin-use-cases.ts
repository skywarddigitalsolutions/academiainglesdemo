import { validateCourse, type Course, type SchoolLevel } from "@/domain/course";
import { createCourseNote, type CourseNote } from "@/domain/course-note";
import { approveReview, returnReview, type PeriodReview } from "@/domain/period-review";
import {
  publishBimester,
  publishClosing,
  type ReportPeriod,
} from "@/domain/report-card";
import { DomainError } from "@/domain/errors";
import {
  fullName,
  linkGuardian,
  unlinkGuardian,
  validateStudent,
  type Student,
} from "@/domain/student";
import { displayName, type User } from "@/domain/user";
import { DEMO_PASSWORD } from "./demo-constants";
import { loadDashboard, type DashboardMetrics } from "./dashboard";
import { loadExamAgenda, loadExamDetail, requireExam, type ExamAgenda, type ExamDetail } from "./exams";
import {
  findReview,
  loadGradeSheet,
  saveGradeSheetChanges,
  type GradeSheet,
  type GradeSheetChange,
} from "./grade-sheet";
import { isPublishable, summarizeProgress, type PeriodProgress } from "./progress";
import {
  loadOrCreateReportCard,
  loadStudentReportCard,
  notFound,
  requireCourse,
  type UseCaseDeps,
} from "./shared";

export interface CourseOverview {
  course: Course;
  teachers: User[];
  studentCount: number;
  progress: PeriodProgress[];
  reviews: PeriodReview[];
}

export interface StudentInput {
  id?: string;
  firstName: string;
  lastName: string;
  courseId: string;
  guardianIds: string[];
}

export interface ParentInput {
  id?: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
}

export interface CourseInput {
  id?: string;
  /** Name and grading type are derived from level, year and division. */
  level: SchoolLevel;
  year: number;
  division: string;
  /** Stored shape, e.g. "Lunes y miércoles · 14:00 a 15:30" (see formatSchedule). */
  schedule: string;
  teacherIds: string[];
  nextCourseName: string;
}

export interface TeacherInput {
  id?: string;
  firstName: string;
  lastName: string;
  username: string;
  /** Required for new teachers; blank keeps the current one when editing. */
  password: string;
  email: string;
  courseIds: string[];
}

export interface TeacherListItem {
  teacher: User;
  courses: Course[];
}

export const MIN_PASSWORD_LENGTH = 6;

export interface StudentListItem {
  student: Student;
  course: Course | null;
  guardians: User[];
}

export interface ParentListItem {
  parent: User;
  children: Student[];
}

export function createAdminUseCases(deps: UseCaseDeps) {
  const { courses, students, users, reportCards, reviews, notes, exams } = deps.repositories;

  async function requirePendingReview(courseId: string, period: ReportPeriod) {
    const review = await findReview(deps, courseId, period);
    if (!review || review.status !== "pending") {
      throw new DomainError("review-not-pending", "Este período no está pendiente de aprobación.");
    }
    return review;
  }

  async function authorName(adminId: string): Promise<string> {
    const author = await users.getById(adminId);
    return author ? displayName(author) : "Dirección";
  }

  async function writeNote(
    adminId: string,
    courseId: string,
    text: string,
    period: ReportPeriod | null,
  ): Promise<CourseNote> {
    const note = createCourseNote({
      id: deps.ids.next("note"),
      courseId,
      year: deps.year,
      authorId: adminId,
      authorName: await authorName(adminId),
      text,
      period,
      now: deps.clock.now(),
    });
    await notes.save(note);
    return note;
  }

  async function requireTeacher(teacherId: string): Promise<User> {
    const teacher = await users.getById(teacherId);
    if (!teacher || teacher.role !== "teacher") throw notFound("el docente");
    return teacher;
  }

  /** Normalizes and validates a username, rejecting one used by another account. */
  async function availableUsername(raw: string, ownerId?: string): Promise<string> {
    const username = raw.trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,}$/.test(username)) {
      throw new DomainError(
        "invalid-username",
        "El usuario debe tener al menos 3 caracteres (letras, números, punto o guion).",
      );
    }
    const taken = await users.findByUsername(username);
    if (taken && taken.id !== ownerId) {
      throw new DomainError("username-taken", "Ese nombre de usuario ya está en uso.");
    }
    return username;
  }

  async function requireParent(parentId: string): Promise<User> {
    const parent = await users.getById(parentId);
    if (!parent || parent.role !== "parent") throw notFound("la familia");
    return parent;
  }

  return {
    async getOverview() {
      const [allCourses, allStudents, parents, teachers] = await Promise.all([
        courses.list(),
        students.list(),
        users.listByRole("parent"),
        users.listByRole("teacher"),
      ]);
      const cards = await Promise.all(
        allStudents.map((student) => loadOrCreateReportCard(deps, student)),
      );
      const courseReviews = await Promise.all(
        allCourses.map((course) => reviews.listByCourse(course.id, deps.year)),
      );
      const overview: CourseOverview[] = allCourses.map((course, i) => ({
        course,
        teachers: teachers.filter((t) => course.teacherIds.includes(t.id)),
        studentCount: allStudents.filter((s) => s.courseId === course.id).length,
        progress: summarizeProgress(
          cards.filter((c) => c.courseId === course.id),
        ),
        reviews: courseReviews[i],
      }));
      return {
        courses: overview,
        progress: summarizeProgress(cards),
        totals: {
          students: allStudents.length,
          parents: parents.length,
          teachers: teachers.length,
          courses: allCourses.length,
        },
      };
    },

    /** Read-only metrics for the Tablero (drafts included). */
    getDashboard(): Promise<DashboardMetrics> {
      return loadDashboard(deps);
    },

    getReportCard(studentId: string) {
      return loadStudentReportCard(deps, studentId);
    },

    /** Grade sheet of any course (Dirección is not limited to assignments). */
    async getGradeSheet(courseId: string): Promise<GradeSheet> {
      const course = await requireCourse(deps, courseId);
      return loadGradeSheet(deps, course);
    },

    /** Approves the teacher's batch: its complete students are published to families. */
    async approvePeriod(
      adminId: string,
      courseId: string,
      period: ReportPeriod,
    ): Promise<GradeSheet> {
      const course = await requireCourse(deps, courseId);
      const review = await requirePendingReview(courseId, period);
      const now = deps.clock.now();
      const { rows } = await loadGradeSheet(deps, course);
      for (const { student, card } of rows) {
        if (!review.studentIds.includes(student.id)) continue;
        if (isPublishable(card, period) !== "ready") continue;
        await reportCards.save(
          period === "closing" ? publishClosing(card, now) : publishBimester(card, period, now),
        );
      }
      await reviews.save(approveReview(review, adminId, now));
      return loadGradeSheet(deps, course);
    },

    /** Returns the batch to the teacher; the observation is also kept as a course note. */
    async returnPeriod(
      adminId: string,
      courseId: string,
      period: ReportPeriod,
      note: string,
    ): Promise<GradeSheet> {
      const course = await requireCourse(deps, courseId);
      const review = await requirePendingReview(courseId, period);
      const returned = returnReview(review, adminId, note, deps.clock.now());
      await reviews.save(returned);
      await writeNote(adminId, courseId, returned.returnNote ?? note, period);
      return loadGradeSheet(deps, course);
    },

    async addCourseNote(
      adminId: string,
      courseId: string,
      text: string,
      period: ReportPeriod | null,
    ): Promise<CourseNote> {
      await requireCourse(deps, courseId);
      return writeNote(adminId, courseId, text, period);
    },

    async listCourseNotes(courseId: string): Promise<CourseNote[]> {
      await requireCourse(deps, courseId);
      return notes.listByCourse(courseId, deps.year);
    },

    /**
     * Corrections made by Dirección from the course sheet. Publication state is
     * left untouched: drafts stay drafts and published periods stay published.
     */
    async saveGradeSheet<P extends ReportPeriod>(
      courseId: string,
      period: P,
      changes: GradeSheetChange<P>[],
    ): Promise<GradeSheet> {
      const course = await requireCourse(deps, courseId);
      return saveGradeSheetChanges(deps, course, period, changes);
    },

    /** Read-only: exams are managed by the teachers. */
    async listExams(): Promise<ExamAgenda> {
      return loadExamAgenda(deps, await courses.list());
    },

    async getExam(examId: string): Promise<ExamDetail> {
      const exam = await requireExam(deps, examId);
      return loadExamDetail(deps, exam, await requireCourse(deps, exam.courseId));
    },

    async listCourses(): Promise<CourseOverview[]> {
      return (await this.getOverview()).courses;
    },

    async saveCourse(input: CourseInput): Promise<Course> {
      const existing = input.id ? await requireCourse(deps, input.id) : null;
      for (const id of input.teacherIds) await requireTeacher(id);
      const course = validateCourse({
        id: existing?.id ?? deps.ids.next("course"),
        // name and gradingType are derived by validateCourse
        name: "",
        level: input.level,
        year: input.year,
        division: input.division,
        gradingType: "numeric",
        schedule: input.schedule,
        teacherIds: input.teacherIds,
        nextCourseName: input.nextCourseName,
      });
      const key = course.name.toLocaleLowerCase("es");
      const duplicated = (await courses.list()).some(
        (c) => c.id !== course.id && c.name.trim().toLocaleLowerCase("es") === key,
      );
      if (duplicated) {
        throw new DomainError("course-name-taken", "Ya existe un curso con ese nombre.");
      }
      if (
        existing &&
        existing.gradingType !== course.gradingType &&
        (await students.listByCourse(existing.id)).length > 0
      ) {
        throw new DomainError(
          "grading-type-locked",
          "No se puede cambiar el grado o año a uno con otro tipo de calificación en un curso con alumnos.",
        );
      }
      // Report cards, approval batches and notes are created lazily per course.
      await courses.save(course);
      return course;
    },

    async deleteCourse(courseId: string): Promise<void> {
      await requireCourse(deps, courseId);
      if ((await students.listByCourse(courseId)).length > 0) {
        throw new DomainError(
          "course-has-students",
          "No se puede eliminar un curso con alumnos. Muévalos a otro curso primero.",
        );
      }
      for (const review of await reviews.listByCourse(courseId, deps.year)) {
        await reviews.delete(review.id);
      }
      for (const exam of await exams.listByCourse(courseId, deps.year)) {
        await exams.delete(exam.id);
      }
      await courses.delete(courseId);
    },

    async listTeachers(): Promise<TeacherListItem[]> {
      const [teachers, allCourses] = await Promise.all([
        users.listByRole("teacher"),
        courses.list(),
      ]);
      return teachers.map((teacher) => ({
        teacher,
        courses: allCourses.filter((c) => c.teacherIds.includes(teacher.id)),
      }));
    },

    /**
     * Creates or edits a teacher. Course.teacherIds is the single source of the
     * assignment, so the teacher's courses are written on each course.
     */
    async saveTeacher(input: TeacherInput): Promise<User> {
      const existing = input.id ? await requireTeacher(input.id) : null;
      if (!input.firstName.trim() || !input.lastName.trim()) {
        throw new DomainError("invalid-teacher-name", "Ingrese nombre y apellido.");
      }
      const username = await availableUsername(input.username, existing?.id);
      const password = input.password.trim();
      if ((!existing || password) && password.length < MIN_PASSWORD_LENGTH) {
        throw new DomainError(
          "invalid-password",
          `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
        );
      }
      const allCourses = await courses.list();
      const wanted = new Set(input.courseIds);
      for (const id of wanted) {
        if (!allCourses.some((c) => c.id === id)) throw notFound("el curso");
      }
      const teacher: User = {
        id: existing?.id ?? deps.ids.next("teacher"),
        username,
        password: password || (existing?.password ?? ""),
        role: "teacher",
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        email: input.email.trim(),
        phone: existing?.phone ?? "",
      };
      await users.save(teacher);
      for (const course of allCourses) {
        const assigned = course.teacherIds.includes(teacher.id);
        if (wanted.has(course.id) && !assigned) {
          await courses.save({ ...course, teacherIds: [...course.teacherIds, teacher.id] });
        } else if (!wanted.has(course.id) && assigned) {
          await courses.save({
            ...course,
            teacherIds: course.teacherIds.filter((id) => id !== teacher.id),
          });
        }
      }
      return teacher;
    },

    async deleteTeacher(teacherId: string): Promise<void> {
      await requireTeacher(teacherId);
      if ((await courses.listByTeacher(teacherId)).length > 0) {
        throw new DomainError(
          "teacher-has-courses",
          "No se puede eliminar un docente con cursos asignados. Quítele los cursos primero.",
        );
      }
      await users.delete(teacherId);
    },

    async listStudents(): Promise<StudentListItem[]> {
      const [allStudents, allCourses, parents] = await Promise.all([
        students.list(),
        courses.list(),
        users.listByRole("parent"),
      ]);
      return allStudents.map((student) => ({
        student,
        course: allCourses.find((c) => c.id === student.courseId) ?? null,
        guardians: parents.filter((p) => student.guardianIds.includes(p.id)),
      }));
    },

    async saveStudent(input: StudentInput): Promise<Student> {
      await requireCourse(deps, input.courseId);
      for (const id of input.guardianIds) await requireParent(id);
      const existing = input.id ? await students.getById(input.id) : null;
      if (input.id && !existing) throw notFound("el alumno");
      const student = validateStudent({
        id: existing?.id ?? deps.ids.next("student"),
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        courseId: input.courseId,
        guardianIds: [...new Set(input.guardianIds)],
      });
      await students.save(student);
      await loadOrCreateReportCard(deps, student);
      return student;
    },

    async deleteStudent(studentId: string): Promise<void> {
      await students.delete(studentId);
      await reportCards.deleteByStudent(studentId);
    },

    async listParents(): Promise<ParentListItem[]> {
      const [parents, allStudents] = await Promise.all([
        users.listByRole("parent"),
        students.list(),
      ]);
      return parents.map((parent) => ({
        parent,
        children: allStudents.filter((s) => s.guardianIds.includes(parent.id)),
      }));
    },

    async saveParent(input: ParentInput): Promise<User> {
      if (!input.firstName.trim() || !input.lastName.trim()) {
        throw new DomainError("invalid-parent-name", "Ingrese nombre y apellido.");
      }
      const username = await availableUsername(input.username, input.id);
      const existing = input.id ? await requireParent(input.id) : null;
      const parent: User = {
        id: existing?.id ?? deps.ids.next("parent"),
        username,
        password: existing?.password ?? DEMO_PASSWORD,
        role: "parent",
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        email: input.email.trim(),
        phone: input.phone.trim(),
      };
      await users.save(parent);
      return parent;
    },

    async deleteParent(parentId: string): Promise<void> {
      await requireParent(parentId);
      for (const child of await students.listByGuardian(parentId)) {
        await students.save(unlinkGuardian(child, parentId));
      }
      await users.delete(parentId);
    },

    /** Replaces the children linked to a parent (validates before writing). */
    async setParentChildren(parentId: string, studentIds: string[]): Promise<void> {
      await requireParent(parentId);
      const all = await students.list();
      const wanted = new Set(studentIds);
      const changes: Student[] = [];
      for (const student of all) {
        const linked = student.guardianIds.includes(parentId);
        if (wanted.has(student.id) && !linked) {
          try {
            changes.push(linkGuardian(student, parentId));
          } catch (error) {
            if (error instanceof DomainError) {
              throw new DomainError(
                error.code,
                `${fullName(student)} ya tiene dos responsables vinculados.`,
              );
            }
            throw error;
          }
        } else if (!wanted.has(student.id) && linked) {
          changes.push(unlinkGuardian(student, parentId));
        }
      }
      for (const student of changes) await students.save(student);
    },
  };
}

export type AdminUseCases = ReturnType<typeof createAdminUseCases>;
