import { NextResponse } from "next/server";
import { getReadableFeed } from "@/lib/newspapers/build-feed";

export async function GET() {
  try {
    const feed = await getReadableFeed();
    return NextResponse.json(feed);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al obtener titulares";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
