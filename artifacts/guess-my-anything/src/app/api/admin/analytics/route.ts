import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    // Aggregate analytics from GameResult
    const results = await db.gameResult.findMany({
      select: {
        category: true,
        questionCount: true,
        won: true,
        guessedEntity: true,
        createdAt: true,
      },
    });

    const totalGames = results.length;
    const totalWon = results.filter((r) => r.won).length;
    const avgQuestions =
      totalGames > 0
        ? Math.round(
            (results.reduce((s, r) => s + r.questionCount, 0) / totalGames) * 10
          ) / 10
        : 0;

    // Most guessed entities
    const guessCount = new Map<string, { total: number; won: number }>();
    for (const r of results) {
      const e = r.guessedEntity;
      if (e === "—" || !e) continue;
      const cur = guessCount.get(e) ?? { total: 0, won: 0 };
      cur.total += 1;
      if (r.won) cur.won += 1;
      guessCount.set(e, cur);
    }
    const mostGuessed = [...guessCount.entries()]
      .map(([name, v]) => ({
        name,
        total: v.total,
        won: v.won,
        winRate: Math.round((v.won / v.total) * 100),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 12);

    // Most failed entities
    const mostFailed = [...guessCount.entries()]
      .map(([name, v]) => ({
        name,
        failed: v.total - v.won,
        total: v.total,
        failRate: Math.round(((v.total - v.won) / v.total) * 100),
      }))
      .filter((x) => x.total >= 1)
      .sort((a, b) => b.failed - a.failed)
      .slice(0, 12);

    // Category performance
    const catPerf = new Map<string, { total: number; won: number; qSum: number }>();
    for (const r of results) {
      const c = r.category ?? "Anything";
      const cur = catPerf.get(c) ?? { total: 0, won: 0, qSum: 0 };
      cur.total += 1;
      if (r.won) cur.won += 1;
      cur.qSum += r.questionCount;
      catPerf.set(c, cur);
    }
    const categoryPerformance = [...catPerf.entries()]
      .map(([name, v]) => ({
        name,
        total: v.total,
        won: v.won,
        winRate: Math.round((v.won / v.total) * 100),
        avgQuestions: Math.round((v.qSum / v.total) * 10) / 10,
      }))
      .sort((a, b) => b.total - a.total);

    // Question performance
    const questions = await db.question.findMany({
      where: { timesAsked: { gt: 0 } },
      select: {
        text: true,
        timesAsked: true,
        successCount: true,
        failCount: true,
      },
      orderBy: { timesAsked: "desc" },
      take: 20,
    });
    const questionPerformance = questions.map((q) => ({
      text: q.text,
      timesAsked: q.timesAsked,
      successRate:
        q.timesAsked > 0
          ? Math.round((q.successCount / q.timesAsked) * 100)
          : 0,
      failRate:
        q.timesAsked > 0
          ? Math.round((q.failCount / q.timesAsked) * 100)
          : 0,
    }));

    // Games over last 7 days (simple bucket)
    const now = Date.now();
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now - (6 - i) * 86400000);
      return { key: d.toISOString().slice(0, 10), label: d.toLocaleDateString("en", { weekday: "short" }), games: 0, won: 0 };
    });
    for (const r of results) {
      const key = r.createdAt.toISOString().slice(0, 10);
      const day = days.find((d) => d.key === key);
      if (day) {
        day.games += 1;
        if (r.won) day.won += 1;
      }
    }

    return NextResponse.json({
      totalGames,
      totalWon,
      totalLost: totalGames - totalWon,
      winRate: totalGames > 0 ? Math.round((totalWon / totalGames) * 100) : 0,
      avgQuestions,
      mostGuessed,
      mostFailed,
      categoryPerformance,
      questionPerformance,
      gamesOverTime: days,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load analytics";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
