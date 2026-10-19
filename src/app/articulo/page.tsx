import { Suspense } from "react";
import { ArticleReader } from "@/components/news/article-reader";

function ArticlePageInner({
  searchParams,
}: {
  searchParams: { url?: string };
}) {
  const url = searchParams.url;
  if (!url) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-muted-foreground">
        Falta la URL de la noticia. Vuelve al{" "}
        <a href="/" className="underline text-foreground">
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

  return <ArticleReader url={decoded} />;
}

export default function ArticuloPage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-8 text-muted-foreground">
          Cargando artículo…
        </div>
      }
    >
      <AsyncArticulo searchParams={searchParams} />
    </Suspense>
  );
}

async function AsyncArticulo({
  searchParams,
}: {
  searchParams: Promise<{ url?: string }>;
}) {
  const params = await searchParams;
  return <ArticlePageInner searchParams={params} />;
}
