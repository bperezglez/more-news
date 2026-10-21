"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { applyPortadaAccessUpdates } from "./portada-access";
import { portadaResolutionOrderIds } from "./portada-order";
import { assetUrl } from "@/lib/site-config";
import { readJson } from "@/lib/read-json";
import type { Headline, ReadableFeed, ReadableHeadline } from "./types";

type ResolveResponse = { resolved?: ReadableHeadline[]; error?: string };

async function resolveOne(items: Headline[], pool: Headline[]): Promise<ReadableHeadline | null> {
  const res = await fetch(assetUrl("/api/portada-headlines/resolve"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items, pool }),
    cache: "no-store",
  });
  const json = await readJson<ResolveResponse>(res);
  if (!res.ok || json.error) {
    throw new Error(json.error ?? "No se pudo comprobar el acceso");
  }
  return json.resolved?.[0] ?? null;
}

/**
 * Mantiene el feed visible con datos RSS y va resolviendo acceso en orden de portada.
 */
export function useProgressivePortadaAccess(
  feed: ReadableFeed | null,
  enabled: boolean,
): ReadableFeed | null {
  const [updates, setUpdates] = useState<Map<string, ReadableHeadline>>(() => new Map());
  const resolvedIdsRef = useRef(new Set<string>());

  useEffect(() => {
    setUpdates(new Map());
    resolvedIdsRef.current = new Set();
  }, [feed?.fetchedAt]);

  useEffect(() => {
    if (!enabled || !feed?.progressiveAccess) return;

    const order = portadaResolutionOrderIds(feed);
    const pool = feed.headlines;
    const byId = new Map(feed.headlines.map((h) => [h.id, h]));
    let cancelled = false;

    (async () => {
      for (const id of order) {
        if (cancelled) break;
        if (resolvedIdsRef.current.has(id)) continue;

        const headline = byId.get(id);
        if (!headline) continue;

        try {
          const resolved = await resolveOne([headline], pool);
          if (cancelled) break;
          resolvedIdsRef.current.add(id);
          if (resolved) {
            setUpdates((prev) => new Map(prev).set(id, resolved));
          } else {
            setUpdates((prev) =>
              new Map(prev).set(id, { ...headline, originalAccess: "blocked" }),
            );
          }
        } catch (err) {
          if (cancelled) break;
          console.error("[portada-access]", headline.link, err);
          resolvedIdsRef.current.add(id);
          setUpdates((prev) =>
            new Map(prev).set(id, { ...headline, originalAccess: "blocked" }),
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, feed]);

  return useMemo(() => {
    if (!feed) return null;
    if (!enabled || !feed.progressiveAccess) return feed;
    return applyPortadaAccessUpdates(feed, updates);
  }, [feed, enabled, updates]);
}
