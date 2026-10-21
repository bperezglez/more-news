"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRightIcon, BookOpenIcon, LockIcon, RepeatIcon } from "lucide-react";
import { accessChipForHeadline } from "@/lib/newspapers/access-display";
import { isAccessPending } from "@/lib/newspapers/portada-access";
import { isReadableInApp } from "@/lib/newspapers/headline-rank";
import type { ReadableHeadline } from "@/lib/newspapers/types";
import { getSourceById } from "@/lib/newspapers/sources";
import { formatAbsolute, formatRelative } from "@/lib/format-time";
import { cn } from "@/lib/utils";

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
  }
  if (
    headline.originalAccess !== "pending" &&
    (headline.originalAccess === "subscriber_readable" ||
      !isReadableInApp(headline) ||
      alt)
  ) {
    params.set("access", headline.originalAccess);
  }
  return `/articulo?${params.toString()}`;
}

function ImageFallback({ accent, name }: { accent: string; name: string }) {
  return (
    <div
      className="flex size-full items-end p-4"
      style={{
        backgroundImage: `linear-gradient(135deg, ${accent} 0%, color-mix(in oklch, ${accent} 45%, black) 100%)`,
      }}
      aria-hidden
    >
      <span className="text-3xl font-bold tracking-tight text-white/90">{name}</span>
    </div>
  );
}

type Props = {
  headline: ReadableHeadline;
  featured?: boolean;
};

export function HeadlineCard({ headline, featured = false }: Props) {
  const source = getSourceById(headline.sourceId);
  const accent = source?.accent ?? "#334155";
  const pending = isAccessPending(headline);
  const readable = isReadableInApp(headline);
  const alt = headline.alternative;
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = !!headline.imageUrl && !imageFailed;
  const relative = formatRelative(headline.publishedAt);
  const accessChip = accessChipForHeadline(headline);

  const linkClass =
    "outline-none after:absolute after:inset-0 after:rounded-2xl after:content-['']";

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-xs transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-lg hover:shadow-foreground/5",
        "focus-within:ring-3 focus-within:ring-ring/50 motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        featured && "sm:col-span-2 lg:row-span-2",
        !readable && !pending && "bg-muted/40",
      )}
    >
      {showImage || featured ? (
        <div
          className={cn(
            "relative overflow-hidden bg-muted",
            featured ? "aspect-[16/9] lg:aspect-auto lg:min-h-72 lg:flex-1" : "aspect-[16/9]",
          )}
        >
          {showImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={headline.imageUrl}
              alt=""
              loading={featured ? "eager" : "lazy"}
              onError={() => setImageFailed(true)}
              className={cn(
                "size-full object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none",
                featured && "lg:absolute lg:inset-0",
                !readable && !pending && "grayscale-[35%]",
              )}
            />
          ) : (
            <ImageFallback accent={accent} name={headline.sourceName} />
          )}
        </div>
      ) : null}

      <div className={cn("flex flex-1 flex-col gap-2.5 p-4", featured && "sm:p-6")}>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className="size-2 shrink-0 rounded-full ring-2 ring-background"
            style={{ backgroundColor: accent }}
            aria-hidden
          />
          <span className="truncate font-medium text-foreground/80">{headline.sourceName}</span>
          {relative ? (
            <>
              <span aria-hidden>·</span>
              <time
                dateTime={headline.publishedAt}
                title={formatAbsolute(headline.publishedAt) ?? undefined}
                className="shrink-0"
              >
                {relative}
              </time>
            </>
          ) : null}
        </div>

        <h3
          className={cn(
            "font-semibold leading-snug tracking-tight text-pretty",
            featured ? "text-xl sm:text-2xl lg:text-3xl" : "line-clamp-3 text-base",
          )}
        >
          {readable ? (
            <Link href={articleHref(headline)} className={linkClass}>
              {headline.title}
            </Link>
          ) : (
            <a
              href={headline.link}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              {headline.title}
              <span className="sr-only"> (abre la web del medio en otra pestaña)</span>
            </a>
          )}
        </h3>

        {headline.summary ? (
          <p
            className={cn(
              "text-sm leading-relaxed text-muted-foreground",
              featured ? "line-clamp-3 sm:text-base" : "line-clamp-2",
            )}
          >
            {headline.summary}
          </p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-2 pt-1 text-xs">
          {accessChip.tone === "alternative" ? (
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-2.5 py-1 font-medium text-sky-700 dark:text-sky-300"
              title={accessChip.title}
            >
              <RepeatIcon className="size-3" aria-hidden />
              {accessChip.label}
            </span>
          ) : accessChip.tone === "pending" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 font-medium text-muted-foreground">
              <span className="size-2 animate-pulse rounded-full bg-primary/60" aria-hidden />
              {accessChip.label}
            </span>
          ) : accessChip.tone === "locked" ? (
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 font-medium text-amber-800 dark:text-amber-300"
              title={accessChip.title}
            >
              <LockIcon className="size-3" aria-hidden />
              {accessChip.label}
            </span>
          ) : accessChip.tone === "subscriber-in-app" ? (
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/10 px-2.5 py-1 font-medium text-teal-800 dark:text-teal-300"
              title={accessChip.title}
            >
              <BookOpenIcon className="size-3" aria-hidden />
              {accessChip.label}
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 font-medium text-emerald-700 dark:text-emerald-300"
              title={accessChip.title}
            >
              {accessChip.label}
            </span>
          )}
          <span
            className="inline-flex items-center gap-0.5 font-medium text-muted-foreground transition-colors group-hover:text-primary"
            aria-hidden
          >
            {readable ? "Leer" : "Ver original"}
            <ArrowUpRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>
    </article>
  );
}
