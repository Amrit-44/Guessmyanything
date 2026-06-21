"use client";

import { GameApp } from "@/components/game/game-app";
import type { CategoryInfo } from "@/hooks/use-game";

interface Props {
  categories: CategoryInfo[];
  totalEntities: number;
}

export function AppShell({ categories, totalEntities }: Props) {
  return (
    <GameApp categories={categories} totalEntities={totalEntities} />
  );
}
