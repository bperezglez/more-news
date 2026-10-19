"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReadableHeadline } from "@/lib/newspapers/types";
import { getSourceById } from "@/lib/newspapers/sources";

function formatDate(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export function articleHref(headline: ReadableHeadline) {
  const alt = headline.alternative;
  const params = new URLSearchParams({
    url: alt?.link ?? headline.link,
    title: headline.title,
    source: headline.sourceName,
  });
  if (headline.summary) params.set("summary", headline.summary);
  if (alt) {
    params.set("via", alt.sourceName);
    params.set("original", headline.link);
    params.set("access", headline.originalAccess);
  }
  return `/articulo?${params.toString()}`;
}

export function HeadlineCard({ headline }: { headline: ReadableHeadline }) {
  const source = getSourceById(headline.sourceId);
  const accent = source?.accent ?? "#334155";
  const when = formatDate(headline.publishedAt);
  const href = articleHref(headline);
  const alt = headline.alternative;

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <div className="h-1 w-full" style={{ backgroundColor: accent }} />
      <CardHeader className="gap-2 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{headline.sourceName}</Badge>
          {alt ? (
            <Badge
              variant="outline"
              title={
                headline.originalAccess === "paywalled"
                  ? "El original es de pago; se lee la cobertura abierta de otro medio"
                  : "El original no se puede leer; se lee la cobertura abierta de otro medio"
              }
            >
              Leer en abierto en {alt.sourceName}
            </Badge>
          ) : null}
          {when ? (
            <span className="text-xs text-muted-foreground">{when}</span>
          ) : null}
        </div>
        <CardTitle className="text-lg leading-snug">
          <Link href={href} className="hover:underline">
            {headline.title}
          </Link>
        </CardTitle>
      </CardHeader>
      {(headline.summary || headline.imageUrl) && (
        <CardContent className="space-y-3 pt-0">
          {headline.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={headline.imageUrl}
              alt=""
              className="max-h-40 w-full rounded-md object-cover"
              loading="lazy"
            />
          ) : null}
          {headline.summary ? (
            <p className="line-clamp-3 text-sm text-muted-foreground">
              {headline.summary}
            </p>
          ) : null}
        </CardContent>
      )}
    </Card>
  );
}
