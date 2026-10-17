import { beforeEach, describe, expect, it } from "vitest";
import { DomainError } from "@/domain/errors";
import { getBimester, getBimesterStatus } from "@/domain/report-card";
import { createLocalStorageRepositories } from "@/infrastructure/local-storage/repositories";
import { MemoryStorage } from "@/infrastructure/local-storage/memory-storage";
import { createUseCases, type UseCases } from "./use-cases";

const NOW = new Date("2026-10-15T13:00:00.000Z");
const TEACHER = "u-teacher-1"; // profesor: 2° Grado A + 5° Grado A
const OTHER_TEACHER = "u-teacher-2"; // 1° Año
const PARENT = "u-parent-1"; // padre: Sofía (s-01) + Tomás (s-08)
const PARENT_1Y = "u-parent-5"; // Agustina (s-16), 1° Año
const ADMIN = "u-admin";

let uc: UseCases;

beforeEach(() => {
  let counter = 0;
  uc = createUseCases({
    repositories: createLocalStorageRepositories(new MemoryStorage(), 2026),
    clock: { now: () => NOW },
    ids: { next: (prefix) => `${prefix}-${++counter}` },
    year: 2026,
  });
});

describe("auth", () => {
  it("logs in with valid credentials and stores the session", async () => {
    const session = await uc.auth.login("profesor", "demo123");
    expect(session).toMatchObject({ userId: TEACHER, role: "teacher" });
    expect(session.displayName).toBe("Laura Benítez");
    expect(await uc.auth.getSession()).toEqual(session);
  });

  it("rejects invalid credentials", async () => {
    await expect(uc.auth.login("profesor", "wrong")).rejects.toThrow(
      DomainError,
    );
    await expect(uc.auth.login("ghost", "demo123")).rejects.toThrow(
      DomainError,
    );
  });

  it("logs out", async () => {
    await uc.auth.login("admin", "demo123");
    await uc.auth.logout();
    expect(await uc.auth.getSession()).toBeNull();
  });
});

describe("teacher", () => {
  it("lists only the courses assigned to the teacher", async () => {
    const courses = await uc.teacher.listCourses(TEACHER);
    expect(courses.map((c) => c.course.name).sort()).toEqual([
      "2° Grado A",
      "5° Grado A",
    ]);
    expect(courses[0].studentCount).toBeGreaterThan(0);
  });

  it("forbids access to a course of another teacher", async () => {
    await expect(uc.teacher.getGradeSheet(OTHER_TEACHER, "c-2a")).rejects.toThrow(
      DomainError,
    );
    await expect(uc.teacher.getReportCard(OTHER_TEACHER, "s-01")).rejects.toThrow(
      DomainError,
    );
  });

  it("summarizes loading progress per period", async () => {
    const courses = await uc.teacher.listCourses(TEACHER);
    const fifth = courses.find((c) => c.course.id === "c-5a")!;
    expect(fifth.studentCount).toBe(8);
    expect(fifth.progress.map((p) => p.period)).toEqual([1, 2, 3, 4, "closing"]);
    const [b1, , b3, b4] = fifth.progress;
    expect(b1).toMatchObject({ complete: 8, published: 8 });
    expect(b3.complete).toBeGreaterThan(0);
    expect(b3.complete).toBeLessThan(8);
    expect(b3.published).toBe(0);
    expect(b4).toMatchObject({ complete: 0, published: 0 });
  });

  it("returns the grade sheet of a course with every student", async () => {
    const sheet = await uc.teacher.getGradeSheet(TEACHER, "c-5a");
    expect(sheet.course.name).toBe("5° Grado A");
    expect(sheet.rows).toHaveLength(8);
    expect(getBimesterStatus(getBimester(sheet.rows[0].card, 1))).toMatch(
      /published|read/,
    );
  });

  it("saves several students of a bimester as drafts in one call", async () => {
    await uc.teacher.saveGradeSheet(TEACHER, "c-5a", 4, [
      { studentId: "s-08", patch: { applicationGrade: 8, conductGrade: "Muy bueno" } },
      { studentId: "s-09", patch: { applicationGrade: 9, absences: 1 } },
    ]);
    const sheet = await uc.teacher.getGradeSheet(TEACHER, "c-5a");
    const tomas = sheet.rows.find((r) => r.student.id === "s-08")!;
    const martina = sheet.rows.find((r) => r.student.id === "s-09")!;
    expect(getBimester(tomas.card, 4).applicationGrade).toBe(8);
    expect(getBimesterStatus(getBimester(tomas.card, 4))).toBe("draft");
    expect(getBimester(martina.card, 4).absences).toBe(1);
  });

  it("does not write anything when one row of the sheet is invalid", async () => {
    await expect(
      uc.teacher.saveGradeSheet(TEACHER, "c-5a", 4, [
        { studentId: "s-08", patch: { applicationGrade: 8 } },
        { studentId: "s-09", patch: { applicationGrade: 42 } },
      ]),
    ).rejects.toThrow(DomainError);
    const { card } = await uc.teacher.getReportCard(TEACHER, "s-08");
    expect(getBimester(card, 4).applicationGrade).toBeNull();
  });

  it("rejects sheet rows of students from another course", async () => {
    await expect(
      uc.teacher.saveGradeSheet(TEACHER, "c-5a", 4, [
        { studentId: "s-01", patch: { absences: 1 } },
      ]),
    ).rejects.toThrow(DomainError);
  });

  it("sends the complete students of a period to Dirección and skips the rest", async () => {
    await uc.teacher.saveGradeSheet(TEACHER, "c-5a", 4, [
      { studentId: "s-08", patch: { applicationGrade: 8, conductGrade: "Muy bueno" } },
      { studentId: "s-09", patch: { applicationGrade: 9 } },
    ]);
    const result = await uc.teacher.submitForApproval(TEACHER, "c-5a", 4);
    expect(result.submitted).toEqual(["s-08"]);
    expect(result.incomplete).toHaveLength(7);
    const sheet = await uc.teacher.getGradeSheet(TEACHER, "c-5a");
    expect(sheet.reviews.find((r) => r.period === 4)).toMatchObject({
      status: "pending",
      studentIds: ["s-08"],
      submittedAt: NOW.toISOString(),
    });
    const { card } = await uc.teacher.getReportCard(TEACHER, "s-08");
    expect(getBimester(card, 4).publishedAt).toBeNull();
  });

  it("cannot edit a period while Dirección reviews it", async () => {
    await uc.teacher.saveGradeSheet(TEACHER, "c-5a", 4, [
      { studentId: "s-08", patch: { applicationGrade: 8, conductGrade: "Muy bueno" } },
    ]);
    await uc.teacher.submitForApproval(TEACHER, "c-5a", 4);
    await expect(
      uc.teacher.saveGradeSheet(TEACHER, "c-5a", 4, [{ studentId: "s-09", patch: { absences: 2 } }]),
    ).rejects.toThrow(DomainError);
  });

  it("withdraws a pending submission and edits again", async () => {
    await uc.teacher.saveGradeSheet(TEACHER, "c-5a", 4, [
      { studentId: "s-08", patch: { applicationGrade: 8, conductGrade: "Muy bueno" } },
    ]);
    await uc.teacher.submitForApproval(TEACHER, "c-5a", 4);
    const sheet = await uc.teacher.withdrawSubmission(TEACHER, "c-5a", 4);
    expect(sheet.reviews.find((r) => r.period === 4)).toBeUndefined();
    await uc.teacher.saveGradeSheet(TEACHER, "c-5a", 4, [{ studentId: "s-09", patch: { absences: 2 } }]);
  });

  it("cannot change students whose period is already published", async () => {
    await expect(
      uc.teacher.saveGradeSheet(TEACHER, "c-5a", 1, [{ studentId: "s-08", patch: { absences: 3 } }]),
    ).rejects.toThrow(DomainError);
  });

  it("sends the closing of students with a final result", async () => {
    await uc.teacher.saveGradeSheet(TEACHER, "c-5a", "closing", [
      {
        studentId: "s-08",
        patch: {
          result: "Aprobado",
          finalResult: { kind: "promoted", nextCourseName: "6° Grado A" },
        },
      },
    ]);
    const result = await uc.teacher.submitForApproval(TEACHER, "c-5a", "closing");
    expect(result.submitted).toEqual(["s-08"]);
  });

  it("refuses to send a period without complete unpublished students", async () => {
    await expect(uc.teacher.submitForApproval(TEACHER, "c-5a", 1)).rejects.toThrow(DomainError);
  });

  it("lists courses with their reviews and unread notes from Dirección", async () => {
    const courses = await uc.teacher.listCourses(TEACHER);
    const fifth = courses.find((c) => c.course.id === "c-5a")!;
    expect(fifth.reviews.find((r) => r.period === 3)?.status).toBe("returned");
    expect(fifth.unreadNotes).toBe(1);

    const notes = await uc.teacher.listCourseNotes(TEACHER, "c-5a");
    expect(notes[0]).toMatchObject({ period: 3, authorName: "María Elena Gutiérrez" });
    const after = await uc.teacher.listCourses(TEACHER);
    expect(after.find((c) => c.course.id === "c-5a")!.unreadNotes).toBe(0);
  });

  it("reads Dirección's notes only for assigned courses", async () => {
    await expect(uc.teacher.listCourseNotes(OTHER_TEACHER, "c-5a")).rejects.toThrow(DomainError);
  });

  it("validates grades against the course grading type", async () => {
    await expect(
      uc.teacher.saveBimester(TEACHER, "s-01", 4, { applicationGrade: 8 }),
    ).rejects.toThrow(DomainError);
  });

  it("saves the closing chosen by the teacher", async () => {
    const card = await uc.teacher.saveClosing(TEACHER, "s-08", {
      result: "Aprobado",
      finalResult: { kind: "promoted", nextCourseName: "6° Grado A" },
    });
    expect(card.closing.result).toBe("Aprobado");
  });
});

describe("admin", () => {
  it("summarizes the institution", async () => {
    const overview = await uc.admin.getOverview();
    expect(overview.totals.students).toBe(21);
    expect(overview.totals.courses).toBe(3);
    expect(overview.courses).toHaveLength(3);
    expect(overview.courses[0].progress).toHaveLength(5);
  });

  it("includes the reviews of each course in the overview", async () => {
    const overview = await uc.admin.getOverview();
    const first = overview.courses.find((c) => c.course.id === "c-1y")!;
    expect(first.reviews.find((r) => r.period === 3)?.status).toBe("pending");
  });

  it("approves a pending period and publishes the batch to families", async () => {
    const before = await uc.parent.getReportCard(PARENT_1Y, "s-16");
    expect(before.view.bimesters[2].visible).toBe(false);

    const sheet = await uc.admin.approvePeriod(ADMIN, "c-1y", 3);
    const review = sheet.reviews.find((r) => r.period === 3)!;
    expect(review).toMatchObject({ status: "approved", decidedBy: ADMIN });
    for (const id of review.studentIds) {
      const row = sheet.rows.find((r) => r.student.id === id)!;
      expect(getBimester(row.card, 3).publishedAt).toBe(NOW.toISOString());
    }
    const after = await uc.parent.getReportCard(PARENT_1Y, "s-16");
    expect(after.view.bimesters[2].visible).toBe(true);
  });

  it("returns a pending period with a note the teacher can read", async () => {
    await expect(uc.admin.returnPeriod(ADMIN, "c-1y", 3, "  ")).rejects.toThrow(DomainError);
    const sheet = await uc.admin.returnPeriod(ADMIN, "c-1y", 3, "Revisar las inasistencias.");
    expect(sheet.reviews.find((r) => r.period === 3)).toMatchObject({
      status: "returned",
      returnNote: "Revisar las inasistencias.",
    });
    const notes = await uc.teacher.listCourseNotes(OTHER_TEACHER, "c-1y");
    expect(notes[0]).toMatchObject({ text: "Revisar las inasistencias.", period: 3 });
    // The teacher can edit the returned period again.
    await uc.teacher.saveGradeSheet(OTHER_TEACHER, "c-1y", 3, [
      { studentId: "s-18", patch: { absences: 1 } },
    ]);
  });

  it("decides only periods that are pending", async () => {
    await expect(uc.admin.approvePeriod(ADMIN, "c-2a", 3)).rejects.toThrow(DomainError);
    await expect(uc.admin.returnPeriod(ADMIN, "c-2a", 3, "x")).rejects.toThrow(DomainError);
  });

  it("corrects a pending period before approving it", async () => {
    await uc.admin.saveGradeSheet("c-1y", 3, [{ studentId: "s-16", patch: { absences: 2 } }]);
    const { card } = await uc.admin.getReportCard("s-16");
    expect(getBimester(card, 3).absences).toBe(2);
  });

  it("writes notes to the teachers of a course", async () => {
    await expect(uc.admin.addCourseNote(ADMIN, "c-2a", "   ", null)).rejects.toThrow(DomainError);
    await uc.admin.addCourseNote(ADMIN, "c-2a", "Recuerden cargar el 3° bimestre.", null);
    const notes = await uc.admin.listCourseNotes("c-2a");
    expect(notes[0]).toMatchObject({
      text: "Recuerden cargar el 3° bimestre.",
      authorName: "María Elena Gutiérrez",
      period: null,
    });
    expect(await uc.teacher.listCourseNotes(TEACHER, "c-2a")).toHaveLength(notes.length);
  });

  it("runs the whole approval cycle until families see the period", async () => {
    await uc.teacher.saveGradeSheet(TEACHER, "c-5a", 4, [
      { studentId: "s-08", patch: { applicationGrade: 5, conductGrade: "Bueno" } },
    ]);
    await uc.teacher.submitForApproval(TEACHER, "c-5a", 4);
    await uc.admin.returnPeriod(ADMIN, "c-5a", 4, "Confirme la nota de aplicación de Tomás.");
    await uc.teacher.saveGradeSheet(TEACHER, "c-5a", 4, [
      { studentId: "s-08", patch: { applicationGrade: 7 } },
    ]);
    await uc.teacher.submitForApproval(TEACHER, "c-5a", 4);
    expect((await uc.parent.getReportCard(PARENT, "s-08")).view.bimesters[3].visible).toBe(false);
    await uc.admin.approvePeriod(ADMIN, "c-5a", 4);
    const { view } = await uc.parent.getReportCard(PARENT, "s-08");
    expect(view.bimesters[3].data?.applicationGrade).toBe(7);
  });

  it("reads any student's report card", async () => {
    const { card, course } = await uc.admin.getReportCard("s-02");
    expect(course.id).toBe("c-2a");
    expect(card.bimesters).toHaveLength(4);
  });

  it("returns the grade sheet of any course without being assigned to it", async () => {
    const sheet = await uc.admin.getGradeSheet("c-5a");
    expect(sheet.course.name).toBe("5° Grado A");
    expect(sheet.rows).toHaveLength(8);
    await expect(uc.admin.getGradeSheet("c-missing")).rejects.toThrow(DomainError);
  });

  it("corrects grades from the sheet and keeps published periods published", async () => {
    const before = await uc.admin.getReportCard("s-08");
    const published = getBimester(before.card, 1);
    expect(published.publishedAt).not.toBeNull();

    const sheet = await uc.admin.saveGradeSheet("c-5a", 1, [
      { studentId: "s-08", patch: { applicationGrade: 6, absences: 4 } },
    ]);

    const row = sheet.rows.find((r) => r.student.id === "s-08")!;
    const corrected = getBimester(row.card, 1);
    expect(corrected.applicationGrade).toBe(6);
    expect(corrected.absences).toBe(4);
    expect(corrected.publishedAt).toBe(published.publishedAt);
    expect(corrected.readAt).toBe(published.readAt);
  });

  it("saves unpublished sheet rows as drafts", async () => {
    await uc.admin.saveGradeSheet("c-5a", 4, [
      { studentId: "s-09", patch: { applicationGrade: 9, conductGrade: "Excelente" } },
    ]);
    const { card } = await uc.admin.getReportCard("s-09");
    expect(getBimesterStatus(getBimester(card, 4))).toBe("draft");
  });

  it("validates every sheet row before writing anything", async () => {
    await expect(
      uc.admin.saveGradeSheet("c-5a", 4, [
        { studentId: "s-08", patch: { applicationGrade: 8 } },
        { studentId: "s-09", patch: { applicationGrade: 42 } },
      ]),
    ).rejects.toThrow(DomainError);
    await expect(
      uc.admin.saveGradeSheet("c-5a", 4, [{ studentId: "s-01", patch: { absences: 1 } }]),
    ).rejects.toThrow(DomainError);
    const { card } = await uc.admin.getReportCard("s-08");
    expect(getBimester(card, 4).applicationGrade).toBeNull();
  });

  it("creates a student with an empty report card", async () => {
    const student = await uc.admin.saveStudent({
      firstName: "Ana",
      lastName: "Paz",
      courseId: "c-1y",
      guardianIds: [PARENT],
    });
    expect(student.id).toBe("student-1");
    const card = await uc.admin.getReportCard(student.id);
    expect(card.card.bimesters).toHaveLength(4);
    const children = await uc.parent.listChildren(PARENT);
    expect(children).toHaveLength(3);
  });

  it("deletes a student and its report card", async () => {
    await uc.admin.deleteStudent("s-02");
    const students = await uc.admin.listStudents();
    expect(students.find((s) => s.student.id === "s-02")).toBeUndefined();
    await expect(uc.admin.getReportCard("s-02")).rejects.toThrow(DomainError);
  });

  it("creates parents with a unique username and the demo password", async () => {
    const parent = await uc.admin.saveParent({
      firstName: "Rosa",
      lastName: "Luna",
      username: "rluna",
      email: "rosa@example.com",
      phone: "",
    });
    const session = await uc.auth.login("rluna", "demo123");
    expect(session.userId).toBe(parent.id);
    await expect(
      uc.admin.saveParent({
        firstName: "Otro",
        lastName: "Padre",
        username: "padre",
        email: "",
        phone: "",
      }),
    ).rejects.toThrow(DomainError);
  });

  it("links children to a parent respecting the two-guardian limit", async () => {
    const parent = await uc.admin.saveParent({
      firstName: "Rosa",
      lastName: "Luna",
      username: "rluna",
      email: "",
      phone: "",
    });
    await uc.admin.setParentChildren(parent.id, ["s-02", "s-04"]);
    expect((await uc.parent.listChildren(parent.id)).length).toBe(2);

    // s-01 already has two guardians.
    await expect(uc.admin.setParentChildren(parent.id, ["s-01"])).rejects.toThrow(
      DomainError,
    );

    await uc.admin.setParentChildren(parent.id, ["s-04"]);
    const children = await uc.parent.listChildren(parent.id);
    expect(children.map((c) => c.student.id)).toEqual(["s-04"]);
  });

  it("unlinks children when a parent is deleted", async () => {
    await uc.admin.deleteParent(PARENT);
    const students = await uc.admin.listStudents();
    const sofia = students.find((s) => s.student.id === "s-01")!;
    expect(sofia.student.guardianIds).toEqual(["u-parent-2"]);
  });
});

describe("admin courses", () => {
  const newCourse = {
    name: "3° Grado B",
    schedule: "Sábados · 09:00 a 10:30",
    gradingType: "numeric" as const,
    teacherIds: [OTHER_TEACHER],
    nextCourseName: "4° Grado B",
  };

  it("creates a course that works in the grade sheet and the teacher panel", async () => {
    const course = await uc.admin.saveCourse(newCourse);
    expect(course).toMatchObject({ id: "course-1", name: "3° Grado B" });
    expect((await uc.admin.listCourses()).map((c) => c.course.id)).toContain(course.id);

    const student = await uc.admin.saveStudent({
      firstName: "Ana",
      lastName: "Paz",
      courseId: course.id,
      guardianIds: [],
    });
    const teacherCourses = await uc.teacher.listCourses(OTHER_TEACHER);
    expect(teacherCourses.map((c) => c.course.id)).toContain(course.id);
    const sheet = await uc.teacher.getGradeSheet(OTHER_TEACHER, course.id);
    expect(sheet.rows.map((r) => r.student.id)).toEqual([student.id]);
    await uc.teacher.saveGradeSheet(OTHER_TEACHER, course.id, 1, [
      { studentId: student.id, patch: { applicationGrade: 9 } },
    ]);
    const adminSheet = await uc.admin.getGradeSheet(course.id);
    expect(getBimester(adminSheet.rows[0].card, 1).applicationGrade).toBe(9);
  });

  it("validates the course fields and rejects duplicated names", async () => {
    await expect(uc.admin.saveCourse({ ...newCourse, name: " " })).rejects.toThrow(DomainError);
    await expect(uc.admin.saveCourse({ ...newCourse, name: "5° grado a" })).rejects.toThrow(
      "Ya existe un curso con ese nombre.",
    );
    await expect(
      uc.admin.saveCourse({ ...newCourse, teacherIds: [PARENT] }),
    ).rejects.toThrow(DomainError);
  });

  it("edits a course and reassigns its teachers", async () => {
    const before = (await uc.admin.listCourses()).find((c) => c.course.id === "c-1y")!.course;
    await uc.admin.saveCourse({
      id: "c-1y",
      name: "1° Año A",
      schedule: before.schedule,
      gradingType: before.gradingType,
      teacherIds: [TEACHER],
      nextCourseName: before.nextCourseName,
    });
    const courses = await uc.admin.listCourses();
    const edited = courses.find((c) => c.course.id === "c-1y")!;
    expect(edited.course.name).toBe("1° Año A");
    expect(edited.teachers.map((t) => t.id)).toEqual([TEACHER]);
    const teachers = await uc.admin.listTeachers();
    const other = teachers.find((t) => t.teacher.id === OTHER_TEACHER)!;
    expect(other.courses.map((c) => c.id)).not.toContain("c-1y");
  });

  it("does not change the grading type of a course with students", async () => {
    await expect(
      uc.admin.saveCourse({
        id: "c-5a",
        name: "5° Grado A",
        schedule: "Martes y jueves · 15:00 a 16:30",
        gradingType: "conceptual",
        teacherIds: [TEACHER],
        nextCourseName: "6° Grado A",
      }),
    ).rejects.toThrow(DomainError);
  });

  it("deletes a course without students", async () => {
    const course = await uc.admin.saveCourse(newCourse);
    await uc.admin.deleteCourse(course.id);
    expect((await uc.admin.listCourses()).map((c) => c.course.id)).not.toContain(course.id);
  });

  it("refuses to delete a course with students", async () => {
    await expect(uc.admin.deleteCourse("c-2a")).rejects.toThrow(
      "No se puede eliminar un curso con alumnos. Muévalos a otro curso primero.",
    );
    expect((await uc.admin.listCourses()).map((c) => c.course.id)).toContain("c-2a");
  });
});

describe("admin teachers", () => {
  const newTeacher = {
    firstName: "Marta",
    lastName: "Ríos",
    username: "mrios",
    password: "clave123",
    email: "marta@example.com",
    courseIds: ["c-1y"],
  };

  it("creates a teacher who can log in and see the assigned courses", async () => {
    const teacher = await uc.admin.saveTeacher(newTeacher);
    const session = await uc.auth.login("mrios", "clave123");
    expect(session).toMatchObject({ userId: teacher.id, role: "teacher" });
    const courses = await uc.teacher.listCourses(teacher.id);
    expect(courses.map((c) => c.course.id)).toEqual(["c-1y"]);
    const course = (await uc.admin.listCourses()).find((c) => c.course.id === "c-1y")!;
    expect(course.course.teacherIds).toEqual([OTHER_TEACHER, teacher.id]);
  });

  it("rejects a duplicated username", async () => {
    await expect(
      uc.admin.saveTeacher({ ...newTeacher, username: "Padre" }),
    ).rejects.toThrow("Ese nombre de usuario ya está en uso.");
  });

  it("requires a password for new teachers and keeps it when editing with a blank one", async () => {
    await expect(uc.admin.saveTeacher({ ...newTeacher, password: "" })).rejects.toThrow(
      DomainError,
    );
    const teacher = await uc.admin.saveTeacher(newTeacher);
    await uc.admin.saveTeacher({ ...newTeacher, id: teacher.id, lastName: "Ríos Paz", password: "" });
    const session = await uc.auth.login("mrios", "clave123");
    expect(session.displayName).toBe("Marta Ríos Paz");
  });

  it("keeps course assignments consistent when the teacher's courses change", async () => {
    const teacher = await uc.admin.saveTeacher(newTeacher);
    await uc.admin.saveTeacher({ ...newTeacher, id: teacher.id, password: "", courseIds: ["c-2a"] });
    const courses = await uc.admin.listCourses();
    const firstYear = courses.find((c) => c.course.id === "c-1y")!;
    const second = courses.find((c) => c.course.id === "c-2a")!;
    expect(firstYear.course.teacherIds).toEqual([OTHER_TEACHER]);
    expect(second.course.teacherIds).toEqual([TEACHER, teacher.id]);
    const listed = (await uc.admin.listTeachers()).find((t) => t.teacher.id === teacher.id)!;
    expect(listed.courses.map((c) => c.id)).toEqual(["c-2a"]);
  });

  it("refuses to delete a teacher assigned to courses", async () => {
    await expect(uc.admin.deleteTeacher(TEACHER)).rejects.toThrow(
      "No se puede eliminar un docente con cursos asignados. Quítele los cursos primero.",
    );
  });

  it("deletes a teacher without courses", async () => {
    const teacher = await uc.admin.saveTeacher({ ...newTeacher, courseIds: [] });
    await uc.admin.deleteTeacher(teacher.id);
    expect((await uc.admin.listTeachers()).map((t) => t.teacher.id)).not.toContain(teacher.id);
    await expect(uc.auth.login("mrios", "clave123")).rejects.toThrow(DomainError);
  });

  it("does not edit or delete users that are not teachers", async () => {
    await expect(uc.admin.deleteTeacher(PARENT)).rejects.toThrow(DomainError);
    await expect(uc.admin.saveTeacher({ ...newTeacher, id: ADMIN })).rejects.toThrow(DomainError);
  });
});

describe("parent", () => {
  it("lists only their children", async () => {
    const children = await uc.parent.listChildren(PARENT);
    expect(children.map((c) => c.student.firstName).sort()).toEqual([
      "Sofía",
      "Tomás",
    ]);
    expect(children[0].pendingAcknowledgements).toBe(1);
  });

  it("lists each child with the family view of the report card", async () => {
    const children = await uc.parent.listChildren(PARENT);
    const sofia = children.find((c) => c.student.id === "s-01")!;
    expect(sofia.view.bimesters.map((b) => b.visible)).toEqual([true, true, false, false]);
    expect(sofia.view.bimesters[2].data).toBeNull();
  });

  it("sees only published bimesters", async () => {
    const { view } = await uc.parent.getReportCard(PARENT, "s-01");
    expect(view.bimesters.map((b) => b.visible)).toEqual([
      true,
      true,
      false,
      false,
    ]);
  });

  it("cannot see report cards of other students", async () => {
    await expect(uc.parent.getReportCard(PARENT, "s-02")).rejects.toThrow(
      DomainError,
    );
  });

  it("marks a published bimester as read with a timestamp", async () => {
    const { view } = await uc.parent.acknowledgeBimester(PARENT, "s-01", 2);
    expect(view.bimesters[1].data?.readAt).toBe(NOW.toISOString());
  });

  it("does not see a period that is pending approval", async () => {
    const { view } = await uc.parent.getReportCard(PARENT_1Y, "s-16");
    expect(view.bimesters[2]).toMatchObject({ visible: false, data: null });
  });

  it("cannot mark an unpublished bimester as read", async () => {
    await expect(uc.parent.acknowledgeBimester(PARENT, "s-01", 3)).rejects.toThrow(
      DomainError,
    );
  });
});

describe("demo", () => {
  it("restores the seed data", async () => {
    await uc.admin.deleteStudent("s-01");
    await uc.demo.reset();
    const students = await uc.admin.listStudents();
    expect(students).toHaveLength(21);
  });
});
