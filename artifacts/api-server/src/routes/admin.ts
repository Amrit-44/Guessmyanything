import { Router } from "express";
import { db } from "@workspace/db";
import {
  categories, entities, entityTags, tags, questions, learnings, feedback, settings,
  gameResults, ageResults, ageLearnings,
} from "@workspace/db";
import { eq, sql, desc, asc, and, inArray, like } from "drizzle-orm";

const router = Router();

const ADMIN_NAME = "Admin-Amrit";
const ADMIN_PASSWORD = "AMRIT-4454-ADMIN";
const COOKIE_NAME = "admin_session";
const TOKEN = "gma-admin-" + Buffer.from(`${ADMIN_NAME}:${ADMIN_PASSWORD}`).toString("base64");

function isAuth(req: any): boolean {
  const cookie = req.cookies?.[COOKIE_NAME];
  const header = req.headers["authorization"]?.replace("Bearer ", "");
  return cookie === TOKEN || header === TOKEN;
}

function requireAuth(req: any, res: any, next: any) {
  if (!isAuth(req)) return res.status(401).json({ error: "Unauthorized" });
  next();
}

router.post("/auth", (req, res) => {
  const { name, password } = req.body;
  if (name === ADMIN_NAME && password === ADMIN_PASSWORD) {
    res.cookie(COOKIE_NAME, TOKEN, { httpOnly: true, maxAge: 86400000 * 7, sameSite: "lax" });
    return res.json({ success: true, token: TOKEN });
  }
  return res.status(401).json({ error: "Invalid credentials" });
});

router.get("/auth", (req, res) => {
  res.json({ authenticated: isAuth(req) });
});

router.get("/health", requireAuth, (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

router.get("/dashboard", requireAuth, async (_req, res) => {
  try {
    const [
      entityCount, questionCount, learningCount, pendingLearningCount,
      feedbackCount, gameWon, gameLost, categoryRows, recentRows,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(entities),
      db.select({ count: sql<number>`count(*)` }).from(questions),
      db.select({ count: sql<number>`count(*)` }).from(learnings),
      db.select({ count: sql<number>`count(*)` }).from(learnings).where(eq(learnings.status, "pending")),
      db.select({ count: sql<number>`count(*)` }).from(feedback),
      db.select({ count: sql<number>`count(*)` }).from(gameResults).where(eq(gameResults.won, true)),
      db.select({ count: sql<number>`count(*)` }).from(gameResults).where(eq(gameResults.won, false)),
      db.select({
        name: categories.name, slug: categories.slug, color: categories.color, icon: categories.icon,
        count: sql<number>`count(${entities.id})`,
      }).from(categories)
        .leftJoin(entities, eq(entities.categoryId, categories.id))
        .groupBy(categories.id, categories.name, categories.slug, categories.color, categories.icon)
        .orderBy(categories.sortOrder),
      db.select({
        id: gameResults.id, category: gameResults.category,
        questionCount: gameResults.questionCount, won: gameResults.won,
        guessedEntity: gameResults.guessedEntity, correctEntity: gameResults.correctEntity,
        createdAt: gameResults.createdAt,
      }).from(gameResults).orderBy(desc(gameResults.createdAt)).limit(10),
    ]);

    const totalWon = Number(gameWon[0]?.count ?? 0);
    const totalLost = Number(gameLost[0]?.count ?? 0);
    const totalGames = totalWon + totalLost;

    res.json({
      stats: {
        totalEntities: Number(entityCount[0]?.count ?? 0),
        totalQuestions: Number(questionCount[0]?.count ?? 0),
        totalGames,
        totalWon,
        totalLost,
        winRate: totalGames > 0 ? Math.round((totalWon / totalGames) * 100) : 0,
        totalLearnings: Number(learningCount[0]?.count ?? 0),
        pendingLearnings: Number(pendingLearningCount[0]?.count ?? 0),
        totalFeedback: Number(feedbackCount[0]?.count ?? 0),
      },
      categories: categoryRows.map((c) => ({ ...c, count: Number(c.count) })),
      recentResults: recentRows,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/analytics", requireAuth, async (_req, res) => {
  try {
    const [total, won, byCategory] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(gameResults),
      db.select({ count: sql<number>`count(*)` }).from(gameResults).where(eq(gameResults.won, true)),
      db.select({ category: gameResults.category, count: sql<number>`count(*)`, wins: sql<number>`sum(case when won then 1 else 0 end)` })
        .from(gameResults).groupBy(gameResults.category).orderBy(desc(sql`count(*)`)).limit(20),
    ]);
    res.json({ total: Number(total[0]?.count ?? 0), won: Number(won[0]?.count ?? 0), byCategory });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/entities", requireAuth, async (req, res) => {
  try {
    const { category, search, limit = "50", offset = "0" } = req.query as any;
    let conditions = [];
    if (category) {
      const cats = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, category)).limit(1);
      if (cats[0]) conditions.push(eq(entities.categoryId, cats[0].id));
    }
    if (search) conditions.push(like(entities.name, `%${search}%`));

    const rows = await db.select({
      id: entities.id, name: entities.name, slug: entities.slug, description: entities.description,
      difficulty: entities.difficulty, popularity: entities.popularity, isActive: entities.isActive,
      categoryId: entities.categoryId, createdAt: entities.createdAt,
    }).from(entities)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(entities.name)).limit(Number(limit)).offset(Number(offset));

    const total = await db.select({ count: sql<number>`count(*)` }).from(entities)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    res.json({ entities: rows, total: Number(total[0]?.count ?? 0) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/entities/:id", requireAuth, async (req, res) => {
  try {
    const rows = await db.select().from(entities).where(eq(entities.id, req.params.id)).limit(1);
    if (!rows[0]) return res.status(404).json({ error: "Entity not found" });
    const tagRows = await db.select({ id: tags.id, name: tags.name, slug: tags.slug })
      .from(entityTags).innerJoin(tags, eq(entityTags.tagId, tags.id))
      .where(eq(entityTags.entityId, req.params.id));
    res.json({ ...rows[0], tags: tagRows });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/entities", requireAuth, async (req, res) => {
  try {
    const { name, slug, description, categoryId, difficulty, popularity, isActive, tagSlugs } = req.body;
    if (!name || !categoryId) return res.status(400).json({ error: "name and categoryId required" });
    const entitySlug = slug ?? name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const rows = await db.insert(entities).values({ name, slug: entitySlug, description, categoryId, difficulty: difficulty ?? 1.0, popularity: popularity ?? 50, isActive: isActive ?? true }).returning();
    const entity = rows[0];
    if (tagSlugs && Array.isArray(tagSlugs)) {
      for (const tagSlug of tagSlugs) {
        const tRows = await db.select().from(tags).where(eq(tags.slug, tagSlug)).limit(1);
        if (tRows[0]) await db.insert(entityTags).values({ entityId: entity.id, tagId: tRows[0].id }).onConflictDoNothing();
      }
    }
    res.status(201).json(entity);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.put("/entities/:id", requireAuth, async (req, res) => {
  try {
    const { name, description, difficulty, popularity, isActive, tagSlugs } = req.body;
    const rows = await db.update(entities).set({ name, description, difficulty, popularity, isActive, updatedAt: new Date() }).where(eq(entities.id, req.params.id)).returning();
    if (!rows[0]) return res.status(404).json({ error: "Entity not found" });
    if (tagSlugs && Array.isArray(tagSlugs)) {
      await db.delete(entityTags).where(eq(entityTags.entityId, req.params.id));
      for (const tagSlug of tagSlugs) {
        const tRows = await db.select().from(tags).where(eq(tags.slug, tagSlug)).limit(1);
        if (tRows[0]) await db.insert(entityTags).values({ entityId: req.params.id, tagId: tRows[0].id }).onConflictDoNothing();
      }
    }
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete("/entities/:id", requireAuth, async (req, res) => {
  try {
    await db.delete(entities).where(eq(entities.id, req.params.id));
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/questions", requireAuth, async (req, res) => {
  try {
    const { category, limit = "50", offset = "0" } = req.query as any;
    let condition: any = undefined;
    if (category) {
      const cats = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, category)).limit(1);
      if (cats[0]) condition = eq(questions.categoryId, cats[0].id);
    }
    const rows = await db.select().from(questions)
      .where(condition).orderBy(asc(questions.sortOrder), asc(questions.text))
      .limit(Number(limit)).offset(Number(offset));
    const total = await db.select({ count: sql<number>`count(*)` }).from(questions).where(condition);
    res.json({ questions: rows, total: Number(total[0]?.count ?? 0) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/questions", requireAuth, async (req, res) => {
  try {
    const { text, primaryTagSlug, categorySlug, inverted } = req.body;
    if (!text || !primaryTagSlug) return res.status(400).json({ error: "text and primaryTagSlug required" });
    const tRows = await db.select().from(tags).where(eq(tags.slug, primaryTagSlug)).limit(1);
    if (!tRows[0]) return res.status(400).json({ error: "Tag not found" });
    let categoryId: string | null = null;
    if (categorySlug) {
      const cRows = await db.select().from(categories).where(eq(categories.slug, categorySlug)).limit(1);
      if (cRows[0]) categoryId = cRows[0].id;
    }
    const rows = await db.insert(questions).values({ text, primaryTagId: tRows[0].id, categoryId, inverted: inverted ?? false }).returning();
    res.status(201).json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.put("/questions/:id", requireAuth, async (req, res) => {
  try {
    const { text, inverted, isActive, sortOrder } = req.body;
    const rows = await db.update(questions).set({ text, inverted, isActive, sortOrder, updatedAt: new Date() }).where(eq(questions.id, req.params.id)).returning();
    if (!rows[0]) return res.status(404).json({ error: "Question not found" });
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete("/questions/:id", requireAuth, async (req, res) => {
  try {
    await db.delete(questions).where(eq(questions.id, req.params.id));
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/tags", requireAuth, async (_req, res) => {
  try {
    const rows = await db.select().from(tags).orderBy(asc(tags.name));
    res.json({ tags: rows });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/tags/:slug", requireAuth, async (req, res) => {
  try {
    const rows = await db.select().from(tags).where(eq(tags.slug, req.params.slug)).limit(1);
    if (!rows[0]) return res.status(404).json({ error: "Tag not found" });
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/tags", requireAuth, async (req, res) => {
  try {
    const { name, slug } = req.body;
    if (!name || !slug) return res.status(400).json({ error: "name and slug required" });
    const rows = await db.insert(tags).values({ name, slug }).returning();
    res.status(201).json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/settings", requireAuth, async (_req, res) => {
  try {
    const rows = await db.select().from(settings).orderBy(asc(settings.group), asc(settings.key));
    res.json({ settings: rows });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.put("/settings/:key", requireAuth, async (req, res) => {
  try {
    const { value } = req.body;
    if (value === undefined) return res.status(400).json({ error: "value required" });
    const existing = await db.select().from(settings).where(eq(settings.key, req.params.key)).limit(1);
    if (!existing[0]) {
      const rows = await db.insert(settings).values({ key: req.params.key, value: String(value) }).returning();
      return res.json(rows[0]);
    }
    const rows = await db.update(settings).set({ value: String(value), updatedAt: new Date() }).where(eq(settings.key, req.params.key)).returning();
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/learnings", requireAuth, async (req, res) => {
  try {
    const { status = "pending", limit = "20", offset = "0" } = req.query as any;
    const rows = await db.select().from(learnings)
      .where(eq(learnings.status, status))
      .orderBy(desc(learnings.createdAt))
      .limit(Number(limit)).offset(Number(offset));
    const total = await db.select({ count: sql<number>`count(*)` }).from(learnings).where(eq(learnings.status, status));
    res.json({ learnings: rows, total: Number(total[0]?.count ?? 0) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.put("/learnings/:id", requireAuth, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const rows = await db.update(learnings).set({ status, notes, updatedAt: new Date() }).where(eq(learnings.id, req.params.id)).returning();
    if (!rows[0]) return res.status(404).json({ error: "Learning not found" });
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete("/learnings/:id", requireAuth, async (req, res) => {
  try {
    await db.delete(learnings).where(eq(learnings.id, req.params.id));
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/feedback", requireAuth, async (req, res) => {
  try {
    const { limit = "20", offset = "0" } = req.query as any;
    const rows = await db.select().from(feedback).orderBy(desc(feedback.createdAt)).limit(Number(limit)).offset(Number(offset));
    const total = await db.select({ count: sql<number>`count(*)` }).from(feedback);
    res.json({ feedback: rows, total: Number(total[0]?.count ?? 0) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/bulk-import", requireAuth, async (req, res) => {
  try {
    const { categorySlug, items } = req.body;
    if (!categorySlug || !Array.isArray(items)) return res.status(400).json({ error: "categorySlug and items[] required" });
    const catRows = await db.select().from(categories).where(eq(categories.slug, categorySlug)).limit(1);
    if (!catRows[0]) return res.status(400).json({ error: "Category not found" });
    const cat = catRows[0];
    let created = 0, skipped = 0;
    for (const item of items) {
      try {
        const slug = (item.slug ?? item.name).toLowerCase().replace(/[^a-z0-9]+/g, "-");
        await db.insert(entities).values({ name: item.name, slug, description: item.description ?? null, categoryId: cat.id, difficulty: item.difficulty ?? 1.0, popularity: item.popularity ?? 50 }).onConflictDoNothing();
        created++;
      } catch { skipped++; }
    }
    res.json({ created, skipped });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
