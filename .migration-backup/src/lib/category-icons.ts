"use client";

import {
  Briefcase,
  Drama,
  PawPrint,
  Globe,
  Film,
  Tv,
  Gamepad2,
  Star,
  Trophy,
  ShoppingBag,
  Package,
  ScrollText,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  Briefcase,
  Drama,
  PawPrint,
  Globe,
  Film,
  Tv,
  Gamepad2,
  Star,
  Trophy,
  ShoppingBag,
  Package,
  ScrollText,
};

export function getCategoryIcon(name: string | null): LucideIcon {
  if (!name) return HelpCircle;
  return MAP[name] ?? HelpCircle;
}
