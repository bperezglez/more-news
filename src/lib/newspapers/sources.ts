import type { NewspaperSource } from "./types";

/**
 * Medios configurados por el usuario. `principal` = aparece en pestañas y en el
 * cruce de noticias. Si un RSS no responde desde el servidor, `enabled: false`.
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
    id: "el-mundo",
    name: "El Mundo",
    feedUrl: "https://www.elmundo.es/rss/portada.xml",
    website: "https://www.elmundo.es",
    accent: "#016ca2",
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
    id: "la-vanguardia",
    name: "La Vanguardia",
    feedUrl: "https://www.lavanguardia.com/rss/home.xml",
    website: "https://www.lavanguardia.com",
    accent: "#1a1a1a",
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
    id: "el-confidencial",
    name: "El Confidencial",
    feedUrl: "https://rss.elconfidencial.com/espana/",
    website: "https://www.elconfidencial.com",
    accent: "#c41230",
    role: "principal",
  },
  {
    id: "eldiario",
    name: "elDiario.es",
    feedUrl: "https://www.eldiario.es/rss/",
    website: "https://www.eldiario.es",
    accent: "#00a19a",
    role: "principal",
  },
  {
    id: "el-espanol",
    name: "El Español",
    feedUrl: "https://www.elespanol.com/rss/",
    website: "https://www.elespanol.com",
    accent: "#e30613",
    role: "principal",
  },
  {
    id: "infolibre",
    name: "Infolibre",
    feedUrl: "https://www.infolibre.es/rss/",
    website: "https://www.infolibre.es",
    accent: "#7c3aed",
    role: "principal",
  },
  {
    id: "vozpopuli",
    name: "Vozpópuli",
    feedUrl: "https://www.vozpopuli.com/rss/portada.xml",
    website: "https://www.vozpopuli.com",
    accent: "#b91c1c",
    role: "principal",
    enabled: false,
  },
  {
    id: "the-objective",
    name: "The Objective",
    feedUrl: "https://theobjective.com/feed/",
    website: "https://theobjective.com",
    accent: "#0f172a",
    role: "principal",
  },
  {
    id: "publico",
    name: "Público",
    feedUrl: "https://www.publico.es/rss/portada.xml",
    website: "https://www.publico.es",
    accent: "#dc2626",
    role: "principal",
    enabled: false,
  },
  {
    id: "el-economista",
    name: "El Economista",
    feedUrl: "https://www.eleconomista.es/rss/rss-portada.php",
    website: "https://www.eleconomista.es",
    accent: "#1e40af",
    role: "principal",
    enabled: false,
  },
  {
    id: "expansion",
    name: "Expansión",
    feedUrl: "https://www.expansion.com/rss/portada.xml",
    website: "https://www.expansion.com",
    accent: "#0369a1",
    role: "principal",
  },
  {
    id: "cinco-dias",
    name: "Cinco Días",
    feedUrl: "https://cincodias.elpais.com/rss/cincodias/portada.xml",
    website: "https://cincodias.elpais.com",
    accent: "#0ea5e9",
    role: "principal",
  },
  {
    id: "marca",
    name: "Marca",
    feedUrl: "https://e00-marca.uecdn.es/rss/portada.xml",
    website: "https://www.marca.com",
    accent: "#fbbf24",
    role: "principal",
  },
  {
    id: "as",
    name: "AS",
    feedUrl: "https://feeds.as.com/mrss-s/pages/as/site/as.com/portada",
    website: "https://as.com",
    accent: "#dc2626",
    role: "principal",
  },
  {
    id: "mundo-deportivo",
    name: "Mundo Deportivo",
    feedUrl: "https://www.mundodeportivo.com/rss/home.xml",
    website: "https://www.mundodeportivo.com",
    accent: "#2563eb",
    role: "principal",
  },
  {
    id: "sport",
    name: "Sport",
    feedUrl: "https://www.sport.es/es/rss/portada.xml",
    website: "https://www.sport.es",
    accent: "#ef4444",
    role: "principal",
    enabled: false,
  },
  {
    id: "rtve",
    name: "RTVE Noticias",
    feedUrl: "https://www.rtve.es/rss/temas_noticias.xml",
    website: "https://www.rtve.es/noticias",
    accent: "#f97316",
    role: "principal",
  },
  {
    id: "efe",
    name: "Agencia EFE",
    feedUrl: "https://www.efe.com/efe/espana/portada/rss",
    website: "https://www.efe.com",
    accent: "#64748b",
    role: "principal",
    enabled: false,
  },
  {
    id: "europa-press",
    name: "Europa Press",
    feedUrl: "https://www.europapress.es/rss/rss.aspx",
    website: "https://www.europapress.es",
    accent: "#1f4e79",
    role: "principal",
  },
  {
    id: "bbc-mundo",
    name: "BBC News Mundo",
    feedUrl: "https://www.bbc.com/mundo/index.xml",
    website: "https://www.bbc.com/mundo",
    accent: "#bb1919",
    role: "principal",
  },
  {
    id: "dw-espanol",
    name: "DW Español",
    feedUrl: "https://rss.dw.com/xml/rss-sp-all",
    website: "https://www.dw.com/es",
    accent: "#0284c7",
    role: "principal",
  },
  {
    id: "el-tiempo",
    name: "El Tiempo",
    feedUrl: "https://www.eltiempo.com/rss/colombia.xml",
    website: "https://www.eltiempo.com",
    accent: "#0066cc",
    role: "principal",
  },
  {
    id: "clarin",
    name: "Clarín",
    feedUrl: "https://www.clarin.com/rss/",
    website: "https://www.clarin.com",
    accent: "#0ea5e9",
    role: "principal",
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
