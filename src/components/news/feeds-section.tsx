"use client";

import { HeadlinesDashboard } from "@/components/news/headlines-dashboard";
import { RawFeedsExplorer } from "@/components/news/raw-feeds-explorer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { loadHeadlinesClient } from "@/lib/newspapers/load-headlines-client";
import type { ReadableFeed } from "@/lib/newspapers/types";

type FeedsSectionProps = {
  initialRelevanceFeed?: ReadableFeed | null;
};

/** Feed por relevancia (algoritmo clásico) e inspección técnica de RSS. */
export function FeedsSection({ initialRelevanceFeed = null }: FeedsSectionProps) {
  return (
    <Tabs defaultValue="relevancia" className="gap-5">
      <TabsList variant="line" className="h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
        <TabsTrigger value="relevancia" className="rounded-full px-4">
          Por relevancia
        </TabsTrigger>
        <TabsTrigger value="rss" className="rounded-full px-4">
          Inspección RSS
        </TabsTrigger>
      </TabsList>
      <TabsContent value="relevancia" className="mt-0 outline-none">
        <HeadlinesDashboard
          initialFeed={initialRelevanceFeed}
          loadFeed={loadHeadlinesClient}
          orderingHint="Orden: importancia entre medios (cluster + recencia)"
        />
      </TabsContent>
      <TabsContent value="rss" className="mt-0 max-w-5xl outline-none">
        <p className="mb-4 text-sm text-muted-foreground">
          Vista técnica del XML de cada feed. Útil para comparar campos y el orden crudo del
          medio.
        </p>
        <RawFeedsExplorer />
      </TabsContent>
    </Tabs>
  );
}
