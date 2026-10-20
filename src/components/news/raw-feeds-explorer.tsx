"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangleIcon,
  ExternalLinkIcon,
  RefreshCwIcon,
  RssIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatAbsolute, formatRelative } from "@/lib/format-time";
import { cn } from "@/lib/utils";
import type { RawFeedItem, RawFeedsSnapshot, RawFeedSourceSnapshot } from "@/lib/newspapers/types";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-card px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function ItemFlags({ item }: { item: RawFeedItem }) {
  return (
    <div className="flex flex-wrap gap-1">
      {!item.passesFilter ? (
        <Badge variant="outline" className="text-[10px]">
          filtrado
        </Badge>
      ) : null}
      {item.includedInAppFeed ? (
        <Badge className="text-[10px]">top 40 app</Badge>
      ) : null}
      {item.analyzedInReadableFeed ? (
        <Badge variant="secondary" className="text-[10px]">
          sync actual
        </Badge>
      ) : item.passesFilter ? (
        <Badge variant="outline" className="text-[10px] text-muted-foreground">
          fuera de sync
        </Badge>
      ) : null}
    </div>
  );
}

function RawFeedItemRow({ item, accent }: { item: RawFeedItem; accent: string }) {
  const [open, setOpen] = useState(false);
  const rel = formatRelative(item.publishedAt);
  const abs = formatAbsolute(item.publishedAt);

  return (
    <article
      className={cn(
        "rounded-xl border bg-card transition-colors",
        !item.passesFilter && "opacity-60",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        <span
          className="grid min-w-10 shrink-0 place-items-center rounded-lg px-2 py-1 text-xs font-semibold tabular-nums text-white"
          style={{ backgroundColor: accent }}
          title="Posición en el RSS"
        >
          {item.feedRank + 1}
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {item.filteredRank !== undefined ? (
              <span className="text-xs text-muted-foreground">
                Tras filtro: #{item.filteredRank + 1}
              </span>
            ) : null}
            <ItemFlags item={item} />
          </div>
          <h3 className="font-medium leading-snug">{item.title}</h3>
          <p className="text-xs text-muted-foreground">
            {rel ?? "Sin fecha"}
            {abs && rel !== abs ? ` · ${abs}` : null}
          </p>
        </div>
      </button>
      {open ? (
        <div className="space-y-3 border-t px-4 py-3 text-sm">
          {item.summary ? (
            <p className="text-muted-foreground">{item.summary}</p>
          ) : (
            <p className="text-muted-foreground italic">Sin resumen en el RSS</p>
          )}
          <dl className="grid gap-2 text-xs sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Enlace</dt>
              <dd className="break-all font-mono">{item.link || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">GUID</dt>
              <dd className="break-all font-mono">{item.guid ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">isoDate</dt>
              <dd>{item.isoDate ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">pubDate</dt>
              <dd>{item.pubDate ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Autor</dt>
              <dd>{item.creator ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Contenido HTML</dt>
              <dd>
                {item.hasFullContent
                  ? `${item.contentLength?.toLocaleString("es-ES") ?? "?"} caracteres`
                  : "No incluido"}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Categorías</dt>
              <dd>{item.categories?.length ? item.categories.join(" · ") : "—"}</dd>
            </div>
            {item.imageUrl ? (
              <div className="sm:col-span-2">
                <dt className="mb-1 text-muted-foreground">Imagen</dt>
                <dd>
                  <a
                    href={item.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
                  >
                    Ver URL
                    <ExternalLinkIcon className="size-3" />
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>
          {item.link ? (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary underline-offset-2 hover:underline"
            >
              Abrir noticia
              <ExternalLinkIcon className="size-3.5" />
            </a>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function SourcePanel({ row }: { row: RawFeedSourceSnapshot }) {
  const { source } = row;
  const chronological = useMemo(() => {
    const dated = row.items.filter((i) => i.publishedAt && !Number.isNaN(Date.parse(i.publishedAt)));
    if (dated.length < 2) return null;
    const sorted = [...dated].sort(
      (a, b) => Date.parse(b.publishedAt!) - Date.parse(a.publishedAt!),
    );
    const feedOrder = dated.map((i) => i.link).join(",");
    const timeOrder = sorted.map((i) => i.link).join(",");
    return feedOrder !== timeOrder;
  }, [row.items]);

  if (row.error) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
        <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
        <div>
          <p className="font-medium">{source.name}</p>
          <p className="text-muted-foreground">{row.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-semibold">{source.name}</h2>
          <a
            href={source.feedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <RssIcon className="size-3.5" />
            RSS
          </a>
        </div>
        {row.feedTitle ? (
          <p className="text-sm text-muted-foreground">
            {row.feedTitle}
            {row.feedUpdated ? ` · actualizado ${formatRelative(row.feedUpdated) ?? row.feedUpdated}` : null}
          </p>
        ) : null}
        {chronological ? (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
            El orden del RSS no coincide con el cronológico: se puede sincronizar respetando la
            portada del medio (<code className="text-xs">feedRank</code> /{" "}
            <code className="text-xs">filteredRank</code>) en lugar de ordenar por fecha.
          </p>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Ítems en XML" value={row.totalItemsInXml} />
        <Stat label="Tras filtro de enlace" value={row.itemsPassingFilter} />
        <Stat label="Usados en app (≤40)" value={row.itemsInAppSlice} />
        <Stat label="Analizados en sync" value={row.headlinesPerSourceBudget} />
        <Stat label="Mostrados aquí" value={row.exportedItemCount} />
      </div>

      <ol className="space-y-3">
        {row.items.map((item) => (
          <li key={`${item.feedRank}-${item.link}`}>
            <RawFeedItemRow item={item} accent={source.accent} />
          </li>
        ))}
      </ol>
    </div>
  );
}

export function RawFeedsExplorer() {
  const [data, setData] = useState<RawFeedsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourceId, setSourceId] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/raw-feeds", { cache: "no-store" });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      const json = (await res.json()) as RawFeedsSnapshot;
      setData(json);
      setSourceId((prev) => {
        if (prev && json.bySource.some((s) => s.source.id === prev)) return prev;
        return json.bySource[0]?.source.id ?? "";
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar RSS");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = useMemo(
    () => data?.bySource.find((s) => s.source.id === sourceId),
    [data, sourceId],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Orden del feed tal como lo publica cada medio. Pulsa un titular para ver campos del RSS.
          {data?.fetchedAt ? (
            <span className="ml-1">Actualizado {formatRelative(data.fetchedAt) ?? data.fetchedAt}.</span>
          ) : null}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCwIcon className={cn("size-4", loading && "animate-spin")} />
          Refrescar
        </Button>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {loading && !data ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full max-w-xl" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : null}

      {data ? (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {data.bySource.map((row) => (
              <button
                key={row.source.id}
                type="button"
                onClick={() => setSourceId(row.source.id)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors",
                  sourceId === row.source.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-card hover:bg-muted",
                  row.error && "border-destructive/40",
                )}
              >
                {row.source.name}
                {row.error ? " !" : ` (${row.totalItemsInXml})`}
              </button>
            ))}
          </div>
          {selected ? <SourcePanel row={selected} /> : null}
        </>
      ) : null}
    </div>
  );
}
