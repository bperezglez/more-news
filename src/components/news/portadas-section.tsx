"use client";

import { HeadlinesDashboard } from "@/components/news/headlines-dashboard";
import { RawFeedsExplorer } from "@/components/news/raw-feeds-explorer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PORTADA_HEADLINES_PER_SOURCE } from "@/lib/newspapers/portada-config";
import { loadPortadaHeadlinesClient } from "@/lib/newspapers/load-headlines-client";
import type { ReadableFeed } from "@/lib/newspapers/types";

type PortadasSectionProps = {
  initialFeed?: ReadableFeed | null;
};

export function PortadasSection({ initialFeed = null }: PortadasSectionProps) {
  return (
    <Tabs defaultValue="titulares" className="gap-5">
      <TabsList variant="line" className="h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
        <TabsTrigger value="titulares" className="rounded-full px-4">
          Titulares
        </TabsTrigger>
        <TabsTrigger value="rss" className="rounded-full px-4">
          Inspecci\u00f3n RSS
        </TabsTrigger>
      </TabsList>
      <TabsContent value="titulares" className="mt-0 outline-none">
        <HeadlinesDashboard
          initialFeed={initialFeed}
          loadFeed={loadPortadaHeadlinesClient}
          progressivePortadaAccess
          groupCrossSourceStories
          orderingHint={`Hasta ${PORTADA_HEADLINES_PER_SOURCE} titulares de portada por medio \u00b7 en \u00abTodos\u00bb, misma noticia agrupada por fila`}
        />
      </TabsContent>
      <TabsContent value="rss" className="mt-0 max-w-5xl outline-none">
        <p className="mb-4 text-sm text-muted-foreground">
          Vista t\u00e9cnica del XML de cada feed. \u00datil para comparar campos y el orden crudo del
          medio.
        </p>
        <RawFeedsExplorer />
      </TabsContent>
    </Tabs>
  );
}
