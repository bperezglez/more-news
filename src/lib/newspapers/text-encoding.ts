import { parseHTML } from "linkedom";

const REPLACEMENT = "\uFFFD";

/** Charset en `Content-Type` o en la prolog XML. */
export function charsetFromContentType(value: string | null): string | undefined {
  if (!value) return undefined;
  const match = value.match(/charset=([^;\s]+)/i);
  return match?.[1]?.replace(/["']/g, "").toLowerCase();
}

export function charsetFromXmlProlog(bytes: Uint8Array): string | undefined {
  const head = new TextDecoder("latin1").decode(bytes.subarray(0, 256));
  const match = head.match(/encoding=["']([^"']+)["']/i);
  return match?.[1]?.toLowerCase();
}

function decodeBuffer(bytes: Uint8Array, encoding: string): string {
  try {
    return new TextDecoder(encoding, { fatal: false }).decode(bytes);
  } catch {
    return "";
  }
}

function scoreDecodedText(text: string): number {
  const replacement = (text.match(/\uFFFD/g) || []).length;
  const mojibake = (text.match(/Ã[\u0080-\u00BF]|â[\u0080-\u00BF]/g) || []).length;
  const spanish = (text.match(/[áéíóúüñÁÉÍÓÚÜÑ]/g) || []).length;
  return spanish * 3 - replacement * 15 - mojibake * 8;
}

/** Decodifica bytes HTTP priorizando charset declarado y heurística para español. */
export function decodeHttpBody(bytes: Uint8Array, contentType?: string | null): string {
  const candidates = [
    charsetFromContentType(contentType ?? null),
    charsetFromXmlProlog(bytes),
    "utf-8",
    "windows-1252",
    "iso-8859-1",
  ].filter((c, i, a): c is string => !!c && a.indexOf(c) === i);

  let best = { text: "", score: Number.NEGATIVE_INFINITY };
  for (const encoding of candidates) {
    const text = decodeBuffer(bytes, encoding);
    const score = scoreDecodedText(text);
    if (score > best.score) best = { text, score };
  }

  return repairNewsText(best.text || decodeBuffer(bytes, "utf-8"));
}

export async function readResponseText(response: Response): Promise<string> {
  const bytes = new Uint8Array(await response.arrayBuffer());
  return decodeHttpBody(bytes, response.headers.get("content-type"));
}

/** Repara UTF-8 leído como Latin-1 y decodifica entidades HTML comunes en titulares. */
export function repairNewsText(input: string): string {
  if (!input) return input;
  let text = input.trim();

  if (/&(?:#\d+|#x[\da-fA-F]+|[a-zA-Z]+);/.test(text)) {
    try {
      const { document } = parseHTML("<!DOCTYPE html><body></body>");
      const el = document.createElement("textarea");
      el.innerHTML = text;
      text = el.value || text;
    } catch {
      /* mantener original */
    }
  }

  if (/[\u00C3\u00C2\u00E2][\u0080-\u00BF]/.test(text) || text.includes("Ã")) {
    try {
      const fixed = Buffer.from(text, "latin1").toString("utf8");
      if (scoreDecodedText(fixed) > scoreDecodedText(text)) {
        text = fixed;
      }
    } catch {
      /* ignore */
    }
  }

  return text.normalize("NFC");
}

export function normalizeNewsText(input: string | undefined): string | undefined {
  if (input === undefined) return undefined;
  return repairNewsText(input);
}
