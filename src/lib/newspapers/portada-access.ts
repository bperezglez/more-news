import type { ReadableFeed, ReadableHeadline } from "./types";
import { sortPortadaBySequence } from "./portada-order";

export function isAccessPending(headline: ReadableHeadline): boolean {
  return headline.originalAccess === "pending";
}

export function applyPortadaAccessUpdates(
  feed: ReadableFeed,
  updates: Map<string, ReadableHeadline>,
): ReadableFeed {
  if (!updates.size) return feed;

  const patch = (h: ReadableHeadline): ReadableHeadline => {
    const next = updates.get(h.id);
    if (!next) return h;
    return { ...h, ...next, sequence: h.sequence };
  };

  return {
    ...feed,
    headlines: sortPortadaBySequence(feed.headlines.map(patch)),
    bySource: feed.bySource.map((row) => ({
      ...row,
      headlines: row.headlines.map(patch).sort((a, b) => (a.feedRank ?? 999) - (b.feedRank ?? 999)),
    })),
  };
}
