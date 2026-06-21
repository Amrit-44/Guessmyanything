import { NextResponse } from "next/server";
import { startAgeGame } from "@/lib/age-service";
export const runtime = "nodejs";
export async function POST() {
  try { return NextResponse.json(await startAgeGame()); }
  catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 }); }
}
