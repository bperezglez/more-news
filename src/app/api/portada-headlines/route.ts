import { NextResponse } from "next/server";
import { getReadablePortadaFeed } from "@/lib/newspapers/build-portada-feed";

export const maxDuration = 60;

export async function GET() {
  try {
    const feed = await getReadablePortadaFeed();
    return NextResponse.json(feed);
  } catch (err) {
    console.error("[api/portada-headlines]", err);
    const message = err instanceof Error ? err.message : "Error al obtener titulares de portada";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
