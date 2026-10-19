export type PaywallVerdict = { paywalled: boolean; reason?: string };

const LD_JSON_RE =
  /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
const CONTENT_TIER_RE =
  /<meta[^>]+(?:property|name)=["']article:content_tier["'][^>]*content=["']([^"']+)["']/i;
const CONTENT_TIER_REVERSED_RE =
  /<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']article:content_tier["']/i;

function isFalse(value: unknown): boolean {
  return value === false || (typeof value === "string" && value.toLowerCase() === "false");
}

/** Busca `isAccessibleForFree: false` en el artículo o en sus `hasPart`. */
function hasLockedMarker(node: unknown, depth = 0): boolean {
  if (!node || typeof node !== "object" || depth > 6) return false;
  if (Array.isArray(node)) return node.some((n) => hasLockedMarker(n, depth + 1));

  const record = node as Record<string, unknown>;
  if (isFalse(record.isAccessibleForFree)) return true;
  if (record["@graph"] && hasLockedMarker(record["@graph"], depth + 1)) return true;
  if (record.hasPart && hasLockedMarker(record.hasPart, depth + 1)) return true;
  return false;
}

/**
 * Detecta artículos de pago con los marcadores que los propios medios publican
 * para buscadores (schema.org `isAccessibleForFree` y `article:content_tier`).
 * `metered` se trata como de pago: el acceso gratuito depende de un cupo del lector.
 */
export function detectPaywall(html: string): PaywallVerdict {
  const tier = (html.match(CONTENT_TIER_RE) ?? html.match(CONTENT_TIER_REVERSED_RE))?.[1]
    ?.trim()
    .toLowerCase();
  if (tier && tier !== "free") {
    return { paywalled: true, reason: `content_tier=${tier}` };
  }

  for (const match of html.matchAll(LD_JSON_RE)) {
    const raw = match[1].trim();
    try {
      if (hasLockedMarker(JSON.parse(raw))) {
        return { paywalled: true, reason: "isAccessibleForFree=false" };
      }
    } catch {
      if (/"isAccessibleForFree"\s*:\s*"?false"?/i.test(raw)) {
        return { paywalled: true, reason: "isAccessibleForFree=false" };
      }
    }
  }

  return { paywalled: false };
}
