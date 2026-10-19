import { beforeEach, describe, expect, it } from "vitest";
import type { Repositories } from "@/application/ports";
import { createLocalStorageRepositories } from "./repositories";
import { MemoryStorage } from "./memory-storage";
import { STORAGE_PREFIX } from "./storage";

let storage: MemoryStorage;
let repos: Repositories;

beforeEach(() => {
  storage = new MemoryStorage();
  repos = createLocalStorageRepositories(storage, 2026);
});

describe("local storage repositories", () => {
  it("finds users by username ignoring case and spaces", async () => {
    const user = await repos.users.findByUsername("  Profesor ");
    expect(user?.role).toBe("teacher");
    expect(await repos.users.findByUsername("nobody")).toBeNull();
  });

  it("lists users by role", async () => {
    const admins = await repos.users.listByRole("admin");
    expect(admins.map((u) => u.username)).toEqual(["admin"]);
  });

  it("lists courses by teacher", async () => {
    const teacher = (await repos.users.findByUsername("profesor"))!;
    const courses = await repos.courses.listByTeacher(teacher.id);
    expect(courses.length).toBeGreaterThanOrEqual(2);
    expect(courses.every((c) => c.teacherIds.includes(teacher.id))).toBe(true);
  });

  it("lists students by course and by guardian, sorted by last name", async () => {
    const parent = (await repos.users.findByUsername("padre"))!;
    const children = await repos.students.listByGuardian(parent.id);
    expect(children).toHaveLength(2);

    const course = (await repos.courses.list())[0];
    const students = await repos.students.listByCourse(course.id);
    const names = students.map((s) => s.lastName);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "es")));
  });

  it("saves and deletes students", async () => {
    await repos.students.save({
      id: "s-new",
      firstName: "Ana",
      lastName: "Nuevo",
      courseId: "c-2a",
      guardianIds: [],
    });
    expect((await repos.students.getById("s-new"))?.firstName).toBe("Ana");
    await repos.students.delete("s-new");
    expect(await repos.students.getById("s-new")).toBeNull();
  });

  it("saves and deletes courses", async () => {
    await repos.courses.save({
      id: "c-new",
      name: "3° Grado B",
      level: "primary",
      year: 3,
      division: "B",
      gradingType: "conceptual",
      teacherIds: [],
      nextCourseName: "",
      schedule: "Lunes · 10:00 a 11:00",
    });
    expect((await repos.courses.getById("c-new"))?.name).toBe("3° Grado B");
    await repos.courses.delete("c-new");
    expect(await repos.courses.getById("c-new")).toBeNull();
  });

  it("persists report cards in storage", async () => {
    const student = (await repos.students.list())[0];
    const card = (await repos.reportCards.findByStudent(student.id, 2026))!;
    await repos.reportCards.save({
      ...card,
      closing: { ...card.closing, cuatrimestralExam: 10 },
    });

    const reloaded = createLocalStorageRepositories(storage, 2026);
    const stored = await reloaded.reportCards.findByStudent(student.id, 2026);
    expect(stored?.closing.cuatrimestralExam).toBe(10);
    expect(await reloaded.reportCards.findByStudent(student.id, 1999)).toBeNull();
  });

  it("namespaces every key and versions the data collections", async () => {
    await repos.students.list();
    expect(storage.getItem(`${STORAGE_PREFIX}v5:students`)).not.toBeNull();
  });

  it("ignores data stored with a previous schema version", async () => {
    storage.setItem(`${STORAGE_PREFIX}students`, "[]");
    storage.setItem(`${STORAGE_PREFIX}v2:students`, "[]");
    const fresh = createLocalStorageRepositories(storage, 2026);
    expect((await fresh.students.list()).length).toBeGreaterThan(0);
  });

  it("restores approval batches and notes when the demo is reset", async () => {
    const [review] = await repos.reviews.listByCourse("c-1y", 2026);
    await repos.reviews.delete(review.id);
    await repos.notes.markSeen("u-teacher-1", "c-5a", "2026-10-15T00:00:00.000Z");
    await repos.demoData.reset();
    expect(await repos.reviews.getById(review.id)).not.toBeNull();
    expect(await repos.notes.getSeenAt("u-teacher-1", "c-5a")).toBeNull();
    expect((await repos.notes.listByCourse("c-5a", 2026)).length).toBe(1);
  });

  it("lists exams by course and year, sorted by date", async () => {
    const exams = await repos.exams.listByCourse("c-5a", 2026);
    expect(exams.length).toBeGreaterThan(0);
    expect(exams.every((e) => e.courseId === "c-5a")).toBe(true);
    const dates = exams.map((e) => e.date);
    expect(dates).toEqual([...dates].sort());
    expect(await repos.exams.listByCourse("c-5a", 1999)).toEqual([]);
    const all = await repos.exams.listByYear(2026);
    expect(new Set(all.map((e) => e.courseId))).toEqual(new Set(["c-2a", "c-2b", "c-5a", "c-1y", "c-1b"]));
  });

  it("saves, finds and deletes exams, and restores them on reset", async () => {
    const [first] = await repos.exams.listByCourse("c-1y", 2026);
    await repos.exams.save({ ...first, topic: "Changed" });
    expect((await repos.exams.getById(first.id))?.topic).toBe("Changed");
    await repos.exams.delete(first.id);
    expect(await repos.exams.getById(first.id)).toBeNull();
    await repos.demoData.reset();
    expect((await repos.exams.getById(first.id))?.topic).toBe(first.topic);
  });

  it("lists, saves and deletes teacher absences, and restores them on reset", async () => {
    const seeded = await repos.teacherAbsences.list();
    expect(seeded.length).toBeGreaterThan(0);
    const starts = seeded.map((a) => a.from);
    expect(starts).toEqual([...starts].sort());
    await repos.teacherAbsences.save({ ...seeded[0], reason: "Changed" });
    expect((await repos.teacherAbsences.getById(seeded[0].id))?.reason).toBe("Changed");
    await repos.teacherAbsences.delete(seeded[0].id);
    expect(await repos.teacherAbsences.getById(seeded[0].id)).toBeNull();
    await repos.demoData.reset();
    expect((await repos.teacherAbsences.getById(seeded[0].id))?.reason).toBe(seeded[0].reason);
  });

  it("restores the seed when the demo is reset", async () => {
    const student = (await repos.students.list())[0];
    await repos.students.delete(student.id);
    await repos.demoData.reset();
    expect(await repos.students.getById(student.id)).not.toBeNull();
  });
});

describe("local storage session store", () => {
  it("stores, reads and clears the session", async () => {
    expect(await repos.session.get()).toBeNull();
    const session = {
      userId: "u-admin",
      role: "admin" as const,
      displayName: "Directora",
      startedAt: "2026-10-01T10:00:00.000Z",
    };
    await repos.session.set(session);
    expect(await repos.session.get()).toEqual(session);
    await repos.session.clear();
    expect(await repos.session.get()).toBeNull();
  });

  it("treats a corrupt session as logged out", async () => {
    storage.setItem(`${STORAGE_PREFIX}session`, "{oops");
    expect(await repos.session.get()).toBeNull();
  });
});
