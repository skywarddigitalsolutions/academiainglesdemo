const TIME_ZONE = "America/Argentina/Buenos_Aires";

const dateTimeFormat = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
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

export function bimesterLabel(n: number): string {
  return `${n}° Bimestre`;
}
