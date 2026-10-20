"use client";

import { useCallback, useEffect, useState } from "react";
import { DownloadIcon, ShareIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "more-news:pwa-install-dismiss";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIosSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !(window as Window & { MSStream?: unknown }).MSStream;
}

export function InstallAppButton({ className }: { className?: string }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (isStandalone()) return;
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch {
      /* ignore */
    }

    const onInstallable = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setHidden(false);
    };

    window.addEventListener("beforeinstallprompt", onInstallable);
    if (isIosSafari()) setHidden(false);

    return () => window.removeEventListener("beforeinstallprompt", onInstallable);
  }, []);

  const dismiss = useCallback(() => {
    setHidden(true);
    setIosHint(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  const install = useCallback(async () => {
    if (isIosSafari() && !deferred) {
      setIosHint(true);
      return;
    }
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    if (outcome === "accepted") dismiss();
    else setHidden(true);
  }, [deferred, dismiss]);

  if (hidden || isStandalone()) return null;

  return (
    <div
      className={cn(
        "relative flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 pl-1 pr-0.5",
        className,
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 gap-1.5 rounded-full px-2.5 text-xs font-medium sm:px-3 sm:text-sm"
        onClick={() => void install()}
      >
        {isIosSafari() && !deferred ? (
          <ShareIcon className="size-3.5 sm:size-4" />
        ) : (
          <DownloadIcon className="size-3.5 sm:size-4" />
        )}
        <span className="hidden sm:inline">Instalar app</span>
        <span className="sm:hidden">Instalar</span>
      </Button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Ocultar aviso de instalación"
        className="grid size-7 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <XIcon className="size-3.5" />
      </button>
      {iosHint ? (
        <span className="absolute top-full right-0 z-50 mt-2 max-w-[16rem] rounded-xl border bg-popover px-3 py-2 text-left text-xs text-popover-foreground shadow-lg">
          En Safari: pulsa <strong>Compartir</strong> y elige{" "}
          <strong>Añadir a pantalla de inicio</strong>.
        </span>
      ) : null}
    </div>
  );
}

/** Banner bajo el header en móvil cuando conviene explicar iOS. */
export function InstallAppHint() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isStandalone() || !isIosSafari()) return;
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch {
      return;
    }
    setShow(true);
  }, []);

  if (!show) return null;

  return (
    <div className="border-b border-primary/15 bg-primary/5 px-4 py-2.5 text-center text-xs text-muted-foreground sm:text-sm">
      Para instalar en iPhone o iPad:{" "}
      <span className="font-medium text-foreground">
        Compartir → Añadir a pantalla de inicio
      </span>
      .
      <button
        type="button"
        className="ml-2 underline underline-offset-2 hover:text-foreground"
        onClick={() => {
          setShow(false);
          try {
            localStorage.setItem(DISMISS_KEY, "1");
          } catch {
            /* ignore */
          }
        }}
      >
        Entendido
      </button>
    </div>
  );
}
