import { isReadableInApp } from "./headline-rank";
import type { ReadableHeadline } from "./types";

export type AccessChipTone =
  | "open"
  | "subscriber-in-app"
  | "alternative"
  | "locked"
  | "pending";

function unreadableLabel(headline: ReadableHeadline): string {
  if (headline.originalAccess === "paywalled") return "Solo suscriptores";
  if (headline.originalAccess === "blocked") return "No accesible desde la app";
  return "Sin lectura integrada";
}

/** Etiqueta bajo la tarjeta: deja claro si se puede leer en la app o hay que ir al medio. */
export function accessChipForHeadline(headline: ReadableHeadline): {
  tone: AccessChipTone;
  label: string;
  title?: string;
} {
  const alt = headline.alternative;
  if (alt) {
    return {
      tone: "alternative",
      label: `Vía ${alt.sourceName}`,
      title: "El original no se puede leer aquí; se muestra la cobertura abierta de otro medio.",
    };
  }
  if (headline.originalAccess === "pending") {
    return { tone: "pending", label: "Comprobando acceso…" };
  }
  if (!isReadableInApp(headline)) {
    return {
      tone: "locked",
      label: unreadableLabel(headline),
      title: "Abre la web del medio para leer esta noticia.",
    };
  }
  if (headline.originalAccess === "subscriber_readable") {
    return {
      tone: "subscriber-in-app",
      label: "Puedes leerla aquí",
      title:
        "En la web del medio aparece como contenido de suscripción, pero el texto completo está disponible en More News.",
    };
  }
  return {
    tone: "open",
    label: "En abierto",
    title: "Artículo accesible en abierto en la web del medio.",
  };
}
