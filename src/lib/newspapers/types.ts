export type NewspaperId = string;

/**
 * - `principal`: sus titulares aparecen en el listado.
 * - `contraste`: solo se usa para buscar la misma noticia en abierto.
 */
export type SourceRole = "principal" | "contraste";

export interface NewspaperSource {
  id: NewspaperId;
  name: string;
  feedUrl: string;
  website: string;
  /** Color de acento en la UI (hex) */
  accent: string;
  role: SourceRole;
  enabled?: boolean;
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

/** Por qué no se puede leer el original dentro de la app. */
export type OriginalAccess = "free" | "paywalled" | "blocked" | "unextractable";

export interface AlternativeCoverage {
  link: string;
  title: string;
  sourceId: NewspaperId;
  sourceName: string;
  similarity: number;
}

export interface ReadableHeadline extends Headline {
  originalAccess: OriginalAccess;
  /** Presente cuando el original no es legible y se lee la cobertura de otro medio. */
  alternative?: AlternativeCoverage;
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
}

export interface ArticleContent {
  title: string;
  content: string;
  excerpt?: string;
  byline?: string;
  siteName?: string;
  sourceUrl: string;
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
