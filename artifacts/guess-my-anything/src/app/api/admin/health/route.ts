import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export const runtime = "nodejs";
export async function GET() {
  try {
    const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true, slug: true, color: true, icon: true, _count: { select: { entities: { where: { isActive: true } }, questions: { where: { isActive: true } } } } } });
    const categoryStats = await Promise.all(categories.map(async cat => {
      const entities = await db.entity.findMany({ where: { categoryId: cat.id, isActive: true }, select: { id: true, name: true, _count: { select: { tags: true } } } });
      const entitiesMissingTags = entities.filter(e => e._count.tags === 0).length;
      const entityTags = await db.entityTag.findMany({ where: { entity: { categoryId: cat.id } }, select: { tagId: true }, distinct: ["tagId"] });
      const tagCount = entityTags.length;
      const questions = await db.question.findMany({ where: { categoryId: cat.id, isActive: true }, select: { id: true, primaryTagId: true, timesAsked: true } });
      const questionCount = questions.length;
      const questionTagIds = new Set(questions.map(q => q.primaryTagId));
      const tagsMissingQuestions = entityTags.filter(et => !questionTagIds.has(et.tagId)).length;
      const coverageScore = tagCount > 0 ? Math.round(((tagCount - tagsMissingQuestions) / tagCount) * 100) : 0;
      const avgTagsPerEntity = entities.length > 0 ? entities.reduce((s, e) => s + e._count.tags, 0) / entities.length : 0;
      const accuracyEstimate = Math.min(95, Math.round(coverageScore * 0.4 + Math.min(avgTagsPerEntity * 10, 40) + Math.min(questionCount * 2, 20)));
      return { id: cat.id, name: cat.name, slug: cat.slug, color: cat.color, icon: cat.icon, entityCount: entities.length, tagCount, questionCount, entitiesMissingTags, tagsMissingQuestions, coverageScore, accuracyEstimate, avgTagsPerEntity: Math.round(avgTagsPerEntity * 10) / 10 };
    }));
    const [totalEntities, totalQuestions, totalTags, totalAgeQuestions] = await Promise.all([db.entity.count({ where: { isActive: true } }), db.question.count({ where: { isActive: true } }), db.tag.count(), db.ageQuestion.count({ where: { isActive: true } })]);
    const [ageGames, ageWon] = await Promise.all([db.ageResult.count(), db.ageResult.count({ where: { won: true } })]);
    const ageWinRate = ageGames > 0 ? Math.round((ageWon / ageGames) * 100) : 0;
    const weakCategories = categoryStats.filter(c => c.coverageScore < 70 || c.questionCount < 15).sort((a, b) => a.coverageScore - b.coverageScore);
    return NextResponse.json({ summary: { totalCategories: categories.length, totalEntities, totalQuestions, totalTags, totalAgeQuestions, ageGames, ageWinRate }, categories: categoryStats, weakCategories });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 }); }
}
