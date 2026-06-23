import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import type { CategoryInfo } from "@/hooks/use-game";

export default function HomePage() {
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [totalEntities, setTotalEntities] = useState(0);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        setCategories(data.categories ?? []);
        setTotalEntities(data.totalEntities ?? 0);
      })
      .catch(() => {});
  }, []);

  return <AppShell categories={categories} totalEntities={totalEntities} />;
}
