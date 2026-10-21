export type NewspaperId = string;

/**
 * - `principal`: sus titulares aparecen en el listado.
 * - `contraste`: solo se usa para buscar la misma noticia en abierto.
 */
export type SourceRole = "principal" | "contraste";

/** Ámbito del medio en la UI (pestañas de portada). */
export type SourceScope = "national" | "canarias";

/**
 * Agrupación dentro de Canarias: autonómico, cabeceras provinciales o prensa insular.
 */
export type CanariasZone =
  | "autonomico"
  | "tenerife"
  | "las-palmas"
  | "lanzarote"
  | "fuerteventura"
  | "la-palma"
  | "la-gomera"
  | "el-hierro"
  | "institucional";

export interface NewspaperSource {
  id: NewspaperId;
  name: string;
  feedUrl: string;
  website: string;
  /** Color de acento en la UI (hex) */
  accent: string;
  role: SourceRole;
  enabled?: boolean;
  /** Por defecto `national`. */
  scope?: SourceScope;
  /** Solo para `scope: "canarias"`. */
  canariasZone?: CanariasZone;
}

export interface Headline {
  id: string;
  title: string;
  link: string;
  summary?: string;
  publishedAt?: string;
  imageUrl?: string;
  sourceId: NewspaperId;
  sourceName: string;
  /** Posición en el feed RSS (0 = primer titular del medio). */
  feedRank?: number;
}

/**
 * Acceso al original. `subscriber_readable`: marcado de pago/suscripción en el HTML
 * pero con cuerpo suficiente extraíble para leer en la app.
 */
export type OriginalAccess =
  | "free"
  | "subscriber_readable"
  | "paywalled"
  | "blocked"
  | "unextractable";

/** Acceso aún no comprobado (portada con carga progresiva). */
export type AccessState = OriginalAccess | "pending";

export interface AlternativeCoverage {
  link: string;
  title: string;
  sourceId: NewspaperId;
  sourceName: string;
  similarity: number;
}

export interface ReadableHeadline extends Headline {
  originalAccess: AccessState;
  /** Presente cuando el original no es legible y se lee la cobertura de otro medio. */
  alternative?: AlternativeCoverage;
  /** Orden fijo de pintado/resolución en portada (intercalado por medio). */
  sequence?: number;
}

export interface SourceSummary {
  source: { id: NewspaperId; name: string };
  headlines: ReadableHeadline[];
  hiddenCount: number;
  error?: string;
}

export interface ReadableFeed {
  headlines: ReadableHeadline[];
  bySource: SourceSummary[];
  fetchedAt: string;
  /** El cliente resuelve acceso titular a titular vía API. */
  progressiveAccess?: boolean;
  /** Más titulares RSS por medio (solo cruce de cobertura gratuita, no se listan). */
  alternativePool?: Headline[];
}

export interface ArticleContent {
  title: string;
  content: string;
  excerpt?: string;
  byline?: string;
  siteName?: string;
  sourceUrl: string;
  /** Presente en respuestas de `/api/article` cuando el acceso no es `free` puro. */
  access?: OriginalAccess;
}

/** Ítem tal como viene en el RSS (orden de portada del medio). */
export interface RawFeedItem {
  /** Posición en el XML del RSS (0 = primer ítem del feed). */
  feedRank: number;
  title: string;
  link: string;
  guid?: string;
  summary?: string;
  summaryLength?: number;
  hasFullContent: boolean;
  contentLength?: number;
  publishedAt?: string;
  isoDate?: string;
  pubDate?: string;
  imageUrl?: string;
  categories?: string[];
  creator?: string;
  /** Enlace válido para artículo (filtro pathname). */
  passesFilter: boolean;
  /** Posición tras quitar enlaces inválidos; coincide con `feedRank` en Headline. */
  filteredRank?: number;
  /** Entraría en fetchHeadlinesForSource (top 40 tras filtro). */
  includedInAppFeed: boolean;
  /** Entraría en buildReadableFeed (top N tras filtro, N = presupuesto por medio). */
  analyzedInReadableFeed: boolean;
}

export interface RawFeedSourceSnapshot {
  source: Pick<NewspaperSource, "id" | "name" | "feedUrl" | "website" | "accent">;
  feedTitle?: string;
  feedLink?: string;
  feedDescription?: string;
  feedUpdated?: string;
  totalItemsInXml: number;
  exportedItemCount: number;
  itemsPassingFilter: number;
  itemsInAppSlice: number;
  headlinesPerSourceBudget: number;
  items: RawFeedItem[];
  error?: string;
}

export interface RawFeedsSnapshot {
  bySource: RawFeedSourceSnapshot[];
  fetchedAt: string;
}
