import { describe, expect, it } from "vitest";
import { getBimester, getBimesterStatus } from "@/domain/report-card";
import { buildSeed } from "./seed-data";

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
      expect(getBimester(card, 1).signatures.director.signed).toBe(true);
      expect(getBimester(card, 2).signatures.director.signed).toBe(true);
      expect(getBimesterStatus(getBimester(card, 3))).toBe("pending-approval");
      expect(getBimesterStatus(getBimester(card, 4))).toBe("empty");
      expect(card.closing.cuatrimestralExam).not.toBeNull();
    }
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
