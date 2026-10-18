const TIME_ZONE = "America/Argentina/Buenos_Aires";

const dateTimeFormat = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: TIME_ZONE,
});

const dateFormat = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: TIME_ZONE,
});

export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return `${dateTimeFormat.format(new Date(iso))} h`;
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return dateFormat.format(new Date(iso));
}

const WEEKDAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"] as const;

/** Calendar day "yyyy-mm-dd" as "dd/mm/yyyy" (no time zone involved). */
export function formatDay(day: string): string {
  const [y, m, d] = day.split("-");
  return `${d}/${m}/${y}`;
}

/** Calendar day "yyyy-mm-dd" as "mar 20/10". */
export function formatDayShort(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${weekday} ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`;
}

export function bimesterLabel(n: number): string {
  return `${n}° Bimestre`;
}
