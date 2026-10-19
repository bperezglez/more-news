import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import type { ArticleContent } from "./types";

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "es-ES,es;q=0.9",
};

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    const host = parsed.hostname.toLowerCase();
    const blocked =
      host === "localhost" ||
      host.startsWith("127.") ||
      host.startsWith("10.") ||
      host.endsWith(".local");
    return !blocked;
  } catch {
    return false;
  }
}

export async function fetchArticleContent(url: string): Promise<ArticleContent> {
  if (!isAllowedUrl(url)) {
    throw new Error("URL no válida");
  }

  const response = await fetch(url, {
    headers: FETCH_HEADERS,
    redirect: "follow",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`No se pudo cargar el artículo (${response.status})`);
  }

  const html = await response.text();
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  if (!article?.content) {
    throw new Error(
      "No se pudo extraer el contenido. Abre la noticia en el periódico original.",
    );
  }

  return {
    title: article.title ?? "Artículo",
    content: article.content,
    excerpt: article.excerpt ?? undefined,
    byline: article.byline ?? undefined,
    siteName: article.siteName ?? undefined,
    sourceUrl: url,
  };
}
