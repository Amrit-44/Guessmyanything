import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { entities } = body as {
      entities: {
        name: string;
        category: string; // slug
        subcategory?: string;
        description?: string;
        tags: string[];
        difficulty?: number;
        popularity?: number;
      }[];
    };

    if (!Array.isArray(entities)) {
      return NextResponse.json({ error: "entities array required" }, { status: 400 });
    }

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const e of entities) {
      try {
        const cat = await db.category.findUnique({ where: { slug: e.category } });
        if (!cat) {
          skipped++;
          errors.push(`Category not found: ${e.category}`);
          continue;
        }
        let subId: string | null = null;
        if (e.subcategory) {
          const sub = await db.subcategory.findFirst({
            where: { slug: e.subcategory, categoryId: cat.id },
          });
          subId = sub?.id ?? null;
        }
        const slug = String(e.name)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

        const exists = await db.entity.findUnique({
          where: { categoryId_slug: { categoryId: cat.id, slug } },
        });
        if (exists) {
          skipped++;
          continue;
        }

        const tagSlugs: string[] = [];
        const tagIds: string[] = [];
        for (const t of e.tags) {
          const tslug = String(t)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
          tagSlugs.push(tslug);
          let tag = await db.tag.findUnique({ where: { slug: tslug } });
          if (!tag) tag = await db.tag.create({ data: { name: t, slug: tslug } });
          tagIds.push(tag.id);
        }

        const ent = await db.entity.create({
          data: {
            name: e.name,
            slug,
            description: e.description ?? null,
            categoryId: cat.id,
            subcategoryId: subId,
            difficulty: e.difficulty ?? 1,
            popularity: e.popularity ?? 50,
            tagCache: tagSlugs.join(","),
            tags: { create: tagIds.map((id) => ({ tagId: id, weight: 1 })) },
          },
        });
        created++;
        void ent;
      } catch (err) {
        skipped++;
        errors.push(err instanceof Error ? err.message : "unknown error");
      }
    }

    return NextResponse.json({ created, skipped, errors: errors.slice(0, 20) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to bulk import";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
