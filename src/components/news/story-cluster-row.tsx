"use client";

import { HeadlineCard } from "./headline-card";
import { cn } from "@/lib/utils";
import type { ReadableHeadline } from "@/lib/newspapers/types";

type StoryClusterRowProps = {
  headlines: ReadableHeadline[];
  featured?: boolean;
  className?: string;
};

/** Una fila horizontal: la misma noticia en varios periódicos. */
export function StoryClusterRow({ headlines, featured, className }: StoryClusterRowProps) {
  const multi = headlines.length > 1;
  const lead = headlines[0]!;

  return (
    <section
      className={cn(
        "rounded-2xl border bg-card/50 p-3 shadow-xs sm:p-4",
        multi && "border-primary/15 ring-1 ring-primary/5",
        featured && "sm:col-span-2 lg:col-span-3",
        className,
      )}
      aria-label={
        multi
          ? `Misma noticia en ${headlines.length} medios: ${lead.title}`
          : lead.title
      }
    >
      {multi ? (
        <p className="mb-3 px-1 text-xs font-medium text-muted-foreground">
          Misma noticia en{" "}
          <span className="text-foreground tabular-nums">{headlines.length}</span> medios
        </p>
      ) : null}
      <div
        className={cn(
          "flex gap-4",
          multi
            ? "scrollbar-none snap-x snap-mandatory overflow-x-auto pb-1"
            : "block",
        )}
      >
        {headlines.map((h, i) => (
          <div
            key={h.id}
            className={cn(
              multi && "w-[min(100%,20rem)] shrink-0 snap-start sm:w-72",
              !multi && "w-full",
            )}
          >
            <HeadlineCard headline={h} featured={featured && i === 0 && !multi} />
          </div>
        ))}
      </div>
    </section>
  );
}
