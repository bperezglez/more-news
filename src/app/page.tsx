import { HeadlinesDashboard } from "@/components/news/headlines-dashboard";
import { SiteHeader } from "@/components/site-header";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-6 pb-16 sm:px-6 sm:pt-10 lg:px-8">
        <section className="mb-6 max-w-2xl sm:mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-4xl">
            Lo importante de hoy, para leer sin muros de pago
          </h1>
          <p className="mt-2 text-sm text-pretty text-muted-foreground sm:text-base">
            Titulares de la prensa digital ordenados por relevancia. Si el original es de
            pago, buscamos la misma noticia en un medio que la publique en abierto.
          </p>
        </section>
        <HeadlinesDashboard />
      </main>
      <footer className="border-t border-border/60 px-4 py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-center text-xs text-muted-foreground">
        Los contenidos pertenecen a sus respectivos medios. Esta app no los comercializa.
      </footer>
    </div>
  );
}
