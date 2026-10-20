"use client";

import { useMemo, useState } from "react";
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
import { setVisibleSourceIds } from "@/lib/newspapers/source-preferences";

type Props = {
  visibleIds: Set<string>;
  onChange: (ids: Set<string>) => void;
};

export function SourceFilterDialog({ visibleIds, onChange }: Props) {
  const allSources = useMemo(() => getAllPrincipalSources(), []);
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
          <Button variant="outline" size="sm">
            Medios ({visibleIds.size}/{allSources.length})
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Medios que quiero ver</DialogTitle>
          <DialogDescription>
            Elige en qué pestañas filtrar. La misma lógica de lectura en abierto y
            cobertura alternativa se aplica a todos los medios activos.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={selectAll}>
            Todos
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={selectNone}>
            Solo uno
          </Button>
        </div>
        <ScrollArea className="h-[min(50vh,420px)] rounded-md border pr-3">
          <ul className="space-y-1 p-3">
            {allSources.map((source) => {
              const checked = draft.has(source.id);
              const off = source.enabled === false;
              return (
                <li key={source.id}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 hover:bg-muted/60">
                    <input
                      type="checkbox"
                      className="mt-1 size-4 shrink-0 accent-primary"
                      checked={checked}
                      onChange={() => toggle(source.id)}
                    />
                    <span className="min-w-0 flex-1 text-sm">
                      <span className="font-medium">{source.name}</span>
                      {off ? (
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          Sin RSS en el servidor; aparecerá vacío hasta tener feed
                          válido.
                        </span>
                      ) : null}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
        <DialogFooter>
          <Button type="button" onClick={apply}>
            Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
