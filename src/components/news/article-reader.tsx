"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  BookOpenIcon,
  ClockIcon,
  ExternalLinkIcon,
  InfoIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import { assetUrl, isStaticHosting } from "@/lib/site-config";
import { readJson } from "@/lib/read-json";
import type { ArticleContent } from "@/lib/newspapers/types";

type ArticleReaderProps = {
  url: string;
  title?: string;
  summary?: string;
  source?: string;
  /** Medio cuya cobertura abierta se está leyendo en lugar del original. */
  via?: string;
  original?: string;
  access?: string;
};

function pressReaderSearchUrl(title: string) {
  const params = new URLSearchParams({ query: title, languages: "es" });
  return `https://www.pressreader.com/search?${params.toString()}`;
}

function readingMinutes(html: string) {
  const words = html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

function ReaderBar({ externalUrl }: { externalUrl: string }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="sticky top-0 z-40 border-b border-border/60 bg-background/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-2 px-4 sm:px-6">
        <Link href="/" className={cn(buttonVariants({ variant: "ghost" }), "-ml-2 gap-1.5")}>
          <ArrowLeftIcon />
          Titulares
        </Link>
        <div className="flex items-center gap-1">
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "ghost" }), "gap-1.5")}
          >
            <ExternalLinkIcon />
            <span className="hidden sm:inline">Web del medio</span>
          </a>
          <ThemeToggle />
        </div>
      </div>
      <div
        className="h-0.5 origin-left bg-primary transition-transform duration-100"
        style={{ transform: `scaleX(${progress})` }}
        role="progressbar"
        aria-label="Progreso de lectura"
        aria-valuenow={Math.round(progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}

function CoverageNotice({ via, original, access, source, title }: ArticleReaderProps) {
  if (!via || !original) return null;
  const reason =
    access === "paywalled"
      ? `La noticia original de ${source ?? "este medio"} es solo para suscriptores.`
      : `La noticia original de ${source ?? "este medio"} no se puede leer desde la app.`;
  return (
    <aside className="mb-8 flex gap-3 rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4 text-sm">
      <InfoIcon className="mt-0.5 size-4 shrink-0 text-sky-600 dark:text-sky-400" />
      <div className="space-y-2">
        <p>
          {reason} Estás leyendo la cobertura en abierto de <strong>{via}</strong> sobre el
          mismo hecho.
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 font-medium">
          <a
            href={original}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-700 underline-offset-4 hover:underline dark:text-sky-300"
          >
            Ver original en {source ?? "el medio"}
          </a>
          {title ? (
            <a
              href={pressReaderSearchUrl(title)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-700 underline-offset-4 hover:underline dark:text-sky-300"
            >
              Buscar en PressReader (eBiblio)
            </a>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

function Shell({ externalUrl, children }: { externalUrl: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <ReaderBar externalUrl={externalUrl} />
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 pt-8 pb-24 sm:px-6 sm:pt-12">
        {children}
      </div>
    </div>
  );
}

function StaticArticleFallback(props: ArticleReaderProps) {
  const { url, title, summary, source, via } = props;
  return (
    <Shell externalUrl={url}>
      <article>
        <CoverageNotice {...props} />
        {source ? (
          <p className="mb-3 text-sm font-medium text-primary">{via ?? source}</p>
        ) : null}
        <h1 className="text-3xl font-semibold leading-tight tracking-tight text-balance sm:text-4xl">
          {title ?? "Noticia"}
        </h1>
        {summary ? (
          <p className="mt-5 text-lg leading-relaxed text-pretty text-muted-foreground">
            {summary}
          </p>
        ) : null}
        <div className="mt-8 rounded-2xl border bg-muted/40 p-5 text-sm text-muted-foreground">
          En esta versión publicada no hay servidor para extraer el artículo completo.
          Ábrelo en el medio o usa la app en local o en Vercel para leerlo aquí.
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ size: "lg" }), "mt-4 flex w-full sm:inline-flex sm:w-auto")}
          >
            <BookOpenIcon />
            {via ? `Leer en abierto en ${via}` : "Leer en el periódico"}
          </a>
        </div>
      </article>
    </Shell>
  );
}

export function ArticleReader(props: ArticleReaderProps) {
  if (isStaticHosting) {
    return <StaticArticleFallback {...props} />;
  }

  return <DynamicArticleReader {...props} />;
}

function DynamicArticleReader(props: ArticleReaderProps) {
  const { url } = props;
  const [article, setArticle] = useState<ArticleContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(assetUrl(`/api/article?url=${encodeURIComponent(url)}`));
        if (res.status === 401) {
          window.location.href = assetUrl("/login");
          return;
        }
        const json = await readJson<ArticleContent>(res);
        if (!res.ok || json.error) throw new Error(json.error ?? "Error al cargar");
        if (!cancelled) setArticle(json);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Error desconocido");
          setArticle(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (loading) {
    return (
      <Shell externalUrl={url}>
        <div className="space-y-4" aria-busy="true" aria-label="Cargando artículo">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
          <div className="space-y-3 pt-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className={cn("h-4", i % 3 === 2 ? "w-4/5" : "w-full")} />
            ))}
          </div>
        </div>
      </Shell>
    );
  }

  if (error || !article) {
    return (
      <Shell externalUrl={url}>
        <div className="flex flex-col items-center rounded-2xl border border-dashed px-6 py-16 text-center">
          <span className="mb-4 grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
            <TriangleAlertIcon className="size-5" />
          </span>
          {props.title ? <p className="mb-1 font-medium text-balance">{props.title}</p> : null}
          <p className="max-w-sm text-sm text-muted-foreground">
            {error ?? "No se ha podido cargar el artículo."}
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ size: "lg" }))}
            >
              <ExternalLinkIcon />
              Abrir en el periódico
            </a>
            <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
              Volver a titulares
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  const minutes = readingMinutes(article.content);

  return (
    <Shell externalUrl={article.sourceUrl}>
      <article>
        <CoverageNotice {...props} />
        <header className="mb-10 space-y-4">
          {article.siteName || props.via || props.source ? (
            <p className="text-sm font-medium text-primary">
              {article.siteName ?? props.via ?? props.source}
            </p>
          ) : null}
          <h1 className="text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-[2.6rem] sm:leading-[1.15]">
            {article.title}
          </h1>
          {article.excerpt ? (
            <p className="text-lg leading-relaxed text-pretty text-muted-foreground">
              {article.excerpt}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-4 text-sm text-muted-foreground">
            {article.byline ? <span className="font-medium text-foreground">{article.byline}</span> : null}
            <span className="inline-flex items-center gap-1.5">
              <ClockIcon className="size-3.5" />
              {minutes} min de lectura
            </span>
          </div>
        </header>
        <div
          className="prose prose-lg prose-neutral max-w-none dark:prose-invert prose-headings:tracking-tight prose-a:text-primary prose-a:underline-offset-4 prose-img:rounded-xl prose-figcaption:text-sm"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
        <footer className="mt-12 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
            <ArrowLeftIcon />
            Más titulares
          </Link>
          <a
            href={article.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "ghost", size: "lg" }))}
          >
            Leer en la web del medio
            <ExternalLinkIcon />
          </a>
        </footer>
      </article>
    </Shell>
  );
}
