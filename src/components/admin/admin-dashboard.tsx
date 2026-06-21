"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Boxes,
  HelpCircle,
  Gamepad2,
  Trophy,
  GraduationCap,
  MessageSquare,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCategoryIcon } from "@/lib/category-icons";

interface DashData {
  stats: {
    totalEntities: number;
    totalQuestions: number;
    totalGames: number;
    totalWon: number;
    totalLost: number;
    winRate: number;
    totalLearnings: number;
    pendingLearnings: number;
    totalFeedback: number;
  };
  categories: {
    name: string;
    slug: string;
    color: string;
    icon: string;
    count: number;
  }[];
  recentResults: {
    id: string;
    category: string;
    questionCount: number;
    won: boolean;
    guessedEntity: string;
    correctEntity: string | null;
    createdAt: string;
  }[];
}

export function AdminDashboard() {
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !data) {
    return <div className="py-10 text-center text-muted-foreground blink">LOADING</div>;
  }

  const stats = [
    { label: "ENTITIES", value: data.stats.totalEntities, icon: Boxes, color: "var(--neon-cyan)" },
    { label: "QUESTIONS", value: data.stats.totalQuestions, icon: HelpCircle, color: "var(--neon-yellow)" },
    { label: "GAMES", value: data.stats.totalGames, icon: Gamepad2, color: "var(--neon-purple)" },
    { label: "WIN RATE", value: `${data.stats.winRate}%`, icon: Trophy, color: "var(--neon-green)" },
    { label: "LEARNINGS", value: data.stats.totalLearnings, icon: GraduationCap, color: "var(--neon-pink)" },
    { label: "FEEDBACK", value: data.stats.totalFeedback, icon: MessageSquare, color: "var(--neon-orange)" },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="pixel-card overflow-hidden rounded-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[9px] text-muted-foreground" style={{ fontFamily: "var(--font-pixel)" }}>
                      {s.label}
                    </CardTitle>
                    <Icon className="h-3.5 w-3.5" style={{ color: s.color }} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl" style={{ fontFamily: "var(--font-pixel)", color: s.color }}>
                    {s.value}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Categories breakdown */}
        <Card className="pixel-card rounded-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm" style={{ fontFamily: "var(--font-pixel)" }}>
              <Boxes className="h-4 w-4 neon-cyan" /> CATEGORIES
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.categories.map((c) => {
                const Icon = getCategoryIcon(c.icon);
                const max = Math.max(...data.categories.map((x) => x.count), 1);
                return (
                  <div key={c.slug} className="flex items-center gap-2">
                    <div className="flex w-32 shrink-0 items-center gap-2">
                      <Icon className="h-3.5 w-3.5" style={{ color: c.color }} />
                      <span className="truncate text-xs">{c.name}</span>
                    </div>
                    <div className="h-4 flex-1 overflow-hidden rounded-sm bg-muted/30">
                      <div
                        className="h-full rounded-sm"
                        style={{
                          width: `${(c.count / max) * 100}%`,
                          background: c.color,
                          boxShadow: `0 0 6px ${c.color}88`,
                        }}
                      />
                    </div>
                    <span className="w-8 text-right text-xs text-muted-foreground">{c.count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent results */}
        <Card className="pixel-card rounded-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm" style={{ fontFamily: "var(--font-pixel)" }}>
              <TrendingUp className="h-4 w-4 neon-yellow" /> RECENT GAMES
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentResults.length === 0 ? (
              <p className="text-sm text-muted-foreground">No games yet.</p>
            ) : (
              <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
                {data.recentResults.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-2 rounded-sm border border-border bg-muted/20 p-2 text-xs"
                  >
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${r.won ? "bg-[var(--neon-green)]" : "bg-[var(--neon-pink)]"}`}
                    />
                    <span className="flex-1 truncate">
                      {r.won ? (
                        <>Guessed <span className="neon-cyan">{r.guessedEntity}</span></>
                      ) : (
                        <>Failed — was <span className="neon-pink">{r.correctEntity ?? r.guessedEntity}</span></>
                      )}
                    </span>
                    <span className="shrink-0 text-muted-foreground">{r.questionCount}Q</span>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
