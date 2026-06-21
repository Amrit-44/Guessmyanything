"use client";

import { HomeScreen } from "./home-screen";
import type { CategoryInfo } from "@/hooks/use-game";

interface Props {
  categories: CategoryInfo[];
  totalEntities: number;
}

export function GameApp({ categories, totalEntities }: Props) {
  return (
    <HomeScreen categories={categories} totalEntities={totalEntities} />
  );
}
