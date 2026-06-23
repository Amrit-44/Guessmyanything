import { NextRequest, NextResponse } from "next/server";
import { answerAgeQuestion } from "@/lib/age-service";
import type { AgeAnswer } from "@/lib/age-engine";
export const runtime = "nodejs";
const VALID: AgeAnswer[] = ["yes", "probably", "dont_know", "probably_not", "no"];
export async function POST(req: NextRequest) { try { const b = await req.json().catch(() => ({})); const { sessionId, answer } = b as { sessionId?: string; answer?: AgeAnswer }; if (!sessionId || !answer || !VALID.includes(answer)) return NextResponse.json({ error: "Invalid" }, { status: 400 }); return NextResponse.json(await answerAgeQuestion(sessionId, answer)); } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 }); } }
