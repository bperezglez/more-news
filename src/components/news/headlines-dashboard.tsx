"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { HeadlineCard } from "./headline-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Headline } from "@/lib/newspapers/types";
import { newspaperSources } from "@/lib/newspapers/sources";

type ApiResponse = {
  headlines: Headline[];
  bySource: {
    source: { id: string; name: string };
    headlines: Headline[];
    error?: string;
  }[];
  error?: string;
};

export function HeadlinesDashboard() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/headlines", { cache: "no-store" });
      const json = (await res.json()) as ApiResponse;
      if (!res.ok) {
        throw new Error(json.error ?? "No se pudieron cargar los titulares");
      }
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de red");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sourceErrors = useMemo(
    () => data?.bySource.filter((s) => s.error) ?? [],
    [data],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Titulares de {newspaperSources.filter((s) => s.enabled !== false).length}{" "}
          medios. Uso personal — enlace al original en cada noticia.
        </p>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          Actualizar
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
              <TabsTrigger key={source.id} value={source.id} disabled={!headlines.length}>
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
                No hay titulares disponibles ahora mismo.
              </p>
            ) : null}
          </TabsContent>
          {data.bySource.map(({ source, headlines }) => (
            <TabsContent key={source.id} value={source.id} className="mt-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {headlines.map((h) => (
                  <HeadlineCard key={h.id} headline={h} />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      ) : null}
    </div>
  );
}
