import { NextRequest, NextResponse } from "next/server";
import { analyzeArticle } from "@/lib/newspapers/article-access";
import type { OriginalAccess } from "@/lib/newspapers/types";

export const maxDuration = 30;

const REASONS: Record<Exclude<OriginalAccess, "free" | "subscriber_readable">, string> = {
  paywalled: "Esta noticia es solo para suscriptores del medio.",
  blocked: "El medio no permite leer esta noticia desde la app.",
  unextractable: "No se ha podido extraer el texto de la noticia.",
};

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Falta el parámetro url" }, { status: 400 });
  }

  const analysis = await analyzeArticle(url);
  if (
    (analysis.access === "free" || analysis.access === "subscriber_readable") &&
    analysis.article
  ) {
    return NextResponse.json({ ...analysis.article, access: analysis.access });
  }

  const access =
    analysis.access === "free" || analysis.access === "subscriber_readable"
      ? "unextractable"
      : analysis.access;
  return NextResponse.json(
    { error: REASONS[access], access },
    { status: 403 },
  );
}
