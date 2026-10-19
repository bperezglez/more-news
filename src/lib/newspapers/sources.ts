import type { NewspaperSource } from "./types";

/**
 * Fuentes de titulares. Para añadir un periódico, agrega un objeto aquí
 * con un `feedUrl` RSS/Atom válido. No hace falta tocar el resto de la app.
 */
export const newspaperSources: NewspaperSource[] = [
  {
    id: "el-pais",
    name: "El País",
    feedUrl: "https://elpais.com/rss/elpais/portada.xml",
    website: "https://elpais.com",
    accent: "#0066cc",
    enabled: true,
  },
  {
    id: "el-confidencial",
    name: "El Confidencial",
    feedUrl: "https://rss.elconfidencial.com/",
    website: "https://www.elconfidencial.com",
    accent: "#c41230",
    enabled: true,
  },
  {
    id: "20-minutos",
    name: "20 Minutos",
    feedUrl: "https://www.20minutos.es/rss",
    website: "https://www.20minutos.es",
    accent: "#003366",
    enabled: true,
  },
  {
    id: "abc",
    name: "ABC",
    feedUrl: "https://www.abc.es/rss/feeds/abcPortada.xml",
    website: "https://www.abc.es",
    accent: "#8b0000",
    enabled: true,
  },
];

export function getEnabledSources(): NewspaperSource[] {
  return newspaperSources.filter((s) => s.enabled !== false);
}

export function getSourceById(id: string): NewspaperSource | undefined {
  return newspaperSources.find((s) => s.id === id);
}
