"use client";

import { useEffect } from "react";
import { assetUrl, basePath } from "@/lib/site-config";

export function PwaProvider() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        await navigator.serviceWorker.register(assetUrl("/sw.js"), {
          scope: basePath ? `${basePath}/` : "/",
          updateViaCache: "none",
        });
      } catch {
        // PWA opcional; la app funciona sin service worker
      }
    };

    void register();
  }, []);

  return null;
}
