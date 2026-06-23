"use client";

import { useEffect, useState } from "react";
import { Star, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FeedbackItem {
  id: string;
  type: string;
  message: string;
  rating: number | null;
  context: string | null;
  createdAt: string;
}

const TYPE_COLORS: Record<string, string> = {
  bug: "var(--neon-pink)",
  suggestion: "var(--neon-cyan)",
  praise: "var(--neon-green)",
  wrong_guess: "var(--neon-orange)",
};

export function AdminFeedback() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/feedback")
      .then((r) => r.json())
      .then((d) => setItems(d.items))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-10 text-center text-muted-foreground blink">LOADING</div>;

  if (items.length === 0) {
    return <div className="py-10 text-center text-muted-foreground">No feedback yet.</div>;
  }

  return (
    <div className="space-y-2">
      <div className="text-xs text-muted-foreground">{items.length} feedback entries</div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {items.map((f) => {
          let ctx: Record<string, unknown> | null = null;
          try { ctx = f.context ? JSON.parse(f.context) : null; } catch { /* */ }
          return (
            <div key={f.id} className="pixel-card rounded-sm p-3">
              <div className="mb-2 flex items-center justify-between">
                <Badge
                  variant="outline"
                  className="text-[9px]"
                  style={{ color: TYPE_COLORS[f.type] ?? "var(--muted-foreground)", borderColor: TYPE_COLORS[f.type] ?? "var(--border)" }}
                >
                  {f.type.toUpperCase()}
                </Badge>
                <div className="flex items-center gap-1">
                  {f.rating && (
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3 w-3 ${i < f.rating! ? "fill-[var(--neon-yellow)] text-[var(--neon-yellow)]" : "text-muted-foreground"}`} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <p className="text-sm">{f.message}</p>
              {ctx && (
                <pre className="mt-2 max-h-24 overflow-auto rounded-sm bg-muted/30 p-2 text-[10px] text-muted-foreground">
                  {JSON.stringify(ctx, null, 2)}
                </pre>
              )}
              <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                {new Date(f.createdAt).toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
