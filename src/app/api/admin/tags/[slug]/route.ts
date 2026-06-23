import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
export const runtime = "nodejs";
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params; const tag = await db.tag.findUnique({ where: { slug } });
    if (!tag) return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    const entityTags = await db.entityTag.findMany({ where: { tagId: tag.id }, select: { entity: { select: { id: true, name: true, description: true, isActive: true, category: { select: { name: true } }, subcategory: { select: { name: true } } } } } });
    const jobs = entityTags.map(et => et.entity).sort((a, b) => a.name.localeCompare(b.name));
    const questions = await db.question.findMany({ where: { primaryTagId: tag.id }, select: { id: true, text: true, inverted: true, isActive: true, timesAsked: true, successCount: true, failCount: true, category: { select: { name: true } } }, orderBy: { text: "asc" } });
    return NextResponse.json({ tag: { id: tag.id, name: tag.name, slug: tag.slug }, jobs: jobs.map(j => ({ id: j.id, name: j.name, description: j.description, isActive: j.isActive, category: j.category.name, subcategory: j.subcategory?.name ?? null })), jobCount: jobs.length, questions: questions.map(q => ({ id: q.id, text: q.text, inverted: q.inverted, isActive: q.isActive, timesAsked: q.timesAsked, category: q.category?.name ?? null, effectiveness: q.timesAsked > 0 ? Math.round((q.successCount / q.timesAsked) * 100) : null })), questionCount: questions.length });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 }); }
}
