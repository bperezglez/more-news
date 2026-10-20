import { NextRequest, NextResponse } from "next/server";
import { fetchRawFeedsSnapshot } from "@/lib/newspapers/fetch-raw-feeds";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;
  const limitPerSource =
    limit !== undefined && Number.isFinite(limit) && limit > 0 ? limit : undefined;

  try {
    const snapshot = await fetchRawFeedsSnapshot(
      limitPerSource !== undefined ? { limitPerSource } : {},
    );
    return NextResponse.json(snapshot);
  } catch (err) {
    console.error("[api/raw-feeds]", err);
    const message = err instanceof Error ? err.message : "Error al leer RSS";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
