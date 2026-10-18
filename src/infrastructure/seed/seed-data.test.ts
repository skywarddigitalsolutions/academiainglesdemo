import { describe, expect, it } from "vitest";
import { examStatus, upcomingWithin } from "@/domain/exam";
import { isValidGrade } from "@/domain/grading";
import { getBimester, getBimesterStatus } from "@/domain/report-card";
import { buildSeed, seedReferenceDay } from "./seed-data";

const seed = buildSeed(2026);

describe("demo seed", () => {
  it("includes the three demo users with password demo123", () => {
    for (const [username, role] of [
      ["admin", "admin"],
      ["profesor", "teacher"],
      ["padre", "parent"],
    ] as const) {
      const user = seed.users.find((u) => u.username === username);
      expect(user?.role).toBe(role);
      expect(user?.password).toBe("demo123");
    }
  });

  it("defines grading type per course", () => {
    const byName = Object.fromEntries(
      seed.courses.map((c) => [c.name, c.gradingType]),
    );
    expect(byName["2° Grado A"]).toBe("conceptual");
    expect(byName["5° Grado A"]).toBe("numeric");
    expect(byName["1° Año"]).toBe("numeric");
  });

  it("assigns the demo teacher to more than one course", () => {
    const teacher = seed.users.find((u) => u.username === "profesor")!;
    const courses = seed.courses.filter((c) =>
      c.teacherIds.includes(teacher.id),
    );
    expect(courses.length).toBeGreaterThanOrEqual(2);
  });

  it("has 6 to 8 students per course with valid references", () => {
    for (const course of seed.courses) {
      const students = seed.students.filter((s) => s.courseId === course.id);
      expect(students.length).toBeGreaterThanOrEqual(6);
      expect(students.length).toBeLessThanOrEqual(8);
    }
    const parentIds = new Set(
      seed.users.filter((u) => u.role === "parent").map((u) => u.id),
    );
    for (const student of seed.students) {
      expect(student.guardianIds.length).toBeLessThanOrEqual(2);
      for (const id of student.guardianIds) expect(parentIds.has(id)).toBe(true);
    }
  });

  it("gives the demo parent one conceptual and one numeric child", () => {
    const parent = seed.users.find((u) => u.username === "padre")!;
    const children = seed.students.filter((s) =>
      s.guardianIds.includes(parent.id),
    );
    expect(children).toHaveLength(2);
    const types = children
      .map((c) => seed.courses.find((course) => course.id === c.courseId))
      .map((c) => c?.gradingType)
      .sort();
    expect(types).toEqual(["conceptual", "numeric"]);
  });

  it("fills bimesters following the demo storyline", () => {
    expect(seed.reportCards).toHaveLength(seed.students.length);
    for (const card of seed.reportCards) {
      expect(getBimester(card, 1).publishedAt).not.toBeNull();
      expect(getBimester(card, 2).publishedAt).not.toBeNull();
      expect(["empty", "draft"]).toContain(getBimesterStatus(getBimester(card, 3)));
      expect(getBimesterStatus(getBimester(card, 4))).toBe("empty");
      expect(card.closing.cuatrimestralExam).not.toBeNull();
      expect(card.closing.publishedAt).toBeNull();
    }
    const statuses = seed.reportCards.map((c) => getBimesterStatus(getBimester(c, 3)));
    expect(statuses).toContain("draft");
    expect(statuses).toContain("empty");
    const read = seed.reportCards.filter((c) => getBimester(c, 1).readAt !== null);
    expect(read.length).toBeGreaterThan(0);
    expect(read.length).toBeLessThan(seed.reportCards.length);
  });

  it("showcases one student going to a final exam", () => {
    const toFinal = seed.reportCards.filter(
      (c) => c.closing.result === "Va a examen final",
    );
    expect(toFinal).toHaveLength(1);
  });

  it("is deterministic", () => {
    expect(buildSeed(2026)).toEqual(seed);
  });
});

describe("demo seed exams", () => {
  // Reference day of the demo storyline (see the approval dates above).
  const today = seedReferenceDay(2026);
  const courseStudents = (courseId: string) =>
    seed.students.filter((s) => s.courseId === courseId).map((s) => s.id);

  it("has valid exams for every course across bimesters 1 to 3 and upcoming ones", () => {
    for (const course of seed.courses) {
      const exams = seed.exams.filter((e) => e.courseId === course.id);
      expect(new Set(exams.filter((e) => e.date < today).map((e) => e.bimester))).toEqual(
        new Set([1, 2, 3]),
      );
      const soon = upcomingWithin(exams, today, 14);
      expect(soon.length).toBeGreaterThanOrEqual(1);
      for (const exam of exams) {
        expect(exam.year).toBe(2026);
        expect(exam.topic.trim()).not.toBe("");
        for (const [studentId, value] of Object.entries(exam.grades)) {
          expect(courseStudents(course.id)).toContain(studentId);
          expect(isValidGrade(course.gradingType, value)).toBe(true);
        }
      }
    }
    expect(upcomingWithin(seed.exams, today, 14).length).toBeGreaterThanOrEqual(2);
    expect(new Set(seed.exams.map((e) => e.id)).size).toBe(seed.exams.length);
  });

  it("publishes graded past exams, keeps upcoming ones ungraded and leaves some pending", () => {
    const statuses = seed.exams.map((e) => examStatus(e, today));
    expect(statuses).toContain("published");
    expect(statuses).toContain("upcoming");
    expect(statuses).toContain("pending-grades");
    for (const exam of seed.exams) {
      if (exam.date > today) {
        expect(exam.grades).toEqual({});
        expect(exam.publishedAt).toBeNull();
      }
      if (exam.publishedAt) {
        expect(Object.keys(exam.grades)).toHaveLength(courseStudents(exam.courseId).length);
      }
    }
    const ungradedPast = seed.exams.filter(
      (e) => e.date < today && Object.keys(e.grades).length === 0,
    );
    expect(ungradedPast.length).toBeGreaterThanOrEqual(1);
  });

  it("grades students consistently with their level", () => {
    const published = seed.exams.filter((e) => e.courseId === "c-5a" && e.publishedAt);
    const avg = (id: string) =>
      published.reduce((sum, e) => sum + (e.grades[id] as number), 0) / published.length;
    expect(avg("s-13")).toBeGreaterThan(avg("s-10")); // Julieta (9.5) vs Bruno (5)
  });
});

describe("demo seed approval states", () => {
  it("has one period pending approval and one returned with a note", () => {
    const byId = Object.fromEntries(seed.reviews.map((r) => [r.id, r]));
    expect(byId["rv-c-1y-2026-3"]).toMatchObject({ status: "pending", submittedBy: "u-teacher-2" });
    expect(byId["rv-c-1y-2026-3"].studentIds.length).toBeGreaterThan(0);
    expect(byId["rv-c-5a-2026-3"]).toMatchObject({ status: "returned", decidedBy: "u-admin" });
    expect(byId["rv-c-5a-2026-3"].returnNote).toBeTruthy();
    expect(seed.notes.find((n) => n.courseId === "c-5a" && n.period === 3)?.text).toBe(
      byId["rv-c-5a-2026-3"].returnNote,
    );
  });

  it("keeps pending batches unpublished", () => {
    const pending = seed.reviews.find((r) => r.status === "pending")!;
    for (const id of pending.studentIds) {
      const card = seed.reportCards.find((c) => c.studentId === id)!;
      expect(getBimesterStatus(getBimester(card, 3))).toBe("draft");
    }
  });
});
