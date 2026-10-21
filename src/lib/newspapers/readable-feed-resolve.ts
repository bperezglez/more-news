import { analyzeArticle, mapWithConcurrency } from "./article-access";
import {
  fingerprint,
  SAME_STORY_THRESHOLD,
  storySimilarity,
  withinTimeWindow,
  type StoryFingerprint,
} from "./story-match";
import type { AlternativeCoverage, Headline, ReadableHeadline } from "./types";

export const READABLE_FEED_CONCURRENCY = 12;
export const READABLE_FEED_BUDGET_MS = 30_000;
export const READABLE_FEED_MAX_CANDIDATES = 3;

export type HeadlineCandidate = { headline: Headline; print: StoryFingerprint };

export function headlineCandidates(headlines: Headline[]): HeadlineCandidate[] {
  return headlines.map((headline) => ({
    headline,
    print: fingerprint(headline),
  }));
}

async function findAlternative(
  headline: Headline,
  pool: HeadlineCandidate[],
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
    .slice(0, READABLE_FEED_MAX_CANDIDATES);

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

/** Misma comprobación de pago/alternativa que el listado principal. */
export async function resolveReadableHeadlines(
  toAnalyze: Headline[],
  pool: HeadlineCandidate[],
  deadline: number,
): Promise<ReadableHeadline[]> {
  const resolved = await mapWithConcurrency(
    toAnalyze,
    READABLE_FEED_CONCURRENCY,
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
        console.error(`[readable-feed] ${headline.link}:`, err);
        return { ...headline, originalAccess: "blocked" };
      }
    },
  );

  return resolved.filter((h): h is ReadableHeadline => h !== null);
}
