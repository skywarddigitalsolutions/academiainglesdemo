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

  it("publishes every complete bimester of the course and skips the rest", async () => {
    await uc.teacher.saveGradeSheet(TEACHER, "c-5a", 4, [
      { studentId: "s-08", patch: { applicationGrade: 8, conductGrade: "Muy bueno" } },
      { studentId: "s-09", patch: { applicationGrade: 9 } },
    ]);
    const result = await uc.teacher.publishGradeSheet(TEACHER, "c-5a", 4);
    expect(result.published).toEqual(["s-08"]);
    expect(result.incomplete).toHaveLength(7);
    const { card } = await uc.teacher.getReportCard(TEACHER, "s-08");
    expect(getBimester(card, 4).publishedAt).toBe(NOW.toISOString());
  });

  it("publishes the closing of students with a final result", async () => {
    await uc.teacher.saveGradeSheet(TEACHER, "c-5a", "closing", [
      {
        studentId: "s-08",
        patch: {
          result: "Aprobado",
          finalResult: { kind: "promoted", nextCourseName: "6° Grado A" },
        },
      },
    ]);
    const result = await uc.teacher.publishGradeSheet(TEACHER, "c-5a", "closing");
    expect(result.published).toEqual(["s-08"]);
    const { card } = await uc.teacher.getReportCard(TEACHER, "s-08");
    expect(card.closing.publishedAt).toBe(NOW.toISOString());
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

  it("has no approval workflow", () => {
    expect("listPendingApprovals" in uc.admin).toBe(false);
    expect("approveBimester" in uc.admin).toBe(false);
  });

  it("reads any student's report card", async () => {
    const { card, course } = await uc.admin.getReportCard("s-02");
    expect(course.id).toBe("c-2a");
    expect(card.bimesters).toHaveLength(4);
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

describe("parent", () => {
  it("lists only their children", async () => {
    const children = await uc.parent.listChildren(PARENT);
    expect(children.map((c) => c.student.firstName).sort()).toEqual([
      "Sofía",
      "Tomás",
    ]);
    expect(children[0].pendingAcknowledgements).toBe(1);
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
