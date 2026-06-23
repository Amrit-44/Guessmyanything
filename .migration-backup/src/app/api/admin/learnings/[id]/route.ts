import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, notes } = body;
    const updated = await db.learning.update({
      where: { id },
      data: {
        status: status ?? undefined,
        notes: notes !== undefined ? String(notes) : undefined,
      },
    });
    return NextResponse.json({ id: updated.id, ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to update learning";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.learning.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to delete learning";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
