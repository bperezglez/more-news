import { NextResponse } from "next/server";
import { fetchAllHeadlines } from "@/lib/newspapers/fetch-headlines";

export async function GET() {
  try {
    const data = await fetchAllHeadlines();
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al obtener titulares";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
