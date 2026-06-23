import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const [
      totalEntities,
      totalQuestions,
      totalGames,
      totalWon,
      totalLost,
      totalLearnings,
      pendingLearnings,
      totalFeedback,
      categories,
      recentResults,
    ] = await Promise.all([
      db.entity.count({ where: { isActive: true } }),
      db.question.count({ where: { isActive: true } }),
      db.gameResult.count(),
      db.gameResult.count({ where: { won: true } }),
      db.gameResult.count({ where: { won: false } }),
      db.learning.count(),
      db.learning.count({ where: { status: "pending" } }),
      db.feedback.count(),
      db.category.findMany({
        orderBy: { sortOrder: "asc" },
        select: {
          name: true,
          slug: true,
          color: true,
          icon: true,
          _count: { select: { entities: { where: { isActive: true } } } },
        },
      }),
      db.gameResult.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          category: true,
          questionCount: true,
          won: true,
          guessedEntity: true,
          correctEntity: true,
          createdAt: true,
        },
      }),
    ]);

    const winRate = totalGames > 0 ? Math.round((totalWon / totalGames) * 100) : 0;

    return NextResponse.json({
      stats: {
        totalEntities,
        totalQuestions,
        totalGames,
        totalWon,
        totalLost,
        winRate,
        totalLearnings,
        pendingLearnings,
        totalFeedback,
      },
      categories: categories.map((c) => ({
        name: c.name,
        slug: c.slug,
        color: c.color,
        icon: c.icon,
        count: c._count.entities,
      })),
      recentResults,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load dashboard";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
