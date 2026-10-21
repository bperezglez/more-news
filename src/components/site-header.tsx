import Link from "next/link";
import { NewspaperIcon } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { InstallAppButton } from "@/components/pwa/install-app-button";
import { isStaticHosting } from "@/lib/site-config";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/65">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm shadow-primary/30 transition-transform group-hover:scale-105">
            <NewspaperIcon className="size-4" />
          </span>
          <span className="text-base font-semibold tracking-tight">More News</span>
        </Link>
        <div className="flex items-center gap-1.5">
          <Link
            href="/feeds"
            className="hidden rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline"
          >
            Feeds RSS
          </Link>
          <InstallAppButton />
          <ThemeToggle />
          {isStaticHosting ? null : <LogoutButton />}
        </div>
      </div>
    </header>
  );
}
