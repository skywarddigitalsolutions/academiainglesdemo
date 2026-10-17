import { describe, expect, it } from "vitest";
import { formatSchedule, parseSchedule, validateCourse, type Course } from "./course";
import { DomainError } from "./errors";

const base: Course = {
  id: "c-x",
  name: "3° Grado B",
  gradingType: "numeric",
  teacherIds: [],
  nextCourseName: "4° Grado B",
  schedule: "Lunes y miércoles · 14:00 a 15:30",
};

describe("course schedule", () => {
  it("formats days and times in the shape used by the seed", () => {
    expect(formatSchedule({ days: " Lunes y miércoles ", start: "14:00", end: "15:30" })).toBe(
      "Lunes y miércoles · 14:00 a 15:30",
    );
  });

  it("parses a stored schedule back into its parts", () => {
    expect(parseSchedule("Martes y jueves · 15:00 a 16:30")).toEqual({
      days: "Martes y jueves",
      start: "15:00",
      end: "16:30",
    });
    expect(parseSchedule("Sábados")).toEqual({ days: "Sábados", start: "", end: "" });
  });

  it("rejects a schedule that ends before it starts", () => {
    expect(() => formatSchedule({ days: "Lunes", start: "15:00", end: "14:00" })).toThrow(
      DomainError,
    );
  });

  it("requires the days and both times", () => {
    expect(() => formatSchedule({ days: " ", start: "14:00", end: "15:00" })).toThrow(DomainError);
    expect(() => formatSchedule({ days: "Lunes", start: "", end: "15:00" })).toThrow(DomainError);
  });
});

describe("validateCourse", () => {
  it("accepts a valid course and trims the name", () => {
    expect(validateCourse({ ...base, name: "  3° Grado B " }).name).toBe("3° Grado B");
  });

  it("requires a name, a schedule and a known grading type", () => {
    expect(() => validateCourse({ ...base, name: " " })).toThrow(DomainError);
    expect(() => validateCourse({ ...base, schedule: "" })).toThrow(DomainError);
    expect(() =>
      validateCourse({ ...base, gradingType: "letters" as Course["gradingType"] }),
    ).toThrow(DomainError);
  });

  it("removes duplicated teachers", () => {
    expect(validateCourse({ ...base, teacherIds: ["t1", "t1", "t2"] }).teacherIds).toEqual([
      "t1",
      "t2",
    ]);
  });
});
