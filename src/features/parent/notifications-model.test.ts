import { describe, expect, it } from "vitest";
import type { ParentNotification } from "@/application/notifications";
import {
  markAllRead,
  notificationHref,
  notificationText,
  parseReadIds,
  relativeDay,
  unreadCount,
} from "./notifications-model";

const reportCard: ParentNotification = {
  id: "report-card:s-1:2",
  kind: "report-card",
  studentId: "s-1",
  studentName: "Sofía",
  bimester: 2,
  publishedAt: "2026-10-19T12:00:00.000Z",
};
const examGrade: ParentNotification = {
  id: "exam:s-8:e1",
  kind: "exam-grade",
  studentId: "s-8",
  studentName: "Tomás",
  examId: "e1",
  topic: "Past simple",
  grade: 7.5,
  publishedAt: "2026-10-17T12:00:00.000Z",
};
const conceptual: ParentNotification = { ...examGrade, id: "exam:s-1:e2", grade: "Muy bien" };

describe("notification text and links", () => {
  it("names the boletín, the child and the bimester", () => {
    expect(notificationText(reportCard)).toBe("Se publicó el boletín del 2° Bimestre de Sofía");
    expect(notificationHref(reportCard)).toBe("/parent/report-cards/s-1");
  });

  it("shows the exam grade as the app does: comma decimals or the conceptual label", () => {
    expect(notificationText(examGrade)).toBe(
      "Se publicó la nota del examen Past simple de Tomás: 7,5",
    );
    expect(notificationText(conceptual)).toContain(": Muy bien");
    expect(notificationHref(examGrade)).toBe("/parent/report-cards/s-8#examenes");
  });
});

describe("relativeDay", () => {
  it("speaks in days for the last week and in dates after that", () => {
    const today = "2026-10-19";
    expect(relativeDay("2026-10-19T08:00:00.000Z", today)).toBe("Hoy");
    expect(relativeDay("2026-10-18T08:00:00.000Z", today)).toBe("Ayer");
    expect(relativeDay("2026-10-16T08:00:00.000Z", today)).toBe("Hace 3 días");
    expect(relativeDay("2026-09-02T08:00:00.000Z", today)).toBe("02/09/2026");
  });
});

describe("read state", () => {
  it("ignores unreadable stored values", () => {
    expect(parseReadIds(null)).toEqual([]);
    expect(parseReadIds("not json")).toEqual([]);
    expect(parseReadIds('{"a":1}')).toEqual([]);
    expect(parseReadIds('["a",3,"b"]')).toEqual(["a", "b"]);
  });

  it("counts unread ones and marks everything as read", () => {
    const list = [reportCard, examGrade, conceptual];
    expect(unreadCount(list, [])).toBe(3);
    expect(unreadCount(list, ["exam:s-8:e1"])).toBe(2);
    expect(unreadCount(list, markAllRead(list, ["old"]))).toBe(0);
    expect(markAllRead(list, ["old"])).toContain("old");
  });
});
