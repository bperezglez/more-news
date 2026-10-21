import {
  fingerprint,
  SAME_STORY_THRESHOLD,
  storySimilarity,
  withinTimeWindow,
  type StoryFingerprint,
} from "./story-match";
import type { ReadableHeadline } from "./types";

export type StoryCluster = {
  id: string;
  headlines: ReadableHeadline[];
};

type Indexed = { headline: ReadableHeadline; print: StoryFingerprint; index: number };

function find(parent: number[], i: number): number {
  while (parent[i] !== i) {
    parent[i] = parent[parent[i]!]!;
    i = parent[i]!;
  }
  return i;
}

function unite(parent: number[], a: number, b: number) {
  const ra = find(parent, a);
  const rb = find(parent, b);
  if (ra !== rb) parent[rb] = ra;
}

/**
 * Agrupa titulares que cubren la misma noticia en distintos medios.
 * Reutiliza la heurística de `story-match` (sin llamadas de red).
 */
export function clusterCrossSourceStories(headlines: ReadableHeadline[]): StoryCluster[] {
  if (headlines.length < 2) {
    return headlines.map((h) => ({ id: h.id, headlines: [h] }));
  }

  const indexed: Indexed[] = headlines.map((headline, index) => ({
    headline,
    print: fingerprint(headline),
    index,
  }));

  const parent = indexed.map((x) => x.index);

  for (let i = 0; i < indexed.length; i++) {
    for (let j = i + 1; j < indexed.length; j++) {
      const a = indexed[i]!;
      const b = indexed[j]!;
      if (a.headline.sourceId === b.headline.sourceId) continue;
      if (!withinTimeWindow(a.headline.publishedAt, b.headline.publishedAt)) continue;
      if (storySimilarity(a.print, b.print) < SAME_STORY_THRESHOLD) continue;
      unite(parent, i, j);
    }
  }

  const buckets = new Map<number, ReadableHeadline[]>();
  for (const item of indexed) {
    const root = find(parent, item.index);
    const list = buckets.get(root) ?? [];
    list.push(item.headline);
    buckets.set(root, list);
  }

  const clusters: StoryCluster[] = [...buckets.values()].map((group) => {
    const sorted = [...group].sort((a, b) => {
      const sa = a.sequence ?? a.feedRank ?? 999;
      const sb = b.sequence ?? b.feedRank ?? 999;
      return sa - sb;
    });
    return { id: sorted.map((h) => h.id).join("|"), headlines: sorted };
  });

  clusters.sort((a, b) => {
    const order = (h: ReadableHeadline) => h.sequence ?? h.feedRank ?? 999;
    return order(a.headlines[0]!) - order(b.headlines[0]!);
  });

  return clusters;
}
