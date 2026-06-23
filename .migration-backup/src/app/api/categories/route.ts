import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const categories = await db.category.findMany({
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        icon: true,
        color: true,
        _count: { select: { entities: { where: { isActive: true } } } },
      },
    });
    return NextResponse.json({ categories });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load categories";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
