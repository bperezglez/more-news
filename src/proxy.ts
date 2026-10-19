import { NextRequest, NextResponse } from "next/server";
import { getAuthMode, isValidSessionToken, SESSION_COOKIE } from "@/lib/auth";

export function proxy(request: NextRequest) {
  const mode = getAuthMode();
  if (mode === "disabled") return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");

  if (mode === "misconfigured") {
    if (isApi) {
      return NextResponse.json(
        { error: "Faltan APP_USERNAME y APP_PASSWORD en el servidor" },
        { status: 503 },
      );
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isValidSessionToken(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.next();
  }

  if (isApi) {
    return NextResponse.json({ error: "Sesión no válida" }, { status: 401 });
  }

  const login = new URL("/login", request.url);
  login.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons/|login|api/auth/).*)",
  ],
};
