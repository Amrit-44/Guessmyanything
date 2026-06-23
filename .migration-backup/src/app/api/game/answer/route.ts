import { NextRequest, NextResponse } from "next/server";
import { answerQuestion } from "@/lib/game-service";
import type { Answer } from "@/lib/engine";

export const runtime = "nodejs";

const VALID: Answer[] = ["yes", "probably", "dont_know", "probably_not", "no"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const sessionId = body?.sessionId;
    const answer = body?.answer as Answer;
    if (!sessionId || !answer) {
      return NextResponse.json(
        { error: "sessionId and answer are required" },
        { status: 400 }
      );
    }
    if (!VALID.includes(answer)) {
      return NextResponse.json({ error: "Invalid answer" }, { status: 400 });
    }
    const snapshot = await answerQuestion(sessionId, answer);
    return NextResponse.json(snapshot);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to process answer";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
