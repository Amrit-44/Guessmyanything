import { NextRequest, NextResponse } from "next/server";
import { confirmGuess } from "@/lib/game-service";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const sessionId = body?.sessionId;
    const correct = Boolean(body?.correct);
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }
    const snapshot = await confirmGuess(sessionId, correct);
    return NextResponse.json(snapshot);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to confirm guess";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
