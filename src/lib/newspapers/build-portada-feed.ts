import { fetchRawFeedsSnapshot } from "./fetch-raw-feeds";
import { stableHeadlineId } from "./headline-id";
import { sortPortadaTodosFeed } from "./headline-rank";
import {
  headlineCandidates,
  READABLE_FEED_BUDGET_MS,
  resolveReadableHeadlines,
} from "./readable-feed-resolve";
import { PORTADA_HEADLINES_PER_SOURCE } from "./portada-config";
import { getAllPrincipalSources } from "./sources";
import type {
  Headline,
  RawFeedItem,
  RawFeedSourceSnapshot,
  ReadableFeed,
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

/** Analiza primero el titular #1 de cada medio, luego el #2, etc. (carga escalonada justa). */
function interleavePortadaHeadlines(buckets: Headline[][]): Headline[] {
  const maxLen = buckets.reduce((m, b) => Math.max(m, b.length), 0);
  const out: Headline[] = [];
  for (let rank = 0; rank < maxLen; rank++) {
    for (const bucket of buckets) {
      const h = bucket[rank];
      if (h) out.push(h);
    }
  }
  return out;
}

function portadaHeadlinesForRow(row: RawFeedSourceSnapshot): Headline[] {
  return row.items
    .filter((i) => i.passesFilter)
    .slice(0, PORTADA_HEADLINES_PER_SOURCE)
    .map((item) => rawItemToHeadline(item, row.source));
}

/**
 * Construye el mismo tipo de feed legible que la home, pero los titulares salen
 * del RSS en orden de portada (filteredRank) y el listado global respeta esa jerarquía.
 */
export async function buildReadablePortadaFeed(
  options: BuildPortadaFeedOptions = {},
): Promise<ReadableFeed> {
  const limitPerSource =
    options.limitPerSource ?? Math.max(PORTADA_HEADLINES_PER_SOURCE, 20);
  const deadline = Date.now() + READABLE_FEED_BUDGET_MS;
  const raw = await fetchRawFeedsSnapshot({ limitPerSource });

  const principalIds = new Set(getAllPrincipalSources().map((s) => s.id));
  const principalRows = raw.bySource.filter((row) => principalIds.has(row.source.id));

  const perSourceBuckets = principalRows.map(portadaHeadlinesForRow);
  const headlines = perSourceBuckets.flat();
  const toAnalyze = interleavePortadaHeadlines(perSourceBuckets);

  const pool = headlineCandidates(headlines);
  const all = await resolveReadableHeadlines(toAnalyze, pool, deadline);

  const bySource: SourceSummary[] = principalRows.map((row) => {
    const sourceAll = all
      .filter((h) => h.sourceId === row.source.id)
      .sort(comparePortadaRank)
      .slice(0, PORTADA_HEADLINES_PER_SOURCE);
    return {
      source: { id: row.source.id, name: row.source.name },
      headlines: sourceAll,
      hiddenCount: 0,
      error: row.error,
    };
  });

  return {
    headlines: sortPortadaTodosFeed(all),
    bySource,
    fetchedAt: new Date().toISOString(),
  };
}

const FEED_TTL_MS = 15 * 60 * 1000;
let cached: { at: number; value: Promise<ReadableFeed> } | undefined;

export function getReadablePortadaFeed(): Promise<ReadableFeed> {
  if (cached && Date.now() - cached.at < FEED_TTL_MS) return cached.value;
  const value = buildReadablePortadaFeed();
  cached = { at: Date.now(), value };
  value.catch(() => {
    if (cached?.value === value) cached = undefined;
  });
  return value;
}
