import { readFile } from "node:fs/promises";
import path from "node:path";
import { getReadableFeed } from "@/lib/newspapers/build-feed";
import { getPortadaFeedSkeleton } from "@/lib/newspapers/build-portada-feed";
import { isStaticHosting } from "@/lib/site-config";
import type { ReadableFeed } from "@/lib/newspapers/types";

const DATA_FILE = path.join(process.cwd(), "public", "data", "headlines.json");

async function readSyncedFeed(): Promise<ReadableFeed | null> {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    return JSON.parse(raw) as ReadableFeed;
  } catch {
    return null;
  }
}

/** Titulares para el HTML inicial (SSR / export estático). */
export async function loadHeadlinesForPage(): Promise<ReadableFeed | null> {
  if (isStaticHosting) {
    return readSyncedFeed();
  }

  const synced = await readSyncedFeed();
  if (synced) return synced;

  try {
    return await getReadableFeed();
  } catch (err) {
    console.error("[loadHeadlinesForPage]", err);
    return null;
  }
}

/** Titulares de portada RSS para SSR en la home (`/`). */
export async function loadPortadaHeadlinesForPage(): Promise<ReadableFeed | null> {
  if (isStaticHosting) {
    return null;
  }

  try {
    return await getPortadaFeedSkeleton();
  } catch (err) {
    console.error("[loadPortadaHeadlinesForPage]", err);
    return null;
  }
}
