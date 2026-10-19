"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { assetUrl, isStaticHosting } from "@/lib/site-config";
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

function CoverageNotice({ via, original, access, source, title }: ArticleReaderProps) {
  if (!via || !original) return null;
  const reason =
    access === "paywalled"
      ? `La noticia original de ${source ?? "este medio"} es solo para suscriptores.`
      : `La noticia original de ${source ?? "este medio"} no se puede leer desde la app.`;
  return (
    <div className="mb-6 space-y-2 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100">
      <p>
        {reason} Estás leyendo la cobertura en abierto de <strong>{via}</strong> sobre
        el mismo hecho.
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <a href={original} target="_blank" rel="noopener noreferrer" className="underline">
          Ver original en {source ?? "el medio"}
        </a>
        {title ? (
          <a
            href={pressReaderSearchUrl(title)}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Buscar en PressReader (con tu carné de biblioteca vía eBiblio)
          </a>
        ) : null}
      </div>
    </div>
  );
}

function StaticArticleFallback(props: ArticleReaderProps) {
  const { url, title, summary, source, via } = props;
  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <CoverageNotice {...props} />
      <header className="mb-8 space-y-3 border-b pb-6">
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "-ml-2 mb-2 inline-flex",
          )}
        >
          ← Titulares
        </Link>
        <h1 className="text-3xl font-semibold leading-tight tracking-tight">
          {title ?? "Noticia"}
        </h1>
        {source ? (
          <p className="text-sm text-muted-foreground">{source}</p>
        ) : null}
        <p className="text-sm text-muted-foreground">
          En GitHub Pages no hay servidor para extraer el artículo completo. Abre
          la noticia en el medio original o ejecuta la app en local / Vercel para
          la vista de lectura integrada.
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants(), "inline-flex")}
        >
          {via ? `Leer en abierto en ${via}` : "Leer en el periódico original"}
        </a>
      </header>
      {summary ? (
        <p className="text-lg leading-relaxed text-muted-foreground">{summary}</p>
      ) : null}
    </article>
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
        const res = await fetch(
          assetUrl(`/api/article?url=${encodeURIComponent(url)}`),
        );
        const json = (await res.json()) as ArticleContent & { error?: string };
        if (res.status === 401) {
          window.location.href = assetUrl("/login");
          return;
        }
        if (!res.ok) throw new Error(json.error ?? "Error al cargar");
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
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-12 text-center">
        <p className="text-muted-foreground">{error}</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants())}
        >
          Abrir en el periódico original
        </a>
        <div>
          <Link href="/" className={cn(buttonVariants({ variant: "ghost" }))}>
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  if (!article) return null;

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <CoverageNotice {...props} />
      <header className="mb-8 space-y-3 border-b pb-6">
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "-ml-2 mb-2 inline-flex",
          )}
        >
          ← Titulares
        </Link>
        <h1 className="text-3xl font-semibold leading-tight tracking-tight">
          {article.title}
        </h1>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {article.byline ? <span>{article.byline}</span> : null}
          {article.siteName ? <span>{article.siteName}</span> : null}
        </div>
        <a
          href={article.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "inline-flex",
          )}
        >
          Ver en la web del medio
        </a>
      </header>
      <div
        className="prose prose-neutral max-w-none dark:prose-invert prose-img:rounded-lg prose-a:text-primary"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />
    </article>
  );
}
