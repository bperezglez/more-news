/**
 * Lee una respuesta JSON sin romper cuando el servidor devuelve una página de error
 * o un cuerpo vacío (p. ej. un tiempo de espera agotado en Vercel).
 */
export async function readJson<T>(res: Response): Promise<T & { error?: string }> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T & { error?: string };
  } catch {
    const reason =
      res.status === 504 || res.status === 502
        ? "El servidor tardó demasiado en responder. Vuelve a intentarlo en unos segundos."
        : `Respuesta inesperada del servidor (HTTP ${res.status}).`;
    return { error: reason } as T & { error?: string };
  }
}
