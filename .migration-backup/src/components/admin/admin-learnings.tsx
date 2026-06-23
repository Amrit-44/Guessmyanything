"use client";

import { useEffect, useState } from "react";
import { Check, X, Trash2, Brain, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface LearningItem {
  id: string;
  correctAnswer: string;
  category: string | null;
  description: string | null;
  existingEntityId: string | null;
  history: string;
  aiGuesses: string;
  status: string;
  notes: string | null;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "var(--neon-yellow)",
  reviewed: "var(--neon-cyan)",
  added: "var(--neon-green)",
  rejected: "var(--neon-pink)",
};

export function AdminLearnings() {
  const [items, setItems] = useState<LearningItem[]>([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const params = filter ? `?status=${filter}` : "";
    fetch(`/api/admin/learnings${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) {
          setItems(d.items);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filter, reloadKey]);

  const reload = () => setReloadKey((k) => k + 1);

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/admin/learnings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, notes: notes[id] ?? undefined }),
    });
    if (res.ok) {
      toast.success(`Marked as ${status}`);
      reload();
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/admin/learnings/${id}`, { method: "DELETE" });
    toast.success("Deleted");
    reload();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="added">Added</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{items.length} records</span>
      </div>

      {loading ? (
        <div className="py-10 text-center text-muted-foreground blink">LOADING</div>
      ) : items.length === 0 ? (
        <div className="py-10 text-center text-muted-foreground">No learning records.</div>
      ) : (
        <div className="space-y-2">
          {items.map((l) => {
            let history: { question: string; answer: string }[] = [];
            let guesses: string[] = [];
            try { history = JSON.parse(l.history); } catch { /* */ }
            try { guesses = JSON.parse(l.aiGuesses); } catch { /* */ }
            const isOpen = expanded === l.id;
            return (
              <div key={l.id} className="pixel-card rounded-sm p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 neon-cyan" />
                      <span className="font-medium">{l.correctAnswer}</span>
                      <span
                        className="rounded-sm px-1.5 py-0.5 text-[9px]"
                        style={{ background: `${STATUS_COLORS[l.status]}22`, color: STATUS_COLORS[l.status], fontFamily: "var(--font-pixel)" }}
                      >
                        {l.status.toUpperCase()}
                      </span>
                      {l.existingEntityId && <Badge variant="secondary" className="text-[9px]">exists in DB</Badge>}
                    </div>
                    {l.description && <p className="mt-1 text-xs text-muted-foreground">{l.description}</p>}
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(l.createdAt).toLocaleString()}
                      {l.category && <span>• {l.category}</span>}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setExpanded(isOpen ? null : l.id)}>
                    {isOpen ? "Hide" : "Details"}
                  </Button>
                </div>

                {isOpen && (
                  <div className="mt-3 space-y-3 border-t border-border pt-3">
                    {guesses.length > 0 && (
                      <div>
                        <div className="mb-1 text-[10px] text-muted-foreground" style={{ fontFamily: "var(--font-pixel)" }}>AI GUESSED</div>
                        <div className="flex flex-wrap gap-1">
                          {guesses.map((g, i) => <Badge key={i} variant="outline" className="text-[10px]">{g}</Badge>)}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="mb-1 text-[10px] text-muted-foreground" style={{ fontFamily: "var(--font-pixel)" }}>Q&A HISTORY</div>
                      <div className="max-h-48 space-y-1 overflow-y-auto rounded-sm bg-muted/20 p-2 text-xs">
                        {history.map((h, i) => (
                          <div key={i} className="flex gap-2">
                            <span className="text-muted-foreground">{i + 1}.</span>
                            <span className="flex-1">{h.question}</span>
                            <span className="neon-cyan">{h.answer}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Textarea
                        placeholder="Admin notes..."
                        value={notes[l.id] ?? l.notes ?? ""}
                        onChange={(e) => setNotes((n) => ({ ...n, [l.id]: e.target.value }))}
                        className="min-h-[50px] text-xs"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => updateStatus(l.id, "added")} className="gap-1 text-[var(--neon-green)]">
                        <Check className="h-3.5 w-3.5" /> Added to KB
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(l.id, "reviewed")} className="gap-1 text-[var(--neon-cyan)]">
                        Reviewed
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(l.id, "rejected")} className="gap-1 text-[var(--neon-pink)]">
                        <X className="h-3.5 w-3.5" /> Reject
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(l.id)} className="ml-auto gap-1 text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
