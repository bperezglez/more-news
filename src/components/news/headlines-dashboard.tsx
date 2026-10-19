"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { HeadlineCard } from "./headline-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { loadHeadlinesClient } from "@/lib/newspapers/load-headlines-client";
import { isStaticHosting } from "@/lib/site-config";
import { getPrincipalSources } from "@/lib/newspapers/sources";
import type { ReadableFeed } from "@/lib/newspapers/types";

function HiddenNote({ count }: { count: number }) {
  if (!count) return null;
  return (
    <p className="mt-6 text-center text-xs text-muted-foreground">
      {count === 1
        ? "1 noticia oculta por no poder leerse en abierto (ni en el original ni en otro medio)."
        : `${count} noticias ocultas por no poder leerse en abierto (ni en el original ni en otro medio).`}
    </p>
  );
}

export function HeadlinesDashboard() {
  const [data, setData] = useState<ReadableFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeed = useCallback(
    () =>
      loadHeadlinesClient().then(
        (json) => {
          setData(json);
          setError(null);
          setLoading(false);
        },
        (e: unknown) => {
          setError(e instanceof Error ? e.message : "Error de red");
          setData(null);
          setLoading(false);
        },
      ),
    [],
  );

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    return fetchFeed();
  }, [fetchFeed]);

  useEffect(() => {
    void fetchFeed();
  }, [fetchFeed]);

  const sourceErrors = useMemo(
    () => data?.bySource.filter((s) => s.error) ?? [],
    [data],
  );

  const totalHidden = useMemo(
    () => data?.bySource.reduce((n, s) => n + s.hiddenCount, 0) ?? 0,
    [data],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Titulares de {getPrincipalSources().length} medios. Solo se listan las
          noticias que se pueden leer enteras en abierto: en el original o, si es de
          pago, en otro medio que cubra la misma noticia.
          {isStaticHosting && data?.fetchedAt ? (
            <span className="block text-xs mt-1">
              Datos del despliegue:{" "}
              {new Intl.DateTimeFormat("es-ES", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(data.fetchedAt))}
              . En GitHub Pages se actualizan con cada despliegue (push o cron).
            </span>
          ) : null}
        </p>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          {isStaticHosting ? "Recargar" : "Actualizar"}
        </Button>
      </div>

      {sourceErrors.length > 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          Algunas fuentes no respondieron:{" "}
          {sourceErrors.map((s) => `${s.source.name} (${s.error})`).join("; ")}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          {error}{" "}
          <button type="button" className="underline" onClick={() => void load()}>
            Reintentar
          </button>
        </div>
      ) : null}

      {loading && !data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-xl" />
          ))}
        </div>
      ) : null}

      {data ? (
        <Tabs defaultValue="todos">
          <TabsList className="flex h-auto flex-wrap justify-start gap-1">
            <TabsTrigger value="todos">Todos</TabsTrigger>
            {data.bySource.map(({ source, headlines }) => (
              <TabsTrigger key={source.id} value={source.id}>
                {source.name}
                <span className="ml-1 text-xs opacity-70">({headlines.length})</span>
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="todos" className="mt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.headlines.map((h) => (
                <HeadlineCard key={h.id} headline={h} />
              ))}
            </div>
            {!data.headlines.length ? (
              <p className="text-center text-muted-foreground py-12">
                No hay titulares legibles en abierto ahora mismo.
              </p>
            ) : null}
            <HiddenNote count={totalHidden} />
          </TabsContent>
          {data.bySource.map(({ source, headlines, hiddenCount }) => (
            <TabsContent key={source.id} value={source.id} className="mt-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {headlines.map((h) => (
                  <HeadlineCard key={h.id} headline={h} />
                ))}
              </div>
              <HiddenNote count={hiddenCount} />
            </TabsContent>
          ))}
        </Tabs>
      ) : null}
    </div>
  );
}
