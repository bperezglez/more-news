import Parser from "rss-parser";
import { normalizeNewsText, readResponseText } from "./text-encoding";

const RSS_FETCH_HEADERS = {
  "User-Agent":
    "MoreNews/1.0 (uso personal; agregador de titulares) Mozilla/5.0 compatible",
  Accept: "application/rss+xml, application/xml, text/xml, */*",
};

export const rssParser = new Parser({
  timeout: 15000,
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: false }],
      ["media:thumbnail", "mediaThumbnail", { keepArray: false }],
    ],
  },
  headers: RSS_FETCH_HEADERS,
});

export function itemHasArticleLink(item: Parser.Item): boolean {
  if (!item.link) return false;
  try {
    return new URL(item.link).pathname.length > 1;
  } catch {
    return false;
  }
}

export function pickImage(item: Parser.Item & Record<string, unknown>): string | undefined {
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

export function normalizeCategories(item: Parser.Item): string[] | undefined {
  const raw = item.categories as unknown;
  if (!Array.isArray(raw) || !raw.length) return undefined;
  const flat = raw.flatMap((c: unknown) => {
    if (typeof c === "string") return [c.trim()];
    if (c && typeof c === "object" && "_" in c) {
      const label = (c as { _?: string })._;
      if (typeof label === "string") return [label.trim()];
    }
    return [];
  });
  const unique = [...new Set(flat.filter(Boolean))];
  return unique.length ? unique : undefined;
}

const RSS_FETCH_TIMEOUT_MS = 15_000;

/** Descarga RSS con charset correcto y parsea el XML. */
export async function fetchRssFeed(url: string) {
  const response = await fetch(url, {
    headers: RSS_FETCH_HEADERS,
    redirect: "follow",
    cache: "no-store",
    signal: AbortSignal.timeout(RSS_FETCH_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`RSS HTTP ${response.status}`);
  }
  const xml = await readResponseText(response);
  return rssParser.parseString(xml);
}

export function normalizeRssText(value: string | undefined): string | undefined {
  return normalizeNewsText(value);
}
