import { describe, expect, it } from "vitest";
import {
  courseName,
  formatSchedule,
  gradingTypeFor,
  nextCourseNameFor,
  parseSchedule,
  schoolLevelLabel,
  validateCourse,
  yearsFor,
  type Course,
} from "./course";
import { DomainError } from "./errors";

const base: Course = {
  id: "c-x",
  name: "5° Grado B",
  level: "primary",
  year: 5,
  division: "B",
  gradingType: "numeric",
  teacherIds: [],
  nextCourseName: "6° Grado B",
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

describe("school levels", () => {
  it("builds the course name from level, year and division", () => {
    expect(courseName("primary", 2, "A")).toBe("2° Grado A");
    expect(courseName("secondary", 1, "B")).toBe("1° Año B");
  });

  it("labels the levels", () => {
    expect(schoolLevelLabel("primary")).toBe("Primaria");
    expect(schoolLevelLabel("secondary")).toBe("Secundaria");
  });

  it("lists 7 primary years and 5 secondary years", () => {
    expect(yearsFor("primary")).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(yearsFor("secondary")).toEqual([1, 2, 3, 4, 5]);
  });

  it("grades conceptually only the first four primary years", () => {
    expect(gradingTypeFor("primary", 1)).toBe("conceptual");
    expect(gradingTypeFor("primary", 4)).toBe("conceptual");
    expect(gradingTypeFor("primary", 5)).toBe("numeric");
    expect(gradingTypeFor("primary", 7)).toBe("numeric");
    expect(gradingTypeFor("secondary", 1)).toBe("numeric");
  });

  it("suggests the next year, and the first secondary year after 7° grado", () => {
    expect(nextCourseNameFor("primary", 2, "B")).toBe("3° Grado B");
    expect(nextCourseNameFor("primary", 7, "A")).toBe("1° Año A");
    expect(nextCourseNameFor("secondary", 5, "A")).toBe("");
  });
});

describe("validateCourse", () => {
  it("derives the name and grading type from level, year and division", () => {
    const course = validateCourse({
      ...base,
      name: "ignored",
      gradingType: "numeric",
      year: 2,
      division: "c",
    });
    expect(course).toMatchObject({ name: "2° Grado C", gradingType: "conceptual", division: "C" });
  });

  it("rejects years out of range for the level and invalid divisions", () => {
    expect(() => validateCourse({ ...base, level: "secondary", year: 6 })).toThrow(DomainError);
    expect(() => validateCourse({ ...base, year: 0 })).toThrow(DomainError);
    expect(() => validateCourse({ ...base, year: 8 })).toThrow(DomainError);
    expect(() => validateCourse({ ...base, year: 2.5 })).toThrow(DomainError);
    expect(() => validateCourse({ ...base, division: "AB" })).toThrow(DomainError);
    expect(() => validateCourse({ ...base, division: "" })).toThrow(DomainError);
    expect(() => validateCourse({ ...base, division: "1" })).toThrow(DomainError);
    expect(() => validateCourse({ ...base, level: "other" as Course["level"] })).toThrow(
      DomainError,
    );
  });

  it("requires a schedule", () => {
    expect(() => validateCourse({ ...base, schedule: "" })).toThrow(DomainError);
  });

  it("removes duplicated teachers", () => {
    expect(validateCourse({ ...base, teacherIds: ["t1", "t1", "t2"] }).teacherIds).toEqual([
      "t1",
      "t2",
    ]);
  });
});
