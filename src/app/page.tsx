import { PortadasSection } from "@/components/news/portadas-section";
import { NewsPageShell } from "@/components/news/news-page-shell";
import { loadPortadaHeadlinesForPage } from "@/lib/newspapers/load-headlines-server";

export default async function Home() {
  const initialFeed = await loadPortadaHeadlinesForPage();

  return (
    <NewsPageShell
      title="Titulares en orden de portada"
      description="Cada medio conserva el orden de su RSS. Si el original es de pago, buscamos la misma noticia en abierto. En «Todos», agrupamos la misma noticia entre periódicos."
    >
      <PortadasSection initialFeed={initialFeed} />
    </NewsPageShell>
  );
}
