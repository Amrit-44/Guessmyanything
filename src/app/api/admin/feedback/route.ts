import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const items = await db.feedback.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({
      items: items.map((f) => ({
        id: f.id,
        type: f.type,
        message: f.message,
        rating: f.rating,
        context: f.context,
        createdAt: f.createdAt,
      })),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load feedback";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
