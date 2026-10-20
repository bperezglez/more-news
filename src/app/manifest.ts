import type { MetadataRoute } from "next";
import { assetUrl } from "@/lib/site-config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: assetUrl("/"),
    name: "More News",
    short_name: "More News",
    description: "Titulares de prensa digital en abierto, en un solo lugar",
    start_url: assetUrl("/"),
    scope: assetUrl("/"),
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    background_color: "#f8fafc",
    theme_color: "#151821",
    lang: "es",
    dir: "ltr",
    orientation: "portrait-primary",
    categories: ["news", "magazines"],
    icons: [
      {
        src: assetUrl("/icons/icon-192.png"),
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: assetUrl("/icons/icon-512.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: assetUrl("/icons/icon-512.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: assetUrl("/icons/icon.svg"),
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
