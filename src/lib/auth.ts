import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "more_news_session";
export const SESSION_MAX_AGE_S = 30 * 24 * 60 * 60;

export type AuthMode = "enabled" | "disabled" | "misconfigured";

/**
 * Sin APP_USERNAME / APP_PASSWORD en desarrollo la app queda abierta para trabajar en
 * local; en producción se cierra por completo hasta que se configuren.
 */
export function getAuthMode(): AuthMode {
  if (process.env.APP_USERNAME && process.env.APP_PASSWORD) return "enabled";
  return process.env.NODE_ENV === "production" ? "misconfigured" : "disabled";
}

function secret(): string {
  return (
    process.env.AUTH_SECRET ||
    createHash("sha256")
      .update(`${process.env.APP_USERNAME}:${process.env.APP_PASSWORD}`)
      .digest("hex")
  );
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function checkCredentials(username: string, password: string): boolean {
  if (getAuthMode() !== "enabled") return false;
  const userOk = safeEqual(username, process.env.APP_USERNAME!);
  const passOk = safeEqual(password, process.env.APP_PASSWORD!);
  return userOk && passOk;
}

export function createSessionToken(): string {
  const expires = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_S;
  const payload = `${process.env.APP_USERNAME}.${expires}`;
  return `${expires}.${sign(payload)}`;
}

export function isValidSessionToken(token: string | undefined): boolean {
  if (!token || getAuthMode() !== "enabled") return false;
  const [expiresRaw, signature] = token.split(".");
  const expires = Number(expiresRaw);
  if (!signature || !Number.isFinite(expires) || expires * 1000 < Date.now()) {
    return false;
  }
  return safeEqual(signature, sign(`${process.env.APP_USERNAME}.${expires}`));
}

/** Solo rutas internas, para no convertir ?next= en un redirector abierto. */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}
