import { NextRequest, NextResponse } from "next/server";
import { getSnapshot } from "@/lib/game-service";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get("sessionId");
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }
    const snapshot = await getSnapshot(sessionId);
    if (!snapshot) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    return NextResponse.json(snapshot);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to get state";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
