import { describe, expect, it } from "vitest";
import { searchStudents } from "./student-search";

const items = [
  { student: { firstName: "Benjamín", lastName: "Martínez", courseId: "c-2a" } },
  { student: { firstName: "Tomás", lastName: "Romero", courseId: "c-5a" } },
  { student: { firstName: "Sofía", lastName: "Romero", courseId: "c-2a" } },
];

describe("searchStudents", () => {
  it("returns nobody for an empty query", () => {
    expect(searchStudents(items, "   ")).toEqual([]);
  });

  it("matches first or last name ignoring case and accents", () => {
    expect(searchStudents(items, "martinez").map((i) => i.student.firstName)).toEqual(["Benjamín"]);
    expect(searchStudents(items, "ROMERO").map((i) => i.student.firstName)).toEqual(["Tomás", "Sofía"]);
    expect(searchStudents(items, "sofia rom").map((i) => i.student.firstName)).toEqual(["Sofía"]);
  });

  it("matches every word of the query in any order", () => {
    expect(searchStudents(items, "romero tomas").map((i) => i.student.firstName)).toEqual(["Tomás"]);
  });
});
