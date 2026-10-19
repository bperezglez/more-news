import { NextRequest, NextResponse } from "next/server";
import { fetchArticleContent } from "@/lib/newspapers/fetch-article";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Falta el parámetro url" }, { status: 400 });
  }

  try {
    const article = await fetchArticleContent(url);
    return NextResponse.json(article);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al leer el artículo";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
