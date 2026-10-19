"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArticleReader } from "@/components/news/article-reader";

function ArticuloContent() {
  const searchParams = useSearchParams();
  const url = searchParams.get("url");

  if (!url) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-muted-foreground">
        Falta la URL de la noticia. Vuelve al{" "}
        <a href="../" className="underline text-foreground">
          listado de titulares
        </a>
        .
      </div>
    );
  }

  let decoded: string;
  try {
    decoded = decodeURIComponent(url);
  } catch {
    decoded = url;
  }

  return (
    <ArticleReader
      url={decoded}
      title={searchParams.get("title") ?? undefined}
      summary={searchParams.get("summary") ?? undefined}
      source={searchParams.get("source") ?? undefined}
      via={searchParams.get("via") ?? undefined}
      original={searchParams.get("original") ?? undefined}
      access={searchParams.get("access") ?? undefined}
    />
  );
}

export function ArticuloPageClient() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-8 text-muted-foreground">
          Cargando artículo…
        </div>
      }
    >
      <ArticuloContent />
    </Suspense>
  );
}
