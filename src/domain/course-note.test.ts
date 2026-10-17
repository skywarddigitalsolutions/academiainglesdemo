import { describe, expect, it } from "vitest";
import { createCourseNote, unreadNoteCount, type CourseNote } from "./course-note";
import { DomainError } from "./errors";

const NOW = new Date("2026-10-15T13:00:00.000Z");

function note(createdAt: string): CourseNote {
  return {
    id: createdAt,
    courseId: "c-5a",
    year: 2026,
    authorId: "u-admin",
    authorName: "María Elena Gutiérrez",
    createdAt,
    text: "x",
    period: null,
  };
}

describe("course note", () => {
  it("creates a note from Dirección, optionally tagged with a period", () => {
    expect(
      createCourseNote({
        id: "note-1",
        courseId: "c-5a",
        year: 2026,
        authorId: "u-admin",
        authorName: "María Elena Gutiérrez",
        text: "  Revisar las inasistencias.  ",
        period: 3,
        now: NOW,
      }),
    ).toEqual({
      id: "note-1",
      courseId: "c-5a",
      year: 2026,
      authorId: "u-admin",
      authorName: "María Elena Gutiérrez",
      createdAt: NOW.toISOString(),
      text: "Revisar las inasistencias.",
      period: 3,
    });
  });

  it("rejects empty or too long notes", () => {
    const base = {
      id: "n",
      courseId: "c-5a",
      year: 2026,
      authorId: "u-admin",
      authorName: "A",
      period: null,
      now: NOW,
    };
    expect(() => createCourseNote({ ...base, text: "   " })).toThrow(DomainError);
    expect(() => createCourseNote({ ...base, text: "a".repeat(1001) })).toThrow(DomainError);
  });

  it("counts the notes written after the teacher last opened the course", () => {
    const notes = [note("2026-10-01T10:00:00.000Z"), note("2026-10-10T10:00:00.000Z")];
    expect(unreadNoteCount(notes, null)).toBe(2);
    expect(unreadNoteCount(notes, "2026-10-05T00:00:00.000Z")).toBe(1);
    expect(unreadNoteCount(notes, "2026-10-11T00:00:00.000Z")).toBe(0);
  });
});
