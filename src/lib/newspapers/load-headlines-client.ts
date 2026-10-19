import { assetUrl, isStaticHosting } from "@/lib/site-config";
import type { Headline } from "./types";

export type HeadlinesPayload = {
  headlines: Headline[];
  bySource: {
    source: { id: string; name: string };
    headlines: Headline[];
    error?: string;
  }[];
  fetchedAt?: string;
  error?: string;
};

export async function loadHeadlinesClient(): Promise<HeadlinesPayload> {
  if (isStaticHosting) {
    const res = await fetch(assetUrl(`/data/headlines.json?t=${Date.now()}`), {
      cache: "no-store",
    });
    const json = (await res.json()) as HeadlinesPayload;
    if (!res.ok) {
      throw new Error(json.error ?? "No se pudieron cargar los titulares");
    }
    return json;
  }

  const res = await fetch(assetUrl("/api/headlines"), { cache: "no-store" });
  const json = (await res.json()) as HeadlinesPayload;
  if (!res.ok) {
    throw new Error(json.error ?? "No se pudieron cargar los titulares");
  }
  return json;
}
