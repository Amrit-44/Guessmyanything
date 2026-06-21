import { db } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import type { CategoryInfo } from "@/hooks/use-game";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getData() {
  try {
    const [categories, totalEntities] = await Promise.all([
      db.category.findMany({
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          icon: true,
          color: true,
          _count: { select: { entities: { where: { isActive: true } } } },
        },
      }),
      db.entity.count({ where: { isActive: true } }),
    ]);
    return { categories: categories as CategoryInfo[], totalEntities };
  } catch {
    return { categories: [], totalEntities: 0 };
  }
}

export default async function Home() {
  const { categories, totalEntities } = await getData();
  return <AppShell categories={categories} totalEntities={totalEntities} />;
}
