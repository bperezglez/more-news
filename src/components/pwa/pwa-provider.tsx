"use client";

import { useEffect } from "react";
import { assetUrl, basePath, isStaticHosting } from "@/lib/site-config";

export function PwaProvider() {
  useEffect(() => {
    if (!isStaticHosting || !("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        await navigator.serviceWorker.register(assetUrl("/sw.js"), {
          scope: basePath ? `${basePath}/` : "/",
        });
      } catch {
        // PWA opcional; la app funciona sin service worker
      }
    };

    void register();
  }, []);

  return null;
}
