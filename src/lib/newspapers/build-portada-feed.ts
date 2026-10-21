import { fetchRawFeedsSnapshot } from "./fetch-raw-feeds";
import { stableHeadlineId } from "./headline-id";
import {
  PORTADA_ALTERNATIVE_POOL_PER_SOURCE,
  PORTADA_HEADLINES_PER_SOURCE,
} from "./portada-config";
import { interleavePortadaHeadlines, sortPortadaBySequence } from "./portada-order";
import { getAllPrincipalSources } from "./sources";
import type {
  Headline,
  RawFeedItem,
  RawFeedSourceSnapshot,
  ReadableFeed,
  ReadableHeadline,
  SourceSummary,
} from "./types";

export { PORTADA_HEADLINES_PER_SOURCE } from "./portada-config";

export type BuildPortadaFeedOptions = {
  /** Ítems del XML por medio (orden de portada). */
  limitPerSource?: number;
};

function rawItemToHeadline(
  item: RawFeedItem,
  source: RawFeedSourceSnapshot["source"],
): Headline {
  return {
    id: stableHeadlineId(item.link, item.title),
    title: item.title,
    link: item.link,
    summary: item.summary,
    publishedAt: item.publishedAt,
    imageUrl: item.imageUrl,
    sourceId: source.id,
    sourceName: source.name,
    feedRank: item.filteredRank ?? item.feedRank,
  };
}

function comparePortadaRank(a: Headline, b: Headline): number {
  const rankA = a.feedRank ?? 999;
  const rankB = b.feedRank ?? 999;
  if (rankA !== rankB) return rankA - rankB;
  const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
  const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
  return tb - ta;
}

function portadaHeadlinesForRow(
  row: RawFeedSourceSnapshot,
  limit: number,
): Headline[] {
  return row.items
    .filter((i) => i.passesFilter)
    .slice(0, limit)
    .map((item) => rawItemToHeadline(item, row.source));
}

function toPendingReadable(headline: Headline, sequence: number): ReadableHeadline {
  return { ...headline, originalAccess: "pending", sequence };
}

/**
 * Feed de portada solo con datos RSS (respuesta rápida). El acceso se resuelve en cliente.
 */
export async function buildPortadaFeedSkeleton(
  options: BuildPortadaFeedOptions = {},
): Promise<ReadableFeed> {
  const limitPerSource =
    options.limitPerSource ??
    Math.max(PORTADA_ALTERNATIVE_POOL_PER_SOURCE, PORTADA_HEADLINES_PER_SOURCE);
  const raw = await fetchRawFeedsSnapshot({ limitPerSource });

  const principalIds = new Set(getAllPrincipalSources().map((s) => s.id));
  const principalRows = raw.bySource.filter((row) => principalIds.has(row.source.id));

  const perSourceBuckets = principalRows.map((row) =>
    portadaHeadlinesForRow(row, PORTADA_HEADLINES_PER_SOURCE),
  );
  const interleaved = interleavePortadaHeadlines(perSourceBuckets);
  const headlines = interleaved.map((h, sequence) => toPendingReadable(h, sequence));

  const byId = new Map(headlines.map((h) => [h.id, h]));

  const poolById = new Map<string, Headline>();
  for (const row of principalRows) {
    for (const h of portadaHeadlinesForRow(row, PORTADA_ALTERNATIVE_POOL_PER_SOURCE)) {
      poolById.set(h.id, h);
    }
  }
  for (const h of headlines) {
    poolById.set(h.id, h);
  }

  const bySource: SourceSummary[] = principalRows.map((row, rowIndex) => {
    const fromRow = perSourceBuckets[rowIndex]
      .map((h) => byId.get(h.id)!)
      .filter(Boolean);

    return {
      source: { id: row.source.id, name: row.source.name },
      headlines: fromRow,
      hiddenCount: 0,
      error: row.error,
    };
  });

  return {
    headlines: sortPortadaBySequence(headlines),
    bySource,
    alternativePool: [...poolById.values()],
    fetchedAt: new Date().toISOString(),
    progressiveAccess: true,
  };
}

const FEED_TTL_MS = 15 * 60 * 1000;
let cached: { at: number; value: Promise<ReadableFeed> } | undefined;

export function getPortadaFeedSkeleton(): Promise<ReadableFeed> {
  if (cached && Date.now() - cached.at < FEED_TTL_MS) return cached.value;
  const value = buildPortadaFeedSkeleton();
  cached = { at: Date.now(), value };
  value.catch(() => {
    if (cached?.value === value) cached = undefined;
  });
  return value;
}

/** @deprecated Usar getPortadaFeedSkeleton; el acceso se resuelve en cliente. */
export const getReadablePortadaFeed = getPortadaFeedSkeleton;
export const buildReadablePortadaFeed = buildPortadaFeedSkeleton;
