const STORAGE_KEY = "more-news:visible-sources";

/** Medios que el usuario quiere ver en pestañas y en «Todos». */
export function getVisibleSourceIds(allIds: string[]): Set<string> {
  if (typeof window === "undefined") return new Set(allIds);

  let stored: string[] | undefined;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) stored = JSON.parse(raw) as string[];
  } catch {
    stored = undefined;
  }

  if (!stored?.length) return new Set(allIds);

  const visible = new Set<string>();
  for (const id of stored) {
    if (allIds.includes(id)) visible.add(id);
  }
  for (const id of allIds) {
    if (!stored.includes(id)) visible.add(id);
  }
  return visible;
}

export function setVisibleSourceIds(ids: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function mergeFeedBySource<
  T extends { source: { id: string; name: string }; headlines: unknown[]; hiddenCount: number; error?: string },
>(
  bySource: T[],
  allSources: { id: string; name: string; enabled?: boolean }[],
): T[] {
  const byId = new Map(bySource.map((row) => [row.source.id, row]));
  return allSources.map((src) => {
    const existing = byId.get(src.id);
    if (existing) return existing;
    return {
      source: { id: src.id, name: src.name },
      headlines: [],
      hiddenCount: 0,
      error:
        src.enabled === false
          ? "RSS no disponible desde el servidor (bloqueado o URL pendiente)"
          : "Sin datos en esta carga; pulsa Actualizar",
    } as T;
  });
}
