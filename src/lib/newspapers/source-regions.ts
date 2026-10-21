import type { CanariasZone, NewspaperSource, SourceScope } from "./types";

export const SCOPE_LABELS: Record<SourceScope, string> = {
  national: "España e internacional",
  canarias: "Canarias",
};

export const CANARIAS_ZONE_LABELS: Record<CanariasZone, string> = {
  autonomico: "Autonómico",
  tenerife: "Tenerife",
  "las-palmas": "Gran Canaria",
  lanzarote: "Lanzarote",
  fuerteventura: "Fuerteventura",
  "la-palma": "La Palma",
  "la-gomera": "La Gomera",
  "el-hierro": "El Hierro",
  institucional: "Institucional",
};

/** Orden de las pastillas de zona en la pestaña Canarias. */
export const CANARIAS_ZONE_ORDER: CanariasZone[] = [
  "autonomico",
  "tenerife",
  "las-palmas",
  "lanzarote",
  "fuerteventura",
  "la-palma",
  "la-gomera",
  "el-hierro",
  "institucional",
];

export function getSourceScope(source: NewspaperSource): SourceScope {
  return source.scope ?? "national";
}

export function getCanariasZone(source: NewspaperSource): CanariasZone | undefined {
  return source.canariasZone;
}

export function filterSourcesByScope(
  sources: NewspaperSource[],
  scope: SourceScope,
): NewspaperSource[] {
  return sources.filter((s) => getSourceScope(s) === scope);
}

export function filterSourcesByCanariasZone(
  sources: NewspaperSource[],
  zone: CanariasZone,
): NewspaperSource[] {
  return sources.filter((s) => s.canariasZone === zone);
}

export function canariasZonesPresent(sources: NewspaperSource[]): CanariasZone[] {
  const present = new Set<CanariasZone>();
  for (const s of sources) {
    if (s.canariasZone) present.add(s.canariasZone);
  }
  return CANARIAS_ZONE_ORDER.filter((z) => present.has(z));
}
