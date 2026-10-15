import { describe, expect, it } from "vitest";
import { DomainError } from "./errors";
import {
  MAX_GUARDIANS,
  fullName,
  linkGuardian,
  unlinkGuardian,
  validateStudent,
  type Student,
} from "./student";

const student: Student = {
  id: "s-1",
  firstName: "Lucía",
  lastName: "Fernández",
  courseId: "c-1",
  guardianIds: [],
};

describe("student", () => {
  it("allows up to two guardians", () => {
    expect(MAX_GUARDIANS).toBe(2);
    const withTwo = linkGuardian(linkGuardian(student, "p-1"), "p-2");
    expect(withTwo.guardianIds).toEqual(["p-1", "p-2"]);
    expect(() => linkGuardian(withTwo, "p-3")).toThrow(DomainError);
  });

  it("ignores linking the same guardian twice", () => {
    const once = linkGuardian(student, "p-1");
    expect(linkGuardian(once, "p-1").guardianIds).toEqual(["p-1"]);
  });

  it("unlinks a guardian", () => {
    const linked = linkGuardian(student, "p-1");
    expect(unlinkGuardian(linked, "p-1").guardianIds).toEqual([]);
  });

  it("builds the full name as last name, first name", () => {
    expect(fullName(student)).toBe("Fernández, Lucía");
  });

  it("requires names and a course", () => {
    expect(() => validateStudent({ ...student, firstName: " " })).toThrow(
      DomainError,
    );
    expect(() => validateStudent({ ...student, courseId: "" })).toThrow(
      DomainError,
    );
    expect(() =>
      validateStudent({ ...student, guardianIds: ["a", "b", "c"] }),
    ).toThrow(DomainError);
    expect(() => validateStudent(student)).not.toThrow();
  });
});
