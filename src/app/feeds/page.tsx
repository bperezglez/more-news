import { FeedsSection } from "@/components/news/feeds-section";
import { NewsPageShell } from "@/components/news/news-page-shell";
import { loadHeadlinesForPage } from "@/lib/newspapers/load-headlines-server";

export default async function FeedsPage() {
  const initialRelevanceFeed = await loadHeadlinesForPage();

  return (
    <NewsPageShell
      title="Feeds RSS y relevancia"
      description="Vista alternativa ordenada por importancia entre medios, más la inspección técnica de cada feed XML."
    >
      <FeedsSection initialRelevanceFeed={initialRelevanceFeed} />
    </NewsPageShell>
  );
}
