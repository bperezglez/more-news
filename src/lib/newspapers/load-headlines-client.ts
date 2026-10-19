import { assetUrl, isStaticHosting } from "@/lib/site-config";
import { readJson } from "@/lib/read-json";
import type { ReadableFeed } from "./types";

export async function loadHeadlinesClient(): Promise<ReadableFeed> {
  const url = isStaticHosting
    ? assetUrl(`/data/headlines.json?t=${Date.now()}`)
    : assetUrl("/api/headlines");

  const res = await fetch(url, { cache: "no-store" });
  if (res.status === 401 && typeof window !== "undefined") {
    window.location.href = assetUrl("/login");
    throw new Error("Sesión caducada");
  }
  const json = await readJson<ReadableFeed>(res);
  if (!res.ok || json.error) {
    throw new Error(json.error ?? "No se pudieron cargar los titulares");
  }
  return json;
}
