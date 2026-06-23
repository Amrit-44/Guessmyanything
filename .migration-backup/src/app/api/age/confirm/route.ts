import { NextRequest, NextResponse } from "next/server";
import { confirmAgeGuess } from "@/lib/age-service";
export const runtime = "nodejs";
export async function POST(req: NextRequest) { try { const b = await req.json().catch(() => ({})); if (!b?.sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 }); return NextResponse.json(await confirmAgeGuess(b.sessionId, Boolean(b?.correct))); } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 }); } }
