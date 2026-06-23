import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl;
    const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
    const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") ?? "50")));
    const search = url.searchParams.get("search") ?? "";

    const where = search ? { text: { contains: search } } : {};

    const [items, total] = await Promise.all([
      db.question.findMany({
        where,
        include: {
          primaryTag: { select: { name: true, slug: true } },
          category: { select: { name: true, slug: true } },
        },
        orderBy: { sortOrder: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.question.count({ where }),
    ]);

    return NextResponse.json({
      items: items.map((q) => ({
        id: q.id,
        text: q.text,
        tag: q.primaryTag.name,
        tagSlug: q.primaryTag.slug,
        inverted: q.inverted,
        category: q.category?.name ?? null,
        categoryId: q.categoryId,
        timesAsked: q.timesAsked,
        successCount: q.successCount,
        failCount: q.failCount,
        isActive: q.isActive,
        effectiveness:
          q.timesAsked > 0
            ? Math.round((q.successCount / q.timesAsked) * 100)
            : null,
      })),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to list questions";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, tag, categoryId, inverted } = body;
    if (!text || !tag) {
      return NextResponse.json({ error: "text and tag required" }, { status: 400 });
    }
    const tslug = String(tag)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    let tagRow = await db.tag.findUnique({ where: { slug: tslug } });
    if (!tagRow) tagRow = await db.tag.create({ data: { name: tag, slug: tslug } });

    const q = await db.question.create({
      data: {
        text: String(text),
        primaryTagId: tagRow.id,
        categoryId: categoryId ?? null,
        inverted: Boolean(inverted),
      },
    });
    return NextResponse.json({ id: q.id, ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create question";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
