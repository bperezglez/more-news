import type { ReadableHeadline } from "./types";

/** Categoría de lectura para filtrar en la UI. */
export type AccessFilterKind = "free" | "via-alternative" | "no-read";

export const ACCESS_FILTER_KINDS: AccessFilterKind[] = [
  "free",
  "via-alternative",
  "no-read",
];

export const ACCESS_FILTER_LABELS: Record<AccessFilterKind, string> = {
  free: "En abierto",
  "via-alternative": "Vía otro medio",
  "no-read": "De pago o sin alternativa",
};

const STORAGE_KEY = "more-news:access-filters";

export function getHeadlineAccessKind(headline: ReadableHeadline): AccessFilterKind {
  if (headline.alternative) return "via-alternative";
  if (headline.originalAccess === "free") return "free";
  return "no-read";
}

/** Sin selección (null o vacío) = mostrar todos. Con selección = unión (OR). */
export function matchesAccessFilters(
  headline: ReadableHeadline,
  selected: Set<AccessFilterKind> | null,
): boolean {
  if (!selected?.size) return true;
  return selected.has(getHeadlineAccessKind(headline));
}

export function loadAccessFilters(): Set<AccessFilterKind> | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as unknown;
    if (!Array.isArray(stored)) return null;
    const valid = stored.filter((k): k is AccessFilterKind =>
      ACCESS_FILTER_KINDS.includes(k as AccessFilterKind),
    );
    return valid.length ? new Set(valid) : null;
  } catch {
    return null;
  }
}

export function saveAccessFilters(selected: Set<AccessFilterKind>): void {
  if (selected.size === 0) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...selected]));
}

export function shouldSplitReadableSections(
  selected: Set<AccessFilterKind> | null,
): boolean {
  if (!selected?.size) return true;
  const hasNoRead = selected.has("no-read");
  const hasReadable = selected.has("free") || selected.has("via-alternative");
  return hasNoRead && hasReadable;
}
