"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAllPrincipalSources } from "@/lib/newspapers/sources";
import { SCOPE_LABELS, filterSourcesByScope } from "@/lib/newspapers/source-regions";
import { setVisibleSourceIds } from "@/lib/newspapers/source-preferences";

type Props = {
  visibleIds: Set<string>;
  onChange: (ids: Set<string>) => void;
};

export function SourceFilterDialog({ visibleIds, onChange }: Props) {
  const allSources = useMemo(() => getAllPrincipalSources(), []);
  const nationalSources = useMemo(
    () => filterSourcesByScope(allSources, "national"),
    [allSources],
  );
  const canariasSources = useMemo(
    () => filterSourcesByScope(allSources, "canarias"),
    [allSources],
  );
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Set<string>>(() => new Set(visibleIds));

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) setDraft(new Set(visibleIds));
  };

  const toggle = (id: string) => {
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size <= 1) return prev;
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const apply = () => {
    const ids = allSources.map((s) => s.id).filter((id) => draft.has(id));
    setVisibleSourceIds(ids);
    onChange(new Set(ids));
    setOpen(false);
  };

  const selectAll = () => setDraft(new Set(allSources.map((s) => s.id)));
  const selectNone = () => {
    const first = allSources[0]?.id;
    if (first) setDraft(new Set([first]));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="lg"
            className="h-10 rounded-full px-3 sm:px-4"
            aria-label={`Elegir medios (${visibleIds.size} de ${allSources.length})`}
          >
            <SlidersHorizontalIcon />
            <span className="hidden sm:inline">Medios</span>
            <span className="rounded-full bg-muted px-1.5 text-xs tabular-nums text-muted-foreground">
              {visibleIds.size}
            </span>
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Medios que quiero ver</DialogTitle>
          <DialogDescription>
            Se guarda en este navegador. La lectura en abierto y la búsqueda de cobertura
            alternativa funcionan igual en todos.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground tabular-nums">
            {draft.size} de {allSources.length} seleccionados
          </span>
          <div className="flex gap-1">
            <Button type="button" variant="ghost" size="sm" onClick={selectAll}>
              Todos
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={selectNone}>
              Solo uno
            </Button>
          </div>
        </div>
        <ScrollArea className="h-[min(50vh,420px)] rounded-xl border">
          <div className="space-y-4 p-2">
            {(
              [
                { title: SCOPE_LABELS.national, sources: nationalSources },
                { title: SCOPE_LABELS.canarias, sources: canariasSources },
              ] as const
            ).map(
              (section) =>
                section.sources.length > 0 && (
                  <section key={section.title}>
                    <h3 className="mb-1.5 px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      {section.title}
                    </h3>
                    <ul className="grid gap-0.5 sm:grid-cols-2">
                      {section.sources.map((source) => {
                        const checked = draft.has(source.id);
                        const off = source.enabled === false;
                        return (
                          <li key={source.id}>
                            <label
                              className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-lg px-2.5 py-2.5 transition-colors hover:bg-muted/70 ${
                                checked ? "bg-accent/60" : ""
                              }`}
                            >
                              <input
                                type="checkbox"
                                className="mt-0.5 size-4 shrink-0 accent-primary"
                                checked={checked}
                                onChange={() => toggle(source.id)}
                              />
                              <span className="min-w-0 flex-1 text-sm">
                                <span className="flex items-center gap-2 font-medium">
                                  <span
                                    className="size-2 shrink-0 rounded-full"
                                    style={{ backgroundColor: source.accent }}
                                    aria-hidden
                                  />
                                  {source.name}
                                </span>
                                {off ? (
                                  <span className="mt-0.5 block text-xs text-muted-foreground">
                                    Sin RSS disponible por ahora
                                  </span>
                                ) : null}
                              </span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ),
            )}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button type="button" size="lg" className="w-full sm:w-auto" onClick={apply}>
            Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
