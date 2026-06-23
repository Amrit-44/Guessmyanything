import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const settings = await db.setting.findMany({
      orderBy: { group: "asc" },
    });
    return NextResponse.json({
      settings: settings.map((s) => ({
        id: s.id,
        key: s.key,
        value: s.value,
        type: s.type,
        group: s.group,
        label: s.label,
      })),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load settings";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { settings } = body as { settings: { key: string; value: string }[] };
    if (!Array.isArray(settings)) {
      return NextResponse.json({ error: "settings array required" }, { status: 400 });
    }
    for (const s of settings) {
      await db.setting.update({
        where: { key: s.key },
        data: { value: String(s.value) },
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to update settings";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
