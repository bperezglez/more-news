import { NextResponse } from "next/server";
import {
  headlineCandidates,
  READABLE_FEED_BUDGET_MS,
  resolveReadableHeadlines,
} from "@/lib/newspapers/readable-feed-resolve";
import type { Headline } from "@/lib/newspapers/types";

export const maxDuration = 60;

type ResolveBody = {
  items: Headline[];
  pool: Headline[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ResolveBody;
    const items = body.items ?? [];
    const pool = body.pool ?? [];

    if (!items.length) {
      return NextResponse.json({ error: "items vacío" }, { status: 400 });
    }

    const candidates = headlineCandidates(pool.length ? pool : items);
    const deadline = Date.now() + READABLE_FEED_BUDGET_MS;
    const resolved = await resolveReadableHeadlines(items, candidates, deadline);

    return NextResponse.json({ resolved });
  } catch (err) {
    console.error("[api/portada-headlines/resolve]", err);
    const message = err instanceof Error ? err.message : "Error al resolver acceso";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
