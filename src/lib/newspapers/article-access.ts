import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import { detectPaywall } from "./paywall";
import { isKnownSourceUrl } from "./sources";
import type { ArticleContent, OriginalAccess } from "./types";

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "es-ES,es;q=0.9",
};

/** Por debajo de esto suele ser una entradilla o un directo vacío, no una noticia completa. */
const MIN_ARTICLE_CHARS = 600;
const CACHE_TTL_MS = 30 * 60 * 1000;
const FETCH_TIMEOUT_MS = 6_000;

export type ArticleAnalysis = {
  access: OriginalAccess;
  article?: ArticleContent;
  detail?: string;
};

const cache = new Map<string, { at: number; value: Promise<ArticleAnalysis> }>();

function cacheKey(url: string): string {
  try {
    const u = new URL(url);
    u.hash = "";
    return u.toString();
  } catch {
    return url;
  }
}

function toArticleContent(url: string, parsed: NonNullable<ReturnType<Readability["parse"]>>): ArticleContent {
  return {
    title: parsed.title ?? "Artículo",
    content: parsed.content ?? "",
    excerpt: parsed.excerpt ?? undefined,
    byline: parsed.byline ?? undefined,
    siteName: parsed.siteName ?? undefined,
    sourceUrl: url,
  };
}

async function analyze(url: string): Promise<ArticleAnalysis> {
  if (!isKnownSourceUrl(url)) {
    return { access: "blocked", detail: "Dominio no configurado como fuente" };
  }

  let html: string;
  try {
    const response = await fetch(url, {
      headers: FETCH_HEADERS,
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok) {
      return { access: "blocked", detail: `HTTP ${response.status}` };
    }
    html = await response.text();
  } catch (err) {
    return {
      access: "blocked",
      detail: err instanceof Error ? err.message : "Error de red",
    };
  }

  const verdict = detectPaywall(html);

  let parsed: ReturnType<Readability["parse"]>;
  try {
    const { document } = parseHTML(html);
    parsed = new Readability(document).parse();
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Error al procesar la página";
    console.error(`[article-access] ${url}: ${detail}`);
    if (verdict.paywalled) {
      return { access: "paywalled", detail: verdict.reason };
    }
    return { access: "unextractable", detail };
  }

  const textLength = parsed?.textContent?.trim().length ?? 0;
  if (parsed?.content && textLength >= MIN_ARTICLE_CHARS) {
    const article = toArticleContent(url, parsed);
    if (verdict.paywalled) {
      return {
        access: "subscriber_readable",
        article,
        detail: verdict.reason,
      };
    }
    return { access: "free", article };
  }

  if (verdict.paywalled) {
    return { access: "paywalled", detail: verdict.reason };
  }

  return { access: "unextractable", detail: `${textLength} caracteres` };
}

export function analyzeArticle(url: string): Promise<ArticleAnalysis> {
  const key = cacheKey(url);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;

  const value = analyze(key);
  cache.set(key, { at: Date.now(), value });
  return value;
}

export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}
