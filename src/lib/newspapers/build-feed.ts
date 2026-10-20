import { analyzeArticle, mapWithConcurrency } from "./article-access";
import { fetchAllHeadlines } from "./fetch-headlines";
import { isReadableInApp, sortTodosFeed } from "./headline-rank";
import { getAllPrincipalSources } from "./sources";
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

/** Titulares analizados por medio; baja si hay muchas fuentes para no agotar el tiempo en Vercel. */
function headlinesPerSource(): number {
  const n = getAllPrincipalSources().length;
  return Math.min(25, Math.max(8, Math.floor(200 / Math.max(n, 1))));
}
/** Candidatos alternativos que se llegan a abrir antes de dar la noticia por no legible. */
const MAX_CANDIDATES = 3;
const CONCURRENCY = 12;
const FEED_TTL_MS = 15 * 60 * 1000;
/**
 * Tope para construir el listado. En Vercel la función tiene un tiempo máximo; las
 * noticias que no se llegan a comprobar a tiempo se tratan como no legibles.
 */
const FEED_BUDGET_MS = 30_000;

type Candidate = { headline: Headline; print: StoryFingerprint };

async function findAlternative(
  headline: Headline,
  pool: Candidate[],
  deadline: number,
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
    if (Date.now() > deadline) return undefined;
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
 * Analiza titulares de medios principales. En la vista «Todos» se ordenan por
 * importancia entre las legibles y, al final, las que no se pueden leer en la app.
 */
export async function buildReadableFeed(): Promise<ReadableFeed> {
  const deadline = Date.now() + FEED_BUDGET_MS;
  const raw = await fetchAllHeadlines();

  const pool: Candidate[] = raw.bySource
    .flatMap((r) => r.headlines)
    .map((headline) => ({ headline, print: fingerprint(headline) }));

  const principal = raw.bySource.filter((r) => r.source.role === "principal");
  const perSource = headlinesPerSource();
  const toAnalyze = principal.flatMap((r) => r.headlines.slice(0, perSource));

  const resolved = await mapWithConcurrency(
    toAnalyze,
    CONCURRENCY,
    async (headline): Promise<ReadableHeadline | null> => {
      if (Date.now() > deadline) {
        return { ...headline, originalAccess: "blocked" };
      }
      try {
        const analysis = await analyzeArticle(headline.link);
        if (analysis.access === "free") {
          return { ...headline, originalAccess: "free" };
        }
        const alternative = await findAlternative(headline, pool, deadline);
        return { ...headline, originalAccess: analysis.access, alternative };
      } catch (err) {
        console.error(`[build-feed] ${headline.link}:`, err);
        return { ...headline, originalAccess: "blocked" };
      }
    },
  );

  const all = resolved.filter((h): h is ReadableHeadline => h !== null);
  const readable = all.filter(isReadableInApp);

  const bySource: SourceSummary[] = principal.map((r) => {
    const analyzed = Math.min(r.headlines.length, perSource);
    const sourceAll = all.filter((h) => h.sourceId === r.source.id);
    const sourceReadable = readable.filter((h) => h.sourceId === r.source.id);
    return {
      source: { id: r.source.id, name: r.source.name },
      headlines: sourceReadable.sort((a, b) => {
        const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
        const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
        return tb - ta;
      }),
      hiddenCount: sourceAll.length - sourceReadable.length,
      error: r.error,
    };
  });

  const headlines = sortTodosFeed(all);

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
