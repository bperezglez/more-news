import { HeadlinesDashboard } from "@/components/news/headlines-dashboard";
import { LogoutButton } from "@/components/logout-button";
import { isStaticHosting } from "@/lib/site-config";

export default function Home() {
  return (
    <div className="min-h-full bg-background">
      <header className="border-b bg-card/50">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 sm:px-6">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Agregador personal
            </p>
            {isStaticHosting ? null : <LogoutButton />}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">More News</h1>
          <p className="max-w-2xl text-muted-foreground">
            Titulares de varios periódicos digitales, leídos enteros dentro de la app
            cuando la noticia está en abierto. Si el original es de pago, se busca la
            misma noticia en otro medio que la publique gratis.
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <HeadlinesDashboard />
      </main>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        Los contenidos pertenecen a sus respectivos medios. Esta app no los comercializa.
      </footer>
    </div>
  );
}
