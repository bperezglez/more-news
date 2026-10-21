import type Parser from "rss-parser";
import type { NewspaperSource } from "./types";
import { getAllPrincipalSources } from "./sources";
import {
  itemHasArticleLink,
  normalizeCategories,
  pickImage,
  fetchRssFeed,
  normalizeRssText,
} from "./rss-client";
import type { RawFeedItem, RawFeedsSnapshot, RawFeedSourceSnapshot } from "./types";

export type FetchRawFeedsOptions = {
  /** Máximo de ítems por medio (orden del RSS). Sin límite si se omite. */
  limitPerSource?: number;
};

type ParserItem = Parser.Item & Record<string, unknown>;

function mapRawItem(item: ParserItem, feedRank: number): Omit<RawFeedItem, "filteredRank" | "includedInAppFeed" | "analyzedInReadableFeed"> {
  const passesFilter = itemHasArticleLink(item);
  const summary = normalizeRssText(item.contentSnippet?.trim() || item.summary?.trim());
  const content = item.content || item["content:encoded"];
  return {
    feedRank,
    title: normalizeRssText(item.title ?? "Sin título") ?? "Sin título",
    link: (item.link ?? item.guid ?? "").trim(),
    guid: typeof item.guid === "string" ? item.guid : undefined,
    summary,
    summaryLength: summary?.length,
    hasFullContent: typeof content === "string" && content.length > 0,
    contentLength: typeof content === "string" ? content.length : undefined,
    publishedAt: item.isoDate ?? item.pubDate,
    isoDate: item.isoDate,
    pubDate: item.pubDate,
    imageUrl: pickImage(item),
    categories: normalizeCategories(item),
    creator: typeof item.creator === "string" ? item.creator.trim() : undefined,
    passesFilter,
  };
}

function attachAppLimits(
  items: Omit<RawFeedItem, "filteredRank" | "includedInAppFeed" | "analyzedInReadableFeed">[],
  headlinesPerSourceBudget: number,
): RawFeedItem[] {
  let filteredRank = 0;
  return items.map((item) => {
    const rankAfterFilter = item.passesFilter ? filteredRank++ : undefined;
    return {
      ...item,
      filteredRank: rankAfterFilter,
      includedInAppFeed: rankAfterFilter !== undefined && rankAfterFilter < 40,
      analyzedInReadableFeed:
        rankAfterFilter !== undefined && rankAfterFilter < headlinesPerSourceBudget,
    };
  });
}

export async function fetchRawFeedForSource(
  source: NewspaperSource,
  options: FetchRawFeedsOptions = {},
): Promise<RawFeedSourceSnapshot> {
  const { limitPerSource } = options;
  const headlinesPerSourceBudget = headlinesPerSourceForCount(getAllPrincipalSources().length);

  try {
    const feed = await fetchRssFeed(source.feedUrl);
    const allItems = feed.items ?? [];
    const sliced =
      limitPerSource !== undefined ? allItems.slice(0, limitPerSource) : allItems;

    const baseItems = sliced.map((item, feedRank) =>
      mapRawItem(item as unknown as ParserItem, feedRank),
    );
    const items = attachAppLimits(baseItems, headlinesPerSourceBudget);
    const passing = items.filter((i) => i.passesFilter);

    return {
      source: {
        id: source.id,
        name: source.name,
        feedUrl: source.feedUrl,
        website: source.website,
        accent: source.accent,
      },
      feedTitle: feed.title,
      feedLink: feed.link,
      feedDescription: feed.description,
      feedUpdated: feed.lastBuildDate ?? feed.pubDate,
      totalItemsInXml: allItems.length,
      exportedItemCount: items.length,
      itemsPassingFilter: passing.length,
      itemsInAppSlice: Math.min(passing.length, 40),
      headlinesPerSourceBudget,
      items,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return {
      source: {
        id: source.id,
        name: source.name,
        feedUrl: source.feedUrl,
        website: source.website,
        accent: source.accent,
      },
      totalItemsInXml: 0,
      exportedItemCount: 0,
      itemsPassingFilter: 0,
      itemsInAppSlice: 0,
      headlinesPerSourceBudget,
      items: [],
      error: message,
    };
  }
}

/** Misma fórmula que build-feed (titulares analizados por medio). */
export function headlinesPerSourceForCount(sourceCount: number): number {
  return Math.min(25, Math.max(8, Math.floor(200 / Math.max(sourceCount, 1))));
}

export async function fetchRawFeedsSnapshot(
  options: FetchRawFeedsOptions = {},
): Promise<RawFeedsSnapshot> {
  const sources = getAllPrincipalSources();
  const bySource = await Promise.all(
    sources.map(async (source): Promise<RawFeedSourceSnapshot> => {
      if (source.enabled === false) {
        return {
          source: {
            id: source.id,
            name: source.name,
            feedUrl: source.feedUrl,
            website: source.website,
            accent: source.accent,
          },
          totalItemsInXml: 0,
          exportedItemCount: 0,
          itemsPassingFilter: 0,
          itemsInAppSlice: 0,
          headlinesPerSourceBudget: headlinesPerSourceForCount(sources.length),
          items: [],
          error: "RSS no disponible desde el servidor (bloqueado o URL pendiente)",
        };
      }
      return fetchRawFeedForSource(source, options);
    }),
  );

  return { bySource, fetchedAt: new Date().toISOString() };
}
