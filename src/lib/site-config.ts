/** Ruta base pública (p. ej. `/more-news` en GitHub Pages). */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Build estático para GitHub Pages (sin API en el servidor). */
export const isStaticHosting = process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";

export function assetUrl(pathname: string): string {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${basePath}${path}`;
}
