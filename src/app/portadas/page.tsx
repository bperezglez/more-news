import Link from "next/link";
import { RawFeedsExplorer } from "@/components/news/raw-feeds-explorer";
import { SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function PortadasPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-16 sm:px-6 sm:pt-10 lg:px-8">
        <section className="mb-8 max-w-3xl space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Herramienta interna
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Portadas RSS por medio
          </h1>
          <p className="text-sm text-pretty text-muted-foreground sm:text-base">
            Inspecciona qué devuelve cada feed en el orden de la portada (no cronológico). Sirve
            para valorar si podemos sincronizar titulares respetando la jerarquía editorial en
            lugar del orden por fecha que usa hoy el listado global.
          </p>
          <p className="text-sm text-muted-foreground">
            También puedes ejecutar{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">npm run inspect:feeds</code>{" "}
            para volcar{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">public/data/raw-feeds.json</code>{" "}
            y un resumen en consola.
          </p>
          <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Volver al inicio
          </Link>
        </section>
        <RawFeedsExplorer />
      </main>
    </div>
  );
}
