import { fetchAllHeadlines } from "./fetch-headlines";
import { isReadableInApp, sortTodosFeed } from "./headline-rank";
import {
  headlineCandidates,
  READABLE_FEED_BUDGET_MS,
  resolveReadableHeadlines,
} from "./readable-feed-resolve";
import { getAllPrincipalSources } from "./sources";
import type { ReadableFeed, SourceSummary } from "./types";

/** Titulares analizados por medio; baja si hay muchas fuentes para no agotar el tiempo en Vercel. */
function headlinesPerSource(): number {
  const n = getAllPrincipalSources().length;
  return Math.min(25, Math.max(8, Math.floor(200 / Math.max(n, 1))));
}

const FEED_TTL_MS = 15 * 60 * 1000;

/**
 * Analiza titulares de medios principales. En la vista «Todos» se ordenan por
 * importancia entre las legibles y, al final, las que no se pueden leer en la app.
 */
export async function buildReadableFeed(): Promise<ReadableFeed> {
  const deadline = Date.now() + READABLE_FEED_BUDGET_MS;
  const raw = await fetchAllHeadlines();

  const pool = headlineCandidates(raw.bySource.flatMap((r) => r.headlines));

  const principal = raw.bySource.filter((r) => r.source.role === "principal");
  const perSource = headlinesPerSource();
  const toAnalyze = principal.flatMap((r) => r.headlines.slice(0, perSource));

  const all = await resolveReadableHeadlines(toAnalyze, pool, deadline);
  const readable = all.filter(isReadableInApp);

  const bySource: SourceSummary[] = principal.map((r) => {
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
