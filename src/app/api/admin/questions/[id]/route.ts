import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { text, tag, categoryId, inverted, isActive } = body;

    const existing = await db.question.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let primaryTagId = existing.primaryTagId;
    if (tag) {
      const tslug = String(tag)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      let tagRow = await db.tag.findUnique({ where: { slug: tslug } });
      if (!tagRow) tagRow = await db.tag.create({ data: { name: tag, slug: tslug } });
      primaryTagId = tagRow.id;
    }

    const updated = await db.question.update({
      where: { id },
      data: {
        text: text !== undefined ? String(text) : undefined,
        primaryTagId,
        categoryId: categoryId === null ? null : categoryId !== undefined ? String(categoryId) : undefined,
        inverted: inverted !== undefined ? Boolean(inverted) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
    });
    return NextResponse.json({ id: updated.id, ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to update question";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.question.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to delete question";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
