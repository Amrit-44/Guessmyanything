import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const categories = await db.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        subcategories: { orderBy: { sortOrder: "asc" } },
        _count: { select: { entities: true } },
      },
    });
    return NextResponse.json({
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        icon: c.icon,
        color: c.color,
        sortOrder: c.sortOrder,
        entityCount: c._count.entities,
        subcategories: c.subcategories.map((s) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
        })),
      })),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load categories";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, icon, color } = body;
    if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
    const slug = String(name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const maxOrder = await db.category.aggregate({ _max: { sortOrder: true } });
    const cat = await db.category.create({
      data: {
        name: String(name),
        slug,
        description: description ?? null,
        icon: icon ?? null,
        color: color ?? null,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      },
    });
    return NextResponse.json({ id: cat.id, ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create category";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
