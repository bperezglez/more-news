"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangleIcon,
  ArrowUpIcon,
  ChevronDownIcon,
  LockIcon,
  RefreshCwIcon,
  SearchIcon,
  SearchXIcon,
  WifiOffIcon,
  XIcon,
} from "lucide-react";
import { HeadlineCard } from "./headline-card";
import { StoryClusterRow } from "./story-cluster-row";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { loadHeadlinesClient } from "@/lib/newspapers/load-headlines-client";
import { isReadableInApp } from "@/lib/newspapers/headline-rank";
import { isStaticHosting } from "@/lib/site-config";
import { getAllPrincipalSources } from "@/lib/newspapers/sources";
import {
  ACCESS_FILTER_KINDS,
  ACCESS_FILTER_LABELS,
  getHeadlineAccessKind,
  loadAccessFilters,
  matchesAccessFilters,
  saveAccessFilters,
  shouldSplitReadableSections,
  type AccessFilterKind,
} from "@/lib/newspapers/access-filters";
import {
  getVisibleSourceIds,
  mergeFeedBySource,
} from "@/lib/newspapers/source-preferences";
import { SourceFilterDialog } from "@/components/news/source-filter-dialog";
import { formatRelative } from "@/lib/format-time";
import { cn } from "@/lib/utils";
import { clusterCrossSourceStories } from "@/lib/newspapers/story-clusters";
import { useProgressivePortadaAccess } from "@/lib/newspapers/use-progressive-portada-access";
import type { ReadableFeed, ReadableHeadline } from "@/lib/newspapers/types";

const ALL = "todos";
const GRID = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-5";

function normalize(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function matches(h: ReadableHeadline, q: string) {
  return normalize(`${h.title} ${h.summary ?? ""} ${h.sourceName}`).includes(q);
}

function EmptyState({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof SearchXIcon;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed px-6 py-16 text-center">
      <span className="mb-4 grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <p className="font-medium">{title}</p>
      {children ? (
        <div className="mt-1 max-w-sm text-sm text-muted-foreground">{children}</div>
      ) : null}
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className={GRID} aria-busy="true" aria-label="Cargando titulares">
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "overflow-hidden rounded-2xl border bg-card",
            i === 0 && "sm:col-span-2 lg:row-span-2",
          )}
        >
          <Skeleton className={cn("w-full rounded-none", i === 0 ? "aspect-[16/9] lg:h-80" : "aspect-[16/9]")} />
          <div className="space-y-3 p-4">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ClusteredHeadlineGrid({
  headlines,
  featureFirst,
}: {
  headlines: ReadableHeadline[];
  featureFirst: boolean;
}) {
  const clusters = useMemo(() => clusterCrossSourceStories(headlines), [headlines]);

  return (
    <div className="flex flex-col gap-5">
      {clusters.map((cluster, i) => (
        <StoryClusterRow
          key={cluster.id}
          headlines={cluster.headlines}
          featured={featureFirst && i === 0}
        />
      ))}
    </div>
  );
}

function HeadlineGrid({
  headlines,
  featureFirst,
  splitSections,
}: {
  headlines: ReadableHeadline[];
  featureFirst: boolean;
  splitSections: boolean;
}) {
  if (!splitSections) {
    return (
      <div className={GRID}>
        {headlines.map((h, i) => (
          <HeadlineCard key={h.id} headline={h} featured={featureFirst && i === 0} />
        ))}
      </div>
    );
  }

  const readable = headlines.filter(isReadableInApp);
  const locked = headlines.filter((h) => !isReadableInApp(h));

  return (
    <div className="space-y-10">
      {readable.length ? (
        <div className={GRID}>
          {readable.map((h, i) => (
            <HeadlineCard key={h.id} headline={h} featured={featureFirst && i === 0} />
          ))}
        </div>
      ) : null}
      {locked.length ? (
        <section aria-labelledby="locked-heading" className="space-y-4">
          <div className="flex items-start gap-3 border-t pt-8">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300">
              <LockIcon className="size-4" />
            </span>
            <div>
              <h2 id="locked-heading" className="font-semibold">
                De pago o sin alternativa en abierto
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {locked.length}
                </span>
              </h2>
              <p className="text-sm text-muted-foreground">
                No las encontramos gratis en otro medio. Se abren en la web original.
              </p>
            </div>
          </div>
          <div className={GRID}>
            {locked.map((h) => (
              <HeadlineCard key={h.id} headline={h} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function SourceChip({
  active,
  label,
  count,
  accent,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  accent?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-9 shrink-0 snap-start items-center gap-2 rounded-full border px-3.5 text-sm font-medium whitespace-nowrap transition-colors outline-none",
        "focus-visible:ring-3 focus-visible:ring-ring/50",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-card text-foreground/80 hover:border-foreground/25 hover:text-foreground",
        !active && count === 0 && "opacity-55",
      )}
    >
      {accent ? (
        <span className="size-2 rounded-full" style={{ backgroundColor: accent }} aria-hidden />
      ) : null}
      {label}
      <span
        className={cn(
          "rounded-full px-1.5 text-xs tabular-nums",
          active ? "bg-background/20" : "bg-muted text-muted-foreground",
        )}
      >
        {count}
      </span>
    </button>
  );
}

function BackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 900);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0 })}
      aria-label="Volver arriba"
      className={cn(
        "fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 grid size-11 place-items-center rounded-full border bg-background/90 shadow-lg backdrop-blur transition-all outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:right-6 sm:bottom-6",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
      )}
    >
      <ArrowUpIcon className="size-4" />
    </button>
  );
}

type HeadlinesDashboardProps = {
  /** Datos del servidor para el primer pintado (evita quedarse en skeleton si la hidratación tarda). */
  initialFeed?: ReadableFeed | null;
  /** Origen del feed (por defecto titulares de la home). */
  loadFeed?: () => Promise<ReadableFeed>;
  /** Texto breve sobre el criterio de ordenación. */
  orderingHint?: string;
  /** Resuelve acceso titular a titular tras pintar el RSS. */
  progressivePortadaAccess?: boolean;
  /** En «Todos», agrupa titulares similares de distintos medios en una fila. */
  groupCrossSourceStories?: boolean;
};

export function HeadlinesDashboard({
  initialFeed = null,
  loadFeed = loadHeadlinesClient,
  orderingHint,
  progressivePortadaAccess = false,
  groupCrossSourceStories = false,
}: HeadlinesDashboardProps) {
  const allSources = useMemo(() => getAllPrincipalSources(), []);
  const allSourceIds = useMemo(() => allSources.map((s) => s.id), [allSources]);
  const defaultVisibleIds = useMemo(() => getVisibleSourceIds(allSourceIds), [allSourceIds]);
  const [visibleSourceIds, setVisibleSourceIds] = useState<Set<string> | null>(null);
  const activeVisibleIds = visibleSourceIds ?? defaultVisibleIds;

  const [data, setData] = useState<ReadableFeed | null>(initialFeed);
  const feed = useProgressivePortadaAccess(data, progressivePortadaAccess);
  const [loading, setLoading] = useState(!initialFeed);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string>(ALL);
  const [accessFilters, setAccessFilters] = useState<Set<AccessFilterKind> | null>(null);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setAccessFilters(loadAccessFilters());
  }, []);

  const toggleAccessFilter = useCallback((kind: AccessFilterKind) => {
    setAccessFilters((prev) => {
      const next = new Set(prev ?? []);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      const value = next.size ? next : null;
      saveAccessFilters(value ?? new Set());
      return value;
    });
  }, []);

  const clearAccessFilters = useCallback(() => {
    setAccessFilters(null);
    saveAccessFilters(new Set());
  }, []);

  const fetchFeed = useCallback(
    () =>
      loadFeed().then(
        (json) => {
          setData(json);
          setError(null);
          setLoading(false);
        },
        (e: unknown) => {
          setError(e instanceof Error ? e.message : "Error de red");
          setLoading(false);
        },
      ),
    [loadFeed],
  );

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    return fetchFeed();
  }, [fetchFeed]);

  useEffect(() => {
    void fetchFeed();
  }, [fetchFeed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const visibleBySource = useMemo(() => {
    if (!feed) return [];
    return mergeFeedBySource(feed.bySource, allSources).filter((row) =>
      activeVisibleIds.has(row.source.id),
    );
  }, [feed, allSources, activeVisibleIds]);

  const visibleHeadlines = useMemo(
    () => (feed ? feed.headlines.filter((h) => activeVisibleIds.has(h.sourceId)) : []),
    [feed, activeVisibleIds],
  );

  const sourceErrors = useMemo(() => visibleBySource.filter((s) => s.error), [visibleBySource]);

  const activeSelection =
    selected === ALL || visibleBySource.some((s) => s.source.id === selected) ? selected : ALL;
  const selectedRow = visibleBySource.find((s) => s.source.id === activeSelection);

  const q = normalize(query.trim());
  const baseList = selectedRow ? selectedRow.headlines : visibleHeadlines;
  const afterAccess = useMemo(
    () => baseList.filter((h) => matchesAccessFilters(h, accessFilters)),
    [baseList, accessFilters],
  );
  const shown = q ? afterAccess.filter((h) => matches(h, q)) : afterAccess;
  const accessCounts = useMemo(() => {
    const counts = Object.fromEntries(
      ACCESS_FILTER_KINDS.map((k) => [k, 0]),
    ) as Record<AccessFilterKind, number>;
    for (const h of baseList) counts[getHeadlineAccessKind(h)]++;
    return counts;
  }, [baseList]);
  const readableCount = visibleHeadlines.filter(isReadableInApp).length;
  const updated = formatRelative(feed?.fetchedAt);
  const accessPendingCount = feed?.progressiveAccess
    ? feed.headlines.filter((h) => h.originalAccess === "pending").length
    : 0;
  const accessFilterActive = !!accessFilters?.size;
  const splitSections = shouldSplitReadableSections(accessFilters);
  const useStoryClusters =
    groupCrossSourceStories && activeSelection === ALL && !q.trim();

  return (
    <div className="space-y-5">
      <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-30 -mx-4 space-y-3 border-b border-transparent bg-background/85 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex items-center gap-2">
          <label className="relative flex-1">
            <span className="sr-only">Buscar titulares</span>
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setQuery("");
                  e.currentTarget.blur();
                }
              }}
              placeholder="Buscar en titulares…"
              enterKeyHint="search"
              className="h-10 w-full rounded-full border bg-card pr-10 pl-10 text-sm shadow-xs transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 [&::-webkit-search-cancel-button]:hidden"
            />
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  searchRef.current?.focus();
                }}
                aria-label="Borrar búsqueda"
                className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <XIcon className="size-4" />
              </button>
            ) : (
              <kbd className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded border bg-muted px-1.5 font-mono text-[11px] text-muted-foreground sm:block">
                /
              </kbd>
            )}
          </label>
          <SourceFilterDialog visibleIds={activeVisibleIds} onChange={setVisibleSourceIds} />
          <Button
            variant="outline"
            size="icon-lg"
            className="rounded-full"
            onClick={() => void load()}
            disabled={loading}
            aria-label={isStaticHosting ? "Recargar titulares" : "Actualizar titulares"}
            title={isStaticHosting ? "Recargar" : "Actualizar"}
          >
            <RefreshCwIcon className={cn(loading && "animate-spin")} />
          </Button>
        </div>

        {feed ? (
          <div className="relative -mx-4 sm:-mx-6 lg:-mx-8">
            <div
              className="scrollbar-none flex snap-x gap-2 overflow-x-auto scroll-px-4 px-4 pb-2 sm:scroll-px-6 sm:px-6 lg:scroll-px-8 lg:px-8"
              role="group"
              aria-label="Filtrar por tipo de lectura"
            >
              {ACCESS_FILTER_KINDS.map((kind) => (
                <SourceChip
                  key={kind}
                  active={!!accessFilters?.has(kind)}
                  label={ACCESS_FILTER_LABELS[kind]}
                  count={accessCounts[kind]}
                  onClick={() => toggleAccessFilter(kind)}
                />
              ))}
              {accessFilterActive ? (
                <button
                  type="button"
                  onClick={clearAccessFilters}
                  className="inline-flex h-9 shrink-0 snap-start items-center rounded-full px-3 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Quitar filtros
                </button>
              ) : null}
            </div>
            <div
              className="scrollbar-none flex snap-x gap-2 overflow-x-auto scroll-px-4 px-4 sm:scroll-px-6 sm:px-6 lg:scroll-px-8 lg:px-8"
              role="group"
              aria-label="Filtrar por medio"
            >
              <SourceChip
                active={activeSelection === ALL}
                label="Todos"
                count={visibleHeadlines.length}
                onClick={() => setSelected(ALL)}
              />
              {visibleBySource.map(({ source, headlines }) => (
                <SourceChip
                  key={source.id}
                  active={activeSelection === source.id}
                  label={source.name}
                  count={headlines.length}
                  accent={allSources.find((s) => s.id === source.id)?.accent}
                  onClick={() => setSelected(source.id)}
                />
              ))}
            </div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent" />
          </div>
        ) : null}
      </div>

      {feed ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <span>
            <strong className="font-semibold text-foreground tabular-nums">{readableCount}</strong>{" "}
            para leer en la app · {activeVisibleIds.size} de {allSources.length} medios
          </span>
          {orderingHint ? <span>{orderingHint}</span> : null}
          {accessPendingCount > 0 ? (
            <span className="text-muted-foreground/90">
              Comprobando acceso ({accessPendingCount} pendientes)…
            </span>
          ) : null}
          {updated ? <span>Actualizado {updated}</span> : null}
          {sourceErrors.length ? (
            <details className="group w-full sm:w-auto">
              <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-800 select-none dark:text-amber-300 [&::-webkit-details-marker]:hidden">
                <AlertTriangleIcon className="size-3.5" />
                {sourceErrors.length === 1
                  ? "1 medio sin respuesta"
                  : `${sourceErrors.length} medios sin respuesta`}
                <ChevronDownIcon className="size-3.5 transition-transform group-open:rotate-180" />
              </summary>
              <ul className="mt-2 space-y-1 rounded-xl border bg-card p-3 text-xs">
                {sourceErrors.map((s) => (
                  <li key={s.source.id}>
                    <span className="font-medium text-foreground">{s.source.name}:</span> {s.error}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </div>
      ) : null}

      {error && feed ? (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm"
        >
          <span>No se pudo actualizar: {error}</span>
          <Button size="sm" variant="outline" onClick={() => void load()}>
            Reintentar
          </Button>
        </div>
      ) : null}

      {loading && !feed ? <LoadingGrid /> : null}

      {error && !feed ? (
        <EmptyState icon={WifiOffIcon} title="No se pudieron cargar los titulares">
          <p>{error}</p>
          <Button className="mt-4" onClick={() => void load()}>
            <RefreshCwIcon />
            Reintentar
          </Button>
        </EmptyState>
      ) : null}

      {feed ? (
        <div
          className={cn("transition-opacity", loading && "opacity-60")}
          aria-live="polite"
          aria-busy={loading}
        >
          {shown.length ? (
            useStoryClusters ? (
              <ClusteredHeadlineGrid
                headlines={shown}
                featureFirst={!accessFilterActive}
              />
            ) : (
              <HeadlineGrid
                headlines={shown}
                featureFirst={!q && !accessFilterActive}
                splitSections={splitSections}
              />
            )
          ) : q || accessFilterActive ? (
            <EmptyState
              icon={SearchXIcon}
              title={
                q
                  ? `Sin resultados para «${query.trim()}»`
                  : "Ningún titular coincide con estos filtros de lectura"
              }
            >
              <p>
                {q
                  ? "Prueba con otras palabras o relaja los filtros."
                  : "Activa otro tipo de lectura o quita los filtros."}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {q ? (
                  <Button variant="outline" onClick={() => setQuery("")}>
                    Borrar búsqueda
                  </Button>
                ) : null}
                {accessFilterActive ? (
                  <Button variant="outline" onClick={clearAccessFilters}>
                    Quitar filtros de lectura
                  </Button>
                ) : null}
                {activeSelection !== ALL ? (
                  <Button variant="ghost" onClick={() => setSelected(ALL)}>
                    Ver todos los medios
                  </Button>
                ) : null}
              </div>
            </EmptyState>
          ) : (
            <EmptyState
              icon={SearchXIcon}
              title={
                selectedRow
                  ? `Nada legible en abierto de ${selectedRow.source.name} ahora mismo`
                  : "No hay titulares disponibles ahora mismo"
              }
            >
              {selectedRow?.error ? <p>{selectedRow.error}</p> : null}
            </EmptyState>
          )}
          {selectedRow && selectedRow.hiddenCount > 0 && !q ? (
            <p className="mt-8 text-center text-xs text-muted-foreground">
              {selectedRow.hiddenCount === 1
                ? "1 titular de pago o sin cobertura abierta aparece al final de «Todos»."
                : `${selectedRow.hiddenCount} titulares de pago o sin cobertura abierta aparecen al final de «Todos».`}
            </p>
          ) : null}
        </div>
      ) : null}

      <BackToTop />
    </div>
  );
}
