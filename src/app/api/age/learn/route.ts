import { NextRequest, NextResponse } from "next/server";
import { learnAgeFromFailure } from "@/lib/age-service";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { sessionId, actualAge } = body;
    if (!sessionId || !actualAge || actualAge < 0 || actualAge > 150) return NextResponse.json({ error: "Invalid" }, { status: 400 });
    return NextResponse.json(await learnAgeFromFailure(sessionId, Number(actualAge)));
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 }); }
}
