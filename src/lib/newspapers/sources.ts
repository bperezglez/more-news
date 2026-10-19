import type { NewspaperSource } from "./types";

/**
 * Fuentes de titulares. Para añadir un periódico, agrega un objeto aquí
 * con un `feedUrl` RSS/Atom válido. No hace falta tocar el resto de la app.
 *
 * Los medios `contraste` no salen en el listado: se usan para encontrar la
 * misma noticia en abierto cuando el original es de pago o no se puede leer.
 */
export const newspaperSources: NewspaperSource[] = [
  {
    id: "el-pais",
    name: "El País",
    feedUrl: "https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada",
    website: "https://elpais.com",
    accent: "#0066cc",
    role: "principal",
  },
  {
    id: "el-confidencial",
    name: "El Confidencial",
    feedUrl: "https://rss.elconfidencial.com/",
    website: "https://www.elconfidencial.com",
    accent: "#c41230",
    role: "principal",
  },
  {
    id: "20-minutos",
    name: "20 Minutos",
    feedUrl: "https://www.20minutos.es/rss",
    website: "https://www.20minutos.es",
    accent: "#003366",
    role: "principal",
  },
  {
    id: "abc",
    name: "ABC",
    feedUrl: "https://www.abc.es/rss/2.0/portada/",
    website: "https://www.abc.es",
    accent: "#8b0000",
    role: "principal",
  },
  {
    id: "europa-press",
    name: "Europa Press",
    feedUrl: "https://www.europapress.es/rss/rss.aspx",
    website: "https://www.europapress.es",
    accent: "#1f4e79",
    role: "contraste",
  },
  {
    id: "eldiario",
    name: "elDiario.es",
    feedUrl: "https://www.eldiario.es/rss/",
    website: "https://www.eldiario.es",
    accent: "#00a19a",
    role: "contraste",
  },
  {
    id: "la-vanguardia",
    name: "La Vanguardia",
    feedUrl: "https://www.lavanguardia.com/rss/home.xml",
    website: "https://www.lavanguardia.com",
    accent: "#1a1a1a",
    role: "contraste",
  },
];

export function getEnabledSources(): NewspaperSource[] {
  return newspaperSources.filter((s) => s.enabled !== false);
}

export function getPrincipalSources(): NewspaperSource[] {
  return getEnabledSources().filter((s) => s.role === "principal");
}

export function getSourceById(id: string): NewspaperSource | undefined {
  return newspaperSources.find((s) => s.id === id);
}

/** Solo se extraen artículos de dominios configurados, para no actuar como proxy abierto. */
export function isKnownSourceUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return newspaperSources.some((s) => {
      const sourceHost = new URL(s.website).hostname.replace(/^www\./, "");
      return host === sourceHost || host.endsWith(`.${sourceHost}`);
    });
  } catch {
    return false;
  }
}
