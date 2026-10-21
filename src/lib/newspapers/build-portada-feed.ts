import { fetchRawFeedsSnapshot } from "./fetch-raw-feeds";
import { stableHeadlineId } from "./headline-id";
import { isReadableInApp, sortPortadaTodosFeed } from "./headline-rank";
import {
  headlineCandidates,
  READABLE_FEED_BUDGET_MS,
  resolveReadableHeadlines,
} from "./readable-feed-resolve";
import { getAllPrincipalSources } from "./sources";
import type {
  Headline,
  RawFeedItem,
  RawFeedSourceSnapshot,
  ReadableFeed,
  SourceSummary,
} from "./types";

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

/**
 * Construye el mismo tipo de feed legible que la home, pero los titulares salen
 * del RSS en orden de portada (filteredRank) y el listado global respeta esa jerarquía.
 */
export async function buildReadablePortadaFeed(
  options: BuildPortadaFeedOptions = {},
): Promise<ReadableFeed> {
  const limitPerSource = options.limitPerSource ?? 40;
  const deadline = Date.now() + READABLE_FEED_BUDGET_MS;
  const raw = await fetchRawFeedsSnapshot({ limitPerSource });

  const headlines: Headline[] = raw.bySource.flatMap((row) =>
    row.items.filter((i) => i.passesFilter).map((item) => rawItemToHeadline(item, row.source)),
  );

  const pool = headlineCandidates(headlines);
  const all = await resolveReadableHeadlines(headlines, pool, deadline);
  const readable = all.filter(isReadableInApp);

  const principalIds = new Set(getAllPrincipalSources().map((s) => s.id));

  const bySource: SourceSummary[] = raw.bySource
    .filter((row) => principalIds.has(row.source.id))
    .map((row) => {
      const sourceAll = all
        .filter((h) => h.sourceId === row.source.id)
        .sort(comparePortadaRank);
      const sourceReadable = readable
        .filter((h) => h.sourceId === row.source.id)
        .sort(comparePortadaRank);
      return {
        source: { id: row.source.id, name: row.source.name },
        headlines: sourceReadable,
        hiddenCount: sourceAll.length - sourceReadable.length,
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
