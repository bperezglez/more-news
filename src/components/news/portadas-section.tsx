"use client";

import { HeadlinesDashboard } from "@/components/news/headlines-dashboard";
import { PORTADA_HEADLINES_PER_SOURCE } from "@/lib/newspapers/portada-config";
import { loadPortadaHeadlinesClient } from "@/lib/newspapers/load-headlines-client";
import type { ReadableFeed } from "@/lib/newspapers/types";

type PortadasSectionProps = {
  initialFeed?: ReadableFeed | null;
};

/** Listado principal: portada RSS por medio, acceso progresivo y agrupación en «Todos». */
export function PortadasSection({ initialFeed = null }: PortadasSectionProps) {
  return (
    <HeadlinesDashboard
      initialFeed={initialFeed}
      loadFeed={loadPortadaHeadlinesClient}
      progressivePortadaAccess
      groupCrossSourceStories
      orderingHint={`Hasta ${PORTADA_HEADLINES_PER_SOURCE} titulares de portada por medio · en «Todos», misma noticia agrupada por fila`}
    />
  );
}
