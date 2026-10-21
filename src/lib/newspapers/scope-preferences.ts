import type { CanariasZone, SourceScope } from "./types";

const SCOPE_KEY = "more-news:scope-tab";
const CANARIAS_ZONE_KEY = "more-news:canarias-zone";

export const ALL_CANARIAS_ZONES = "todas" as const;
export type CanariasZoneFilter = CanariasZone | typeof ALL_CANARIAS_ZONES;

export function loadScopeTab(): SourceScope {
  if (typeof window === "undefined") return "national";
  try {
    const raw = localStorage.getItem(SCOPE_KEY);
    if (raw === "canarias" || raw === "national") return raw;
  } catch {
    /* ignore */
  }
  return "national";
}

export function saveScopeTab(scope: SourceScope): void {
  localStorage.setItem(SCOPE_KEY, scope);
}

export function loadCanariasZoneFilter(): CanariasZoneFilter {
  if (typeof window === "undefined") return ALL_CANARIAS_ZONES;
  try {
    const raw = localStorage.getItem(CANARIAS_ZONE_KEY);
    if (raw === ALL_CANARIAS_ZONES) return ALL_CANARIAS_ZONES;
    if (raw) return raw as CanariasZone;
  } catch {
    /* ignore */
  }
  return ALL_CANARIAS_ZONES;
}

export function saveCanariasZoneFilter(zone: CanariasZoneFilter): void {
  localStorage.setItem(CANARIAS_ZONE_KEY, zone);
}
