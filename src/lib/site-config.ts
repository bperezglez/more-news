/** Prefijo de ruta para URLs de la app (p. ej. manifest, API, SW). */
export function assetUrl(pathname: string): string {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return path;
}
