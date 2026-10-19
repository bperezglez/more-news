import { analyzeArticle, mapWithConcurrency } from "./article-access";
import { fetchAllHeadlines } from "./fetch-headlines";
import {
  fingerprint,
  SAME_STORY_THRESHOLD,
  storySimilarity,
  withinTimeWindow,
  type StoryFingerprint,
} from "./story-match";
import type {
  AlternativeCoverage,
  Headline,
  ReadableFeed,
  ReadableHeadline,
  SourceSummary,
} from "./types";

/** Cuántos titulares por medio principal se analizan; el resto se descarta. */
const HEADLINES_PER_SOURCE = 30;
/** Candidatos alternativos que se llegan a abrir antes de dar la noticia por no legible. */
const MAX_CANDIDATES = 3;
const CONCURRENCY = 8;
const FEED_TTL_MS = 15 * 60 * 1000;

type Candidate = { headline: Headline; print: StoryFingerprint };

async function findAlternative(
  headline: Headline,
  pool: Candidate[],
): Promise<AlternativeCoverage | undefined> {
  const print = fingerprint(headline);
  const ranked = pool
    .filter(
      (c) =>
        c.headline.sourceId !== headline.sourceId &&
        withinTimeWindow(c.headline.publishedAt, headline.publishedAt),
    )
    .map((c) => ({ c, score: storySimilarity(print, c.print) }))
    .filter((r) => r.score >= SAME_STORY_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_CANDIDATES);

  for (const { c, score } of ranked) {
    const analysis = await analyzeArticle(c.headline.link);
    if (analysis.access === "free") {
      return {
        link: c.headline.link,
        title: c.headline.title,
        sourceId: c.headline.sourceId,
        sourceName: c.headline.sourceName,
        similarity: Math.round(score * 100) / 100,
      };
    }
  }
  return undefined;
}

/**
 * Construye el listado solo con noticias que se pueden leer enteras dentro de la app:
 * el original si es abierto, o la cobertura en abierto de otro medio sobre la misma
 * noticia. Las que no cumplen ninguna de las dos condiciones no se muestran.
 */
export async function buildReadableFeed(): Promise<ReadableFeed> {
  const raw = await fetchAllHeadlines();

  const pool: Candidate[] = raw.bySource
    .flatMap((r) => r.headlines)
    .map((headline) => ({ headline, print: fingerprint(headline) }));

  const principal = raw.bySource.filter((r) => r.source.role === "principal");
  const toAnalyze = principal.flatMap((r) => r.headlines.slice(0, HEADLINES_PER_SOURCE));

  const resolved = await mapWithConcurrency(
    toAnalyze,
    CONCURRENCY,
    async (headline): Promise<ReadableHeadline | null> => {
      const analysis = await analyzeArticle(headline.link);
      if (analysis.access === "free") {
        return { ...headline, originalAccess: "free" };
      }
      const alternative = await findAlternative(headline, pool);
      if (!alternative) return null;
      return { ...headline, originalAccess: analysis.access, alternative };
    },
  );

  const visible = resolved.filter((h): h is ReadableHeadline => h !== null);

  const bySource: SourceSummary[] = principal.map((r) => {
    const analyzed = Math.min(r.headlines.length, HEADLINES_PER_SOURCE);
    const headlines = visible.filter((h) => h.sourceId === r.source.id);
    return {
      source: { id: r.source.id, name: r.source.name },
      headlines,
      hiddenCount: analyzed - headlines.length,
      error: r.error,
    };
  });

  const headlines = [...visible].sort((a, b) => {
    const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return tb - ta;
  });

  return { headlines, bySource, fetchedAt: new Date().toISOString() };
}

let cached: { at: number; value: Promise<ReadableFeed> } | undefined;

export function getReadableFeed(): Promise<ReadableFeed> {
  if (cached && Date.now() - cached.at < FEED_TTL_MS) return cached.value;
  const value = buildReadableFeed();
  cached = { at: Date.now(), value };
  value.catch(() => {
    if (cached?.value === value) cached = undefined;
  });
  return value;
}
