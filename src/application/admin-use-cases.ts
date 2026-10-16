import type { Course } from "@/domain/course";
import { DomainError } from "@/domain/errors";
import {
  fullName,
  linkGuardian,
  unlinkGuardian,
  validateStudent,
  type Student,
} from "@/domain/student";
import type { User } from "@/domain/user";
import { DEMO_PASSWORD } from "./demo-constants";
import { summarizeProgress, type PeriodProgress } from "./progress";
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
  const { courses, students, users, reportCards } = deps.repositories;

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
      const overview: CourseOverview[] = allCourses.map((course) => ({
        course,
        teachers: teachers.filter((t) => course.teacherIds.includes(t.id)),
        studentCount: allStudents.filter((s) => s.courseId === course.id).length,
        progress: summarizeProgress(
          cards.filter((c) => c.courseId === course.id),
        ),
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

    getReportCard(studentId: string) {
      return loadStudentReportCard(deps, studentId);
    },

    async listCourses(): Promise<CourseOverview[]> {
      return (await this.getOverview()).courses;
    },

    async listTeachers() {
      const [teachers, allCourses] = await Promise.all([
        users.listByRole("teacher"),
        courses.list(),
      ]);
      return teachers.map((teacher) => ({
        teacher,
        courses: allCourses.filter((c) => c.teacherIds.includes(teacher.id)),
      }));
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
      const username = input.username.trim().toLowerCase();
      if (!input.firstName.trim() || !input.lastName.trim()) {
        throw new DomainError("invalid-parent-name", "Ingrese nombre y apellido.");
      }
      if (!/^[a-z0-9._-]{3,}$/.test(username)) {
        throw new DomainError(
          "invalid-username",
          "El usuario debe tener al menos 3 caracteres (letras, números, punto o guion).",
        );
      }
      const taken = await users.findByUsername(username);
      if (taken && taken.id !== input.id) {
        throw new DomainError("username-taken", "Ese nombre de usuario ya está en uso.");
      }
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
