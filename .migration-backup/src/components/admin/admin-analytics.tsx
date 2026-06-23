"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AnalyticsData {
  totalGames: number;
  totalWon: number;
  totalLost: number;
  winRate: number;
  avgQuestions: number;
  mostGuessed: { name: string; total: number; won: number; winRate: number }[];
  mostFailed: { name: string; failed: number; total: number; failRate: number }[];
  categoryPerformance: { name: string; total: number; won: number; winRate: number; avgQuestions: number }[];
  questionPerformance: { text: string; timesAsked: number; successRate: number; failRate: number }[];
  gamesOverTime: { key: string; label: string; games: number; won: number }[];
}

const PIE_COLORS = ["var(--neon-pink)", "var(--neon-cyan)", "var(--neon-yellow)", "var(--neon-green)", "var(--neon-purple)", "var(--neon-orange)"];

export function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return <div className="py-10 text-center text-muted-foreground blink">LOADING</div>;
  }

  const winLossPie = [
    { name: "Won", value: data.totalWon },
    { name: "Lost", value: data.totalLost },
  ];
  const pieColors = ["var(--neon-green)", "var(--neon-pink)"];

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "TOTAL GAMES", value: data.totalGames, color: "var(--neon-cyan)" },
          { label: "WON", value: data.totalWon, color: "var(--neon-green)" },
          { label: "LOST", value: data.totalLost, color: "var(--neon-pink)" },
          { label: "AVG QUESTIONS", value: data.avgQuestions, color: "var(--neon-yellow)" },
        ].map((s) => (
          <Card key={s.label} className="pixel-card rounded-sm">
            <CardContent className="py-3">
              <div className="text-[9px] text-muted-foreground" style={{ fontFamily: "var(--font-pixel)" }}>{s.label}</div>
              <div className="text-xl" style={{ fontFamily: "var(--font-pixel)", color: s.color }}>{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Games over time */}
        <Card className="pixel-card rounded-sm">
          <CardHeader>
            <CardTitle className="text-sm" style={{ fontFamily: "var(--font-pixel)" }}>GAMES (LAST 7 DAYS)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.gamesOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="label" stroke="rgba(255,255,255,0.5)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 4, fontSize: 12 }} />
                <Line type="monotone" dataKey="games" stroke="var(--neon-cyan)" strokeWidth={2} dot={{ r: 3 }} name="Games" />
                <Line type="monotone" dataKey="won" stroke="var(--neon-green)" strokeWidth={2} dot={{ r: 3 }} name="Won" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Win/Loss pie */}
        <Card className="pixel-card rounded-sm">
          <CardHeader>
            <CardTitle className="text-sm" style={{ fontFamily: "var(--font-pixel)" }}>WIN / LOSS</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={winLossPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e) => `${e.name}: ${e.value}`} labelLine={false}>
                  {winLossPie.map((_, i) => (
                    <Cell key={i} fill={pieColors[i]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 4, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 text-center text-sm">
              <span className="neon-green">Win rate: {data.winRate}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Category performance */}
        <Card className="pixel-card rounded-sm">
          <CardHeader>
            <CardTitle className="text-sm" style={{ fontFamily: "var(--font-pixel)" }}>CATEGORY PERFORMANCE</CardTitle>
          </CardHeader>
          <CardContent>
            {data.categoryPerformance.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.categoryPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis type="number" stroke="rgba(255,255,255,0.5)" fontSize={11} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.5)" fontSize={11} width={70} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 4, fontSize: 12 }} />
                  <Bar dataKey="total" fill="var(--neon-cyan)" name="Games" radius={[0, 2, 2, 0]} />
                  <Bar dataKey="won" fill="var(--neon-green)" name="Won" radius={[0, 2, 2, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Most guessed */}
        <Card className="pixel-card rounded-sm">
          <CardHeader>
            <CardTitle className="text-sm" style={{ fontFamily: "var(--font-pixel)" }}>MOST GUESSED</CardTitle>
          </CardHeader>
          <CardContent>
            {data.mostGuessed.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            ) : (
              <div className="max-h-60 space-y-1.5 overflow-y-auto pr-1">
                {data.mostGuessed.map((g, i) => (
                  <div key={g.name} className="flex items-center gap-2 text-xs">
                    <span className="w-5 text-muted-foreground">#{i + 1}</span>
                    <span className="flex-1 truncate">{g.name}</span>
                    <span className="text-muted-foreground">{g.total}x</span>
                    <span className="w-12 text-right neon-green">{g.winRate}%</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Most failed + question performance */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="pixel-card rounded-sm">
          <CardHeader>
            <CardTitle className="text-sm" style={{ fontFamily: "var(--font-pixel)" }}>MOST FAILED ENTITIES</CardTitle>
          </CardHeader>
          <CardContent>
            {data.mostFailed.length === 0 ? (
              <p className="text-sm text-muted-foreground">No failures yet. </p>
            ) : (
              <div className="max-h-60 space-y-1.5 overflow-y-auto pr-1">
                {data.mostFailed.map((g, i) => (
                  <div key={g.name} className="flex items-center gap-2 text-xs">
                    <span className="w-5 text-muted-foreground">#{i + 1}</span>
                    <span className="flex-1 truncate">{g.name}</span>
                    <span className="text-muted-foreground">{g.failed} fails</span>
                    <span className="w-12 text-right neon-pink">{g.failRate}%</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="pixel-card rounded-sm">
          <CardHeader>
            <CardTitle className="text-sm" style={{ fontFamily: "var(--font-pixel)" }}>QUESTION EFFECTIVENESS</CardTitle>
          </CardHeader>
          <CardContent>
            {data.questionPerformance.length === 0 ? (
              <p className="text-sm text-muted-foreground">No question data yet.</p>
            ) : (
              <div className="max-h-60 space-y-1.5 overflow-y-auto pr-1">
                {data.questionPerformance.map((q, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="w-8 shrink-0 text-muted-foreground">{q.timesAsked}x</span>
                    <span className="flex-1 truncate" title={q.text}>{q.text}</span>
                    <span className="w-14 text-right neon-green">{q.successRate}%</span>
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

export { PIE_COLORS };
