const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
const absolute = new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" });

/** «hace 5 min», «hace 3 h», «ayer»… y fecha absoluta pasadas 48 h. */
export function formatRelative(iso?: string, now?: number): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  const minutes = Math.round((t - (now ?? Date.now())) / 60000);
  if (Math.abs(minutes) < 1) return "ahora";
  if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return rtf.format(hours, "hour");
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 2) return rtf.format(days, "day");
  return absolute.format(t);
}

export function formatAbsolute(iso?: string): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : absolute.format(t);
}
