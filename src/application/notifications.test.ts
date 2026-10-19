import { describe, expect, it } from "vitest";
import type { Exam } from "@/domain/exam";
import { createEmptyReportCard, publishBimester, updateBimester } from "@/domain/report-card";
import type { Student } from "@/domain/student";
import { buildParentNotifications } from "./notifications";

const student = {
  id: "s-1",
  firstName: "Sofía",
  lastName: "Romero",
  courseId: "c-1",
  guardianIds: ["p-1"],
} as Student;

function exam(id: string, publishedAt: string | null, grades: Exam["grades"]): Exam {
  return {
    id,
    courseId: "c-1",
    year: 2026,
    bimester: 1,
    date: "2026-04-10",
    type: "written",
    topic: `Topic ${id}`,
    grades,
    publishedAt,
    createdAt: "2026-03-01T10:00:00.000Z",
    updatedAt: "2026-03-01T10:00:00.000Z",
  };
}

function cardWithPublished(bimester: 1 | 2, at: string) {
  const base = createEmptyReportCard({ id: "rc-1", studentId: "s-1", courseId: "c-1", year: 2026 });
  const filled = updateBimester(base, bimester, { applicationGrade: 8, conductGrade: "Muy bien" }, "numeric");
  return publishBimester(filled, bimester, new Date(at));
}

describe("buildParentNotifications", () => {
  it("lists published report cards and published exam grades, newest first", () => {
    const list = buildParentNotifications([
      {
        student,
        card: cardWithPublished(1, "2026-05-10T12:00:00.000Z"),
        exams: [exam("e1", "2026-04-20T12:00:00.000Z", { "s-1": 7 })],
      },
    ]);
    expect(list.map((n) => n.id)).toEqual(["report-card:s-1:1", "exam:s-1:e1"]);
    expect(list[0]).toMatchObject({ kind: "report-card", studentName: "Sofía", bimester: 1 });
    expect(list[1]).toMatchObject({ kind: "exam-grade", topic: "Topic e1", grade: 7 });
  });

  it("never announces unpublished exams or exams where the child has no grade", () => {
    const list = buildParentNotifications([
      {
        student,
        card: createEmptyReportCard({ id: "rc-1", studentId: "s-1", courseId: "c-1", year: 2026 }),
        exams: [exam("draft", null, { "s-1": 9 }), exam("nograde", "2026-04-20T12:00:00.000Z", {})],
      },
    ]);
    expect(list).toEqual([]);
  });

  it("keeps only the most recent ones when a limit is given", () => {
    const list = buildParentNotifications(
      [
        {
          student,
          card: cardWithPublished(2, "2026-06-01T12:00:00.000Z"),
          exams: [
            exam("e1", "2026-04-20T12:00:00.000Z", { "s-1": 7 }),
            exam("e2", "2026-05-20T12:00:00.000Z", { "s-1": 8 }),
          ],
        },
      ],
      2,
    );
    expect(list.map((n) => n.id)).toEqual(["report-card:s-1:2", "exam:s-1:e2"]);
  });
});
