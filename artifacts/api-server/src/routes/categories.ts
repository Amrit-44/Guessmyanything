import { Router } from "express";
import { db } from "@workspace/db";
import { categories, entities } from "@workspace/db";
import { eq, sql, asc } from "drizzle-orm";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const cats = await db.select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      icon: categories.icon,
      color: categories.color,
      sortOrder: categories.sortOrder,
    }).from(categories).orderBy(asc(categories.sortOrder), asc(categories.name));

    const counts = await db.select({
      categoryId: entities.categoryId,
      count: sql<number>`count(*)`,
    }).from(entities).where(eq(entities.isActive, true)).groupBy(entities.categoryId);

    const countMap = new Map(counts.map((c) => [c.categoryId, Number(c.count)]));

    const result = cats.map((c) => ({
      ...c,
      _count: { entities: countMap.get(c.id) ?? 0 },
    }));

    res.json({ categories: result });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
