import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const e = await db.entity.findUnique({
      where: { id },
      include: {
        category: { select: { name: true, slug: true } },
        subcategory: { select: { name: true, slug: true } },
        tags: { include: { tag: { select: { name: true, slug: true } } } },
      },
    });
    if (!e) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({
      id: e.id,
      name: e.name,
      slug: e.slug,
      description: e.description,
      categoryId: e.categoryId,
      category: e.category,
      subcategoryId: e.subcategoryId,
      subcategory: e.subcategory,
      difficulty: e.difficulty,
      popularity: e.popularity,
      isActive: e.isActive,
      tags: e.tags.map((t) => t.tag.name),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to get entity";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, description, categoryId, subcategoryId, tags, difficulty, popularity, isActive } = body;

    const existing = await db.entity.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Rebuild tags if provided.
    let tagSlugs: string[] = [];
    if (Array.isArray(tags)) {
      await db.entityTag.deleteMany({ where: { entityId: id } });
      const tagRecords = await Promise.all(
        (tags as string[]).map(async (t: string) => {
          const tslug = String(t)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
          tagSlugs.push(tslug);
          const ex = await db.tag.findUnique({ where: { slug: tslug } });
          if (ex) return ex;
          return db.tag.create({ data: { name: t, slug: tslug } });
        })
      );
      await db.entityTag.createMany({
        data: tagRecords.map((t) => ({ entityId: id, tagId: t.id, weight: 1 })),
      });
    }

    const updated = await db.entity.update({
      where: { id },
      data: {
        name: name !== undefined ? String(name) : undefined,
        description: description !== undefined ? String(description) : undefined,
        categoryId: categoryId !== undefined ? String(categoryId) : undefined,
        subcategoryId: subcategoryId === null ? null : subcategoryId !== undefined ? String(subcategoryId) : undefined,
        difficulty: difficulty !== undefined ? Number(difficulty) : undefined,
        popularity: popularity !== undefined ? Number(popularity) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        tagCache: tagSlugs.length ? tagSlugs.join(",") : undefined,
      },
    });

    return NextResponse.json({ id: updated.id, ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to update entity";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.entity.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to delete entity";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
