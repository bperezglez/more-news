import Parser from "rss-parser";
import { createHash } from "crypto";
import type { Headline, NewspaperSource } from "./types";
import { getEnabledSources } from "./sources";

const parser = new Parser({
  timeout: 15000,
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: false }],
      ["media:thumbnail", "mediaThumbnail", { keepArray: false }],
    ],
  },
  headers: {
    "User-Agent":
      "MoreNews/1.0 (uso personal; agregador de titulares) Mozilla/5.0 compatible",
    Accept: "application/rss+xml, application/xml, text/xml, */*",
  },
});

function stableId(link: string, title: string): string {
  return createHash("sha256").update(`${link}|${title}`).digest("hex").slice(0, 16);
}

function pickImage(item: Parser.Item & Record<string, unknown>): string | undefined {
  const enclosure = item.enclosure;
  if (enclosure?.url && enclosure.type?.startsWith("image")) {
    return enclosure.url;
  }
  const media = item.mediaContent as { $?: { url?: string } } | undefined;
  if (media?.$?.url) return media.$.url;
  const thumb = item.mediaThumbnail as { $?: { url?: string } } | undefined;
  if (thumb?.$?.url) return thumb.$.url;
  const content = item.content || item["content:encoded"];
  if (typeof content === "string") {
    const match = content.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match?.[1]) return match[1];
  }
  return undefined;
}

export async function fetchHeadlinesForSource(
  source: NewspaperSource,
): Promise<Headline[]> {
  const feed = await parser.parseURL(source.feedUrl);
  return (feed.items ?? []).slice(0, 40).map((item) => ({
    id: stableId(item.link ?? item.guid ?? item.title ?? source.id, item.title ?? ""),
    title: (item.title ?? "Sin título").trim(),
    link: (item.link ?? item.guid ?? source.website).trim(),
    summary: item.contentSnippet?.trim() || item.summary?.trim(),
    publishedAt: item.isoDate ?? item.pubDate,
    imageUrl: pickImage(item as unknown as Parser.Item & Record<string, unknown>),
    sourceId: source.id,
    sourceName: source.name,
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
  const sources = getEnabledSources();
  const bySource = await Promise.all(
    sources.map(async (source): Promise<SourceFetchResult> => {
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
