import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl;
    const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
    const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") ?? "50")));
    const search = url.searchParams.get("search") ?? "";
    const categoryId = url.searchParams.get("categoryId") ?? "";

    const where = {
      ...(search ? { name: { contains: search } } : {}),
      ...(categoryId ? { categoryId } : {}),
    };

    const [items, total] = await Promise.all([
      db.entity.findMany({
        where,
        include: {
          category: { select: { name: true, slug: true } },
          subcategory: { select: { name: true, slug: true } },
          tags: { include: { tag: { select: { name: true, slug: true } } } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.entity.count({ where }),
    ]);

    return NextResponse.json({
      items: items.map((e) => ({
        id: e.id,
        name: e.name,
        slug: e.slug,
        description: e.description,
        category: e.category,
        subcategory: e.subcategory,
        difficulty: e.difficulty,
        popularity: e.popularity,
        isActive: e.isActive,
        tags: e.tags.map((t) => t.tag.name),
        createdAt: e.createdAt,
      })),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to list entities";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, categoryId, subcategoryId, tags, difficulty, popularity } = body;
    if (!name || !categoryId) {
      return NextResponse.json({ error: "name and categoryId required" }, { status: 400 });
    }

    const slug = String(name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const tagSlugs: string[] = [];
    // Create / fetch tags
    const tagRecords = await Promise.all(
      (tags as string[]).map(async (t: string) => {
        const tslug = String(t)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
        tagSlugs.push(tslug);
        const existing = await db.tag.findUnique({ where: { slug: tslug } });
        if (existing) return existing;
        return db.tag.create({ data: { name: t, slug: tslug } });
      })
    );

    const entity = await db.entity.create({
      data: {
        name: String(name),
        slug,
        description: description ?? null,
        categoryId: String(categoryId),
        subcategoryId: subcategoryId ?? null,
        difficulty: difficulty ? Number(difficulty) : 1,
        popularity: popularity ? Number(popularity) : 50,
        tagCache: tagSlugs.join(","),
        tags: {
          create: tagRecords.map((t) => ({ tagId: t.id, weight: 1 })),
        },
      },
    });

    return NextResponse.json({ id: entity.id, ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create entity";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
