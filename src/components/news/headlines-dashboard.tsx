"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { HeadlineCard } from "./headline-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { loadHeadlinesClient } from "@/lib/newspapers/load-headlines-client";
import { isReadableInApp } from "@/lib/newspapers/headline-rank";
import { isStaticHosting } from "@/lib/site-config";
import { getAllPrincipalSources } from "@/lib/newspapers/sources";
import {
  getVisibleSourceIds,
  mergeFeedBySource,
} from "@/lib/newspapers/source-preferences";
import { SourceFilterDialog } from "@/components/news/source-filter-dialog";
import type { ReadableFeed, ReadableHeadline } from "@/lib/newspapers/types";

function TabHiddenNote({ count }: { count: number }) {
  if (!count) return null;
  return (
    <p className="mt-6 text-center text-xs text-muted-foreground">
      {count === 1
        ? "1 titular más aparece en «Todos» al final: de pago o sin cobertura en abierto."
        : `${count} titulares más aparecen en «Todos» al final: de pago o sin cobertura en abierto.`}
    </p>
  );
}

function TodosGrid({ headlines }: { headlines: ReadableHeadline[] }) {
  if (!headlines.length) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        No hay titulares disponibles ahora mismo.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {headlines.map((h, index) => {
        const prev = index > 0 ? headlines[index - 1] : undefined;
        const showDivider =
          prev && isReadableInApp(prev) && !isReadableInApp(h);
        return (
          <div key={h.id} className="contents">
            {showDivider ? (
              <div className="col-span-full rounded-lg border border-dashed bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">
                  Titulares sin lectura integrada
                </p>
                <p className="mt-1 text-xs">
                  Están al final del listado. Puedes abrirlas en el medio original
                  si quieres leerlas allí (suscripción o condiciones del periódico).
                </p>
              </div>
            ) : null}
            <HeadlineCard headline={h} />
          </div>
        );
      })}
    </div>
  );
}

export function HeadlinesDashboard() {
  const allSources = useMemo(() => getAllPrincipalSources(), []);
  const allSourceIds = useMemo(() => allSources.map((s) => s.id), [allSources]);
  const defaultVisibleIds = useMemo(
    () => getVisibleSourceIds(allSourceIds),
    [allSourceIds],
  );
  const [visibleSourceIds, setVisibleSourceIds] = useState<Set<string> | null>(null);
  const activeVisibleIds = visibleSourceIds ?? defaultVisibleIds;
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

  const mergedBySource = useMemo(() => {
    if (!data) return [];
    return mergeFeedBySource(data.bySource, allSources);
  }, [data, allSources]);

  const visibleBySource = useMemo(
    () => mergedBySource.filter((row) => activeVisibleIds.has(row.source.id)),
    [mergedBySource, activeVisibleIds],
  );

  const visibleHeadlines = useMemo(() => {
    if (!data) return [];
    return data.headlines.filter((h) => activeVisibleIds.has(h.sourceId));
  }, [data, activeVisibleIds]);

  const sourceErrors = useMemo(
    () => visibleBySource.filter((s) => s.error) ?? [],
    [visibleBySource],
  );

  const readableInTodos = useMemo(
    () => visibleHeadlines.filter(isReadableInApp).length ?? 0,
    [visibleHeadlines],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Titulares de {activeVisibleIds.size} medios seleccionados ({allSources.length}{" "}
          configurados). En «Todos», primero
          las noticias más relevantes que puedes leer en la app (original en abierto
          o cobertura en otro medio); al final, las de pago o sin alternativa en
          abierto.
          {isStaticHosting && data?.fetchedAt ? (
            <span className="mt-1 block text-xs">
              Datos del despliegue:{" "}
              {new Intl.DateTimeFormat("es-ES", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(data.fetchedAt))}
              . En GitHub Pages se actualizan con cada despliegue (push o cron).
            </span>
          ) : null}
        </p>
        <div className="flex flex-wrap gap-2">
          <SourceFilterDialog
            visibleIds={activeVisibleIds}
            onChange={setVisibleSourceIds}
          />
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            {isStaticHosting ? "Recargar" : "Actualizar"}
          </Button>
        </div>
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
            <TabsTrigger value="todos">
              Todos
              <span className="ml-1 text-xs opacity-70">({visibleHeadlines.length})</span>
            </TabsTrigger>
            {visibleBySource.map(({ source, headlines }) => (
              <TabsTrigger key={source.id} value={source.id}>
                {source.name}
                <span className="ml-1 text-xs opacity-70">({headlines.length})</span>
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="todos" className="mt-4">
            {readableInTodos > 0 ? (
              <p className="mb-4 text-xs text-muted-foreground">
                {readableInTodos} con lectura integrada · ordenadas por relevancia en
                portada y cobertura en varios medios
              </p>
            ) : null}
            <TodosGrid headlines={visibleHeadlines} />
          </TabsContent>
          {visibleBySource.map(({ source, headlines, hiddenCount, error: sourceError }) => (
            <TabsContent key={source.id} value={source.id} className="mt-4">
              {sourceError ? (
                <p className="mb-4 rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
                  {sourceError}
                </p>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {headlines.map((h) => (
                  <HeadlineCard key={h.id} headline={h} />
                ))}
              </div>
              {!headlines.length ? (
                <p className="py-12 text-center text-muted-foreground">
                  {sourceError
                    ? `No hay titulares de ${source.name} en esta carga.`
                    : `Ningún titular legible en abierto de ${source.name} ahora mismo.`}
                </p>
              ) : null}
              <TabHiddenNote count={hiddenCount} />
            </TabsContent>
          ))}
        </Tabs>
      ) : null}
    </div>
  );
}
