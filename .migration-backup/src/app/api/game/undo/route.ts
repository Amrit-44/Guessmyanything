import { NextRequest, NextResponse } from "next/server";
import { undoLastAnswer } from "@/lib/game-service";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const sessionId = body?.sessionId;
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }
    const snapshot = await undoLastAnswer(sessionId);
    return NextResponse.json(snapshot);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to undo";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
