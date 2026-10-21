import {
  fingerprint,
  SAME_STORY_MAX_HOURS,
  SAME_STORY_THRESHOLD,
  storySimilarity,
  withinTimeWindow,
  type StoryFingerprint,
} from "./story-match";
import type { Headline, ReadableHeadline } from "./types";

/** Se puede leer entera en la app (original abierto o cobertura alternativa). */
export function isReadableInApp(headline: ReadableHeadline): boolean {
  if (headline.originalAccess === "pending") return true;
  return (
    headline.originalAccess === "free" ||
    headline.originalAccess === "subscriber_readable" ||
    !!headline.alternative
  );
}

type RankInput = {
  headline: Headline;
  print: StoryFingerprint;
  pool: { headline: Headline; print: StoryFingerprint }[];
};

/**
 * Prioriza titulares de portada (posición en el RSS) y hechos que cubren varios medios.
 * Valor entre 0 y 1.
 */
export function computeHeadlineImportance({ headline, print, pool }: RankInput): number {
  const rank = headline.feedRank ?? 15;
  const feedScore = 1 / (1 + rank);

  let cluster = 0;
  for (const other of pool) {
    if (other.headline.id === headline.id) continue;
    if (!withinTimeWindow(other.headline.publishedAt, headline.publishedAt)) continue;
    if (storySimilarity(print, other.print) >= SAME_STORY_THRESHOLD) cluster++;
  }
  const clusterScore = Math.min(cluster / 4, 1);

  let recencyScore = 0.5;
  if (headline.publishedAt) {
    const ageMs = Date.now() - Date.parse(headline.publishedAt);
    if (!Number.isNaN(ageMs)) {
      recencyScore = Math.max(0, 1 - ageMs / (SAME_STORY_MAX_HOURS * 3600 * 1000));
    }
  }

  return 0.5 * feedScore + 0.4 * clusterScore + 0.1 * recencyScore;
}

/** Orden global cuando la fuente de verdad es la portada RSS (feedRank ascendente). */
export function sortPortadaTodosFeed(headlines: ReadableHeadline[]): ReadableHeadline[] {
  return [...headlines].sort((a, b) => {
    const tierA =
      a.originalAccess === "pending" || isReadableInApp(a) ? 0 : 1;
    const tierB =
      b.originalAccess === "pending" || isReadableInApp(b) ? 0 : 1;
    if (tierA !== tierB) return tierA - tierB;

    const rankA = a.feedRank ?? 999;
    const rankB = b.feedRank ?? 999;
    if (rankA !== rankB) return rankA - rankB;

    const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return tb - ta;
  });
}

export function sortTodosFeed(headlines: ReadableHeadline[]): ReadableHeadline[] {
  const pool = headlines.map((headline) => ({
    headline,
    print: fingerprint(headline),
  }));
  const importance = new Map<string, number>();
  for (const entry of pool) {
    importance.set(
      entry.headline.id,
      computeHeadlineImportance({ headline: entry.headline, print: entry.print, pool }),
    );
  }

  return [...headlines].sort((a, b) => {
    const tierA = isReadableInApp(a) ? 0 : 1;
    const tierB = isReadableInApp(b) ? 0 : 1;
    if (tierA !== tierB) return tierA - tierB;

    const scoreA = importance.get(a.id) ?? 0;
    const scoreB = importance.get(b.id) ?? 0;
    if (scoreA !== scoreB) return scoreB - scoreA;

    const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return tb - ta;
  });
}
