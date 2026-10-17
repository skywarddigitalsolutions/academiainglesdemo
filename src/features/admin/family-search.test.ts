import { describe, expect, it } from "vitest";
import { familiesInCourse, searchFamilies } from "./family-search";

const items = [
  {
    parent: { firstName: "Marcela", lastName: "Gómez", username: "mgomez" },
    children: [
      { id: "s1", firstName: "Benjamín", lastName: "Martínez", courseId: "c-2a" },
      { id: "s2", firstName: "Lucía", lastName: "Martínez", courseId: "c-5a" },
    ],
  },
  {
    parent: { firstName: "Jorge", lastName: "Romero", username: "jromero" },
    children: [{ id: "s3", firstName: "Tomás", lastName: "Romero", courseId: "c-5a" }],
  },
  {
    parent: { firstName: "Ana", lastName: "Pérez", username: "aperez" },
    children: [],
  },
];

const names = (list: typeof items) => list.map((i) => i.parent.firstName);

describe("familiesInCourse", () => {
  it("keeps families with at least one child in the course", () => {
    expect(names(familiesInCourse(items, "c-2a"))).toEqual(["Marcela"]);
  });

  it("lists a family with children in several courses in each of them", () => {
    expect(names(familiesInCourse(items, "c-5a"))).toEqual(["Marcela", "Jorge"]);
  });

  it("returns nobody for a course without families", () => {
    expect(familiesInCourse(items, "c-9z")).toEqual([]);
  });
});

describe("searchFamilies", () => {
  it("returns nobody for an empty query", () => {
    expect(searchFamilies(items, "  ")).toEqual([]);
  });

  it("matches the guardian name ignoring case and accents", () => {
    expect(names(searchFamilies(items, "GOMEZ"))).toEqual(["Marcela"]);
    expect(names(searchFamilies(items, "perez ana"))).toEqual(["Ana"]);
  });

  it("matches the username", () => {
    expect(names(searchFamilies(items, "jromero"))).toEqual(["Jorge"]);
  });

  it("matches a child's name", () => {
    expect(names(searchFamilies(items, "lucia"))).toEqual(["Marcela"]);
    expect(names(searchFamilies(items, "tomas"))).toEqual(["Jorge"]);
  });
});
