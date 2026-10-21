import { analyzeArticle, mapWithConcurrency } from "./article-access";
import { isReadableInApp } from "./headline-rank";
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
export const PORTADA_ALTERNATIVE_MAX_CANDIDATES = 8;

export type HeadlineCandidate = { headline: Headline; print: StoryFingerprint };

export type ResolveReadableOptions = {
  /** Titulares ya comprobados en esta sesión (p. ej. El Mundo en abierto). */
  resolvedPeers?: ReadableHeadline[];
  maxCandidates?: number;
};

export function headlineCandidates(headlines: Headline[]): HeadlineCandidate[] {
  return headlines.map((headline) => ({
    headline,
    print: fingerprint(headline),
  }));
}

function peerToAlternative(peer: ReadableHeadline, score: number): AlternativeCoverage {
  const link = peer.alternative?.link ?? peer.link;
  return {
    link,
    title: peer.alternative?.title ?? peer.title,
    sourceId: peer.alternative?.sourceId ?? peer.sourceId,
    sourceName: peer.alternative?.sourceName ?? peer.sourceName,
    similarity: Math.round(score * 100) / 100,
  };
}

async function findAlternative(
  headline: Headline,
  pool: HeadlineCandidate[],
  deadline: number,
  resolvedPeers: ReadableHeadline[] = [],
  maxCandidates = READABLE_FEED_MAX_CANDIDATES,
): Promise<AlternativeCoverage | undefined> {
  const print = fingerprint(headline);

  for (const peer of resolvedPeers) {
    if (peer.sourceId === headline.sourceId) continue;
    if (!withinTimeWindow(peer.publishedAt, headline.publishedAt)) continue;
    if (!isReadableInApp(peer)) continue;
    const score = storySimilarity(print, fingerprint(peer));
    if (score >= SAME_STORY_THRESHOLD) {
      return peerToAlternative(peer, score);
    }
  }

  const ranked = pool
    .filter(
      (c) =>
        c.headline.sourceId !== headline.sourceId &&
        withinTimeWindow(c.headline.publishedAt, headline.publishedAt),
    )
    .map((c) => ({ c, score: storySimilarity(print, c.print) }))
    .filter((r) => r.score >= SAME_STORY_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxCandidates);

  for (const { c, score } of ranked) {
    if (Date.now() > deadline) return undefined;
    const analysis = await analyzeArticle(c.headline.link);
    if (analysis.access === "free" || analysis.access === "subscriber_readable") {
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

/** Comprueba pago/alternativa; compara con el pool RSS y con titulares ya resueltos. */
export async function resolveReadableHeadlines(
  toAnalyze: Headline[],
  pool: HeadlineCandidate[],
  deadline: number,
  options: ResolveReadableOptions = {},
): Promise<ReadableHeadline[]> {
  const resolvedPeers = options.resolvedPeers ?? [];
  const maxCandidates = options.maxCandidates ?? READABLE_FEED_MAX_CANDIDATES;

  const resolved = await mapWithConcurrency(
    toAnalyze,
    READABLE_FEED_CONCURRENCY,
    async (headline): Promise<ReadableHeadline | null> => {
      if (Date.now() > deadline) {
        return { ...headline, originalAccess: "blocked" };
      }
      try {
        const analysis = await analyzeArticle(headline.link);
        if (analysis.access === "free" || analysis.access === "subscriber_readable") {
          return { ...headline, originalAccess: analysis.access };
        }
        const alternative = await findAlternative(
          headline,
          pool,
          deadline,
          resolvedPeers,
          maxCandidates,
        );
        return { ...headline, originalAccess: analysis.access, alternative };
      } catch (err) {
        console.error(`[readable-feed] ${headline.link}:`, err);
        return { ...headline, originalAccess: "blocked" };
      }
    },
  );

  return resolved.filter((h): h is ReadableHeadline => h !== null);
}
