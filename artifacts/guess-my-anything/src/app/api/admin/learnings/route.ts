import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const status = req.nextUrl.searchParams.get("status");
    const where = status ? { status } : {};
    const items = await db.learning.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({
      items: items.map((l) => ({
        id: l.id,
        correctAnswer: l.correctAnswer,
        category: l.category,
        description: l.description,
        existingEntityId: l.existingEntityId,
        history: l.history,
        aiGuesses: l.aiGuesses,
        status: l.status,
        notes: l.notes,
        createdAt: l.createdAt,
      })),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load learnings";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
