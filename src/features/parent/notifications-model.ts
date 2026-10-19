import type { ParentNotification } from "@/application/notifications";
import { formatGrade } from "@/domain/grading";
import { bimesterLabel, formatDay } from "@/lib/format";

/*
 * Wording, links and read state of the family notifications. Pure: the bell
 * component only stores and reads the list of read ids.
 */

export function notificationText(n: ParentNotification): string {
  return n.kind === "report-card"
    ? `Se publicó el boletín del ${bimesterLabel(n.bimester)} de ${n.studentName}`
    : `Se publicó la nota del examen ${n.topic} de ${n.studentName}: ${formatGrade(n.grade)}`;
}

/** Boletín page of the child; exam grades live in its "examenes" section. */
export function notificationHref(n: ParentNotification): string {
  const page = `/parent/report-cards/${n.studentId}`;
  return n.kind === "report-card" ? page : `${page}#examenes`;
}

function daysBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000);
}

/** "Hoy", "Ayer", "Hace 3 días" for the last week, the date after that. */
export function relativeDay(publishedAt: string, today: string): string {
  const day = publishedAt.slice(0, 10);
  const ago = daysBetween(day, today);
  if (ago <= 0) return "Hoy";
  if (ago === 1) return "Ayer";
  if (ago <= 7) return `Hace ${ago} días`;
  return formatDay(day);
}

export function notificationsStorageKey(parentId: string): string {
  return `academia.parent.notifications-read:${parentId}`;
}

/** Stored read ids -> list; anything unexpected means nothing is read yet. */
export function parseReadIds(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function unreadCount(list: ParentNotification[], readIds: string[]): number {
  return list.filter((n) => !readIds.includes(n.id)).length;
}

export function markAllRead(list: ParentNotification[], readIds: string[]): string[] {
  return [...new Set([...readIds, ...list.map((n) => n.id)])];
}
