import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl; const categorySlug = url.searchParams.get("category") ?? "jobs"; const search = url.searchParams.get("search") ?? "";
    const category = await db.category.findUnique({ where: { slug: categorySlug } });
    if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });
    const entityTags = await db.entityTag.findMany({ where: { entity: { categoryId: category.id } }, select: { tagId: true, entityId: true, tag: { select: { id: true, name: true, slug: true } } } });
    const questions = await db.question.findMany({ where: { categoryId: category.id }, select: { id: true, text: true, primaryTagId: true } });
    const tagJobs = new Map<string, Set<string>>(); const tagQuestions = new Map<string, { id: string; text: string }[]>(); const tagInfo = new Map<string, { id: string; name: string; slug: string }>();
    for (const et of entityTags) { if (!tagInfo.has(et.tag.id)) tagInfo.set(et.tag.id, et.tag); let set = tagJobs.get(et.tagId); if (!set) { set = new Set(); tagJobs.set(et.tagId, set); } set.add(et.entityId); }
    for (const q of questions) { let arr = tagQuestions.get(q.primaryTagId); if (!arr) { arr = []; tagQuestions.set(q.primaryTagId, arr); } arr.push({ id: q.id, text: q.text }); }
    let tags = Array.from(tagInfo.values()).map(t => ({ id: t.id, name: t.name, slug: t.slug, jobCount: tagJobs.get(t.id)?.size ?? 0, questionCount: tagQuestions.get(t.id)?.length ?? 0, isIndustry: t.slug.startsWith("industry-") }));
    if (search) { const s = search.toLowerCase(); tags = tags.filter(t => t.name.toLowerCase().includes(s) || t.slug.includes(s)); }
    tags.sort((a, b) => { if (a.isIndustry !== b.isIndustry) return a.isIndustry ? -1 : 1; if (b.jobCount !== a.jobCount) return b.jobCount - a.jobCount; return a.name.localeCompare(b.name); });
    return NextResponse.json({ tags, total: tags.length, category: category.name });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 }); }
}
