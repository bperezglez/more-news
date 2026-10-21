import type { Headline, ReadableFeed, ReadableHeadline } from "./types";

/** Mismo orden que el análisis: 1.º titular de cada medio, luego el 2.º, etc. */
export function interleavePortadaHeadlines(buckets: Headline[][]): Headline[] {
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

export function sortPortadaBySequence(headlines: ReadableHeadline[]): ReadableHeadline[] {
  return [...headlines].sort((a, b) => {
    const sa = a.sequence ?? a.feedRank ?? 999;
    const sb = b.sequence ?? b.feedRank ?? 999;
    if (sa !== sb) return sa - sb;
    const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return tb - ta;
  });
}

/** Orden de resolución de acceso (ids) a partir del feed de portada. */
export function portadaResolutionOrderIds(feed: ReadableFeed): string[] {
  const buckets = feed.bySource.map((row) =>
    [...row.headlines].sort((a, b) => (a.feedRank ?? 999) - (b.feedRank ?? 999)),
  );
  return interleavePortadaHeadlines(buckets).map((h) => h.id);
}
