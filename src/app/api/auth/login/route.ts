import { NextRequest, NextResponse } from "next/server";
import {
  checkCredentials,
  createSessionToken,
  getAuthMode,
  SESSION_COOKIE,
  SESSION_MAX_AGE_S,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  if (getAuthMode() === "misconfigured") {
    return NextResponse.json(
      { error: "El servidor no tiene configurados APP_USERNAME y APP_PASSWORD." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    username?: unknown;
    password?: unknown;
  };
  const username = typeof body.username === "string" ? body.username : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!checkCredentials(username, password)) {
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json(
      { error: "Usuario o contraseña incorrectos." },
      { status: 401 },
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_S,
  });
  return res;
}
