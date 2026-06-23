import { NextRequest, NextResponse } from "next/server";
import { startGame } from "@/lib/game-service";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const category = body?.category ?? null;
    const snapshot = await startGame(category ?? null);
    return NextResponse.json(snapshot);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to start game";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
