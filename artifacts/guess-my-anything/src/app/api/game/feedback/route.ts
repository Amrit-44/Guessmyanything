import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const type = body?.type;
    const message = body?.message;
    const rating = body?.rating;
    const context = body?.context;
    if (!type || !message) {
      return NextResponse.json({ error: "type and message required" }, { status: 400 });
    }
    await db.feedback.create({
      data: {
        type: String(type),
        message: String(message),
        rating: rating ? Number(rating) : null,
        context: context ? JSON.stringify(context) : null,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to submit feedback";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
