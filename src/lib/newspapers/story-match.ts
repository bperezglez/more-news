import type { Headline } from "./types";

const STOPWORDS = new Set(
  (
    "a al algo algunas algunos ante antes como con contra cual cuando de del desde donde dos " +
    "el ella ellas ellos en entre era es esa ese eso esta este esto estos fue han hasta hay " +
    "la las le les lo los mas mientras muy nada ni no nos o otra otro para pero poco por " +
    "porque que quien se sea segun ser si sin sobre son su sus tambien tiene tras tu un una " +
    "uno unos y ya yo tras ademas asi aun ayer hoy manana este esta estas despues durante " +
    "cada todo todos toda todas mismo misma tanto tan vez veces nuevo nueva dice dicen asegura " +
    "directo ultima hora video videos fotos claves"
  ).split(/\s+/),
);

export function tokenize(text: string): Set<string> {
  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9ñ\s]/g, " ");
  const tokens = new Set<string>();
  for (const word of normalized.split(/\s+/)) {
    if (word.length < 3 || STOPWORDS.has(word)) continue;
    // Raíz aproximada para que "inundación" e "inundaciones" coincidan.
    tokens.add(word.length > 6 ? word.slice(0, 6) : word);
  }
  return tokens;
}

function overlap(a: Set<string>, b: Set<string>): number {
  let shared = 0;
  for (const token of a) if (b.has(token)) shared++;
  return shared;
}

export type StoryFingerprint = { title: Set<string>; full: Set<string> };

export function fingerprint(headline: Pick<Headline, "title" | "summary">): StoryFingerprint {
  return {
    title: tokenize(headline.title),
    full: tokenize(`${headline.title} ${headline.summary ?? ""}`),
  };
}

/**
 * Similitud entre 0 y 1. Pesa más el titular; el resumen ayuda a desempatar
 * cuando dos medios titulan distinto la misma noticia.
 */
export function storySimilarity(a: StoryFingerprint, b: StoryFingerprint): number {
  const titleBase = Math.min(a.title.size, b.title.size);
  const fullBase = Math.min(a.full.size, b.full.size);
  const sharedTitle = overlap(a.title, b.title);
  // Con menos de 3 palabras clave en común suele ser el mismo tema, no la misma noticia.
  if (sharedTitle < MIN_SHARED_TITLE_TOKENS || fullBase < 3) return 0;

  const titleScore = sharedTitle / titleBase;
  const fullScore = overlap(a.full, b.full) / fullBase;
  return 0.65 * titleScore + 0.35 * fullScore;
}

const MIN_SHARED_TITLE_TOKENS = 3;
export const SAME_STORY_THRESHOLD = 0.45;
/** Dos noticias del mismo tema con más de este desfase rara vez son la misma pieza. */
export const SAME_STORY_MAX_HOURS = 48;

export function withinTimeWindow(a?: string, b?: string): boolean {
  if (!a || !b) return true;
  const diff = Math.abs(Date.parse(a) - Date.parse(b));
  return Number.isNaN(diff) || diff <= SAME_STORY_MAX_HOURS * 3600 * 1000;
}
