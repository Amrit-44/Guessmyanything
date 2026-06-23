import { NextRequest, NextResponse } from "next/server";
import { learnFromFailure } from "@/lib/game-service";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const sessionId = body?.sessionId;
    const correctAnswer = body?.correctAnswer;
    const category = body?.category;
    const description = body?.description;
    if (!sessionId || !correctAnswer) {
      return NextResponse.json(
        { error: "sessionId and correctAnswer are required" },
        { status: 400 }
      );
    }
    const res = await learnFromFailure(
      sessionId,
      String(correctAnswer),
      category,
      description
    );
    return NextResponse.json(res);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to record learning";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
