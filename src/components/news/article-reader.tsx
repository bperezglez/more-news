"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { ArticleContent } from "@/lib/newspapers/types";

export function ArticleReader({ url }: { url: string }) {
  const [article, setArticle] = useState<ArticleContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/article?url=${encodeURIComponent(url)}`);
        const json = (await res.json()) as ArticleContent & { error?: string };
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
      <header className="mb-8 space-y-3 border-b pb-6">
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 mb-2 inline-flex")}
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
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "inline-flex")}
        >
          Ver en la web del medio
        </a>
      </header>
      <div
        className="prose prose-neutral max-w-none dark:prose-invert prose-img:rounded-lg prose-a:text-primary"
        // Contenido generado por Readability desde la fuente original
        dangerouslySetInnerHTML={{ __html: article.content }}
      />
    </article>
  );
}
