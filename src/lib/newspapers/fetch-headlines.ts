import type { Headline, NewspaperSource } from "./types";
import { getAllPrincipalSources } from "./sources";
import { stableHeadlineId } from "./headline-id";
import { fetchRssFeed, itemHasArticleLink, normalizeRssText, pickImage } from "./rss-client";

export async function fetchHeadlinesForSource(
  source: NewspaperSource,
): Promise<Headline[]> {
  const feed = await fetchRssFeed(source.feedUrl);
  const items = (feed.items ?? []).filter((item) => itemHasArticleLink(item));
  return items.slice(0, 40).map((item, feedRank) => ({
    id: stableHeadlineId(item.link ?? item.guid ?? item.title ?? source.id, item.title ?? ""),
    title: normalizeRssText(item.title ?? "Sin título") ?? "Sin título",
    link: (item.link ?? item.guid ?? source.website).trim(),
    summary: normalizeRssText(item.contentSnippet?.trim() || item.summary?.trim()),
    publishedAt: item.isoDate ?? item.pubDate,
    imageUrl: pickImage(item as unknown as Record<string, unknown> & typeof item),
    sourceId: source.id,
    sourceName: source.name,
    feedRank,
  }));
}

export type SourceFetchResult = {
  source: NewspaperSource;
  headlines: Headline[];
  error?: string;
};

export async function fetchAllHeadlines(): Promise<{
  headlines: Headline[];
  bySource: SourceFetchResult[];
}> {
  const sources = getAllPrincipalSources();
  const bySource = await Promise.all(
    sources.map(async (source): Promise<SourceFetchResult> => {
      if (source.enabled === false) {
        return {
          source,
          headlines: [],
          error: "RSS no disponible desde el servidor (bloqueado o URL pendiente)",
        };
      }
      try {
        const headlines = await fetchHeadlinesForSource(source);
        return { source, headlines };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error desconocido";
        return { source, headlines: [], error: message };
      }
    }),
  );

  const headlines = bySource
    .flatMap((r) => r.headlines)
    .sort((a, b) => {
      const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
      const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
      return tb - ta;
    });

  return { headlines, bySource };
}
