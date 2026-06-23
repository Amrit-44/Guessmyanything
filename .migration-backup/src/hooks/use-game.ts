"use client";

import { useCallback, useEffect, useState } from "react";

export type Answer = "yes" | "probably" | "dont_know" | "probably_not" | "no";

export interface QuestionView {
  questionId: string;
  text: string;
  questionNumber: number;
}

export interface GuessView {
  entityId: string;
  entityName: string;
  description: string | null;
  categoryName: string;
  score: number;
  rank: number;
  confidence?: number; // 0..100 percentage (job mode)
}

export interface GameSnapshot {
  sessionId: string;
  status: "playing" | "guessing" | "won" | "lost";
  question: QuestionView | null;
  guess: GuessView | null;
  topGuesses: GuessView[];
  questionCount: number;
  history: { questionId: string; questionText: string; answer: Answer }[];
  category: string | null;
  categoryName: string | null;
  confidence: {
    topScore: number;
    secondScore: number;
    gap: number;
    percent: number;
  };
  industry: { name: string; confidence: number } | null; // job mode only
}

export interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  _count: { entities: number };
}

async function api<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts?.headers ?? {}) },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "Request failed");
  return data as T;
}

export function useGame() {
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async (category: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const snap = await api<GameSnapshot>("/api/game/start", {
        method: "POST",
        body: JSON.stringify({ category }),
      });
      setSnapshot(snap);
      return snap;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const answer = useCallback(async (a: Answer) => {
    if (!snapshot) return null;
    setLoading(true);
    setError(null);
    try {
      const snap = await api<GameSnapshot>("/api/game/answer", {
        method: "POST",
        body: JSON.stringify({ sessionId: snapshot.sessionId, answer: a }),
      });
      setSnapshot(snap);
      return snap;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to answer");
      return null;
    } finally {
      setLoading(false);
    }
  }, [snapshot]);

  const confirm = useCallback(async (correct: boolean) => {
    if (!snapshot) return null;
    setLoading(true);
    setError(null);
    try {
      const snap = await api<GameSnapshot>("/api/game/confirm", {
        method: "POST",
        body: JSON.stringify({ sessionId: snapshot.sessionId, correct }),
      });
      setSnapshot(snap);
      return snap;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to confirm");
      return null;
    } finally {
      setLoading(false);
    }
  }, [snapshot]);

  const undo = useCallback(async () => {
    if (!snapshot) return null;
    setLoading(true);
    setError(null);
    try {
      const snap = await api<GameSnapshot>("/api/game/undo", {
        method: "POST",
        body: JSON.stringify({ sessionId: snapshot.sessionId }),
      });
      setSnapshot(snap);
      return snap;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to undo");
      return null;
    } finally {
      setLoading(false);
    }
  }, [snapshot]);

  const restart = useCallback(async () => {
    if (!snapshot) return null;
    setLoading(true);
    setError(null);
    try {
      const snap = await api<GameSnapshot>("/api/game/restart", {
        method: "POST",
        body: JSON.stringify({ sessionId: snapshot.sessionId }),
      });
      setSnapshot(snap);
      return snap;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to restart");
      return null;
    } finally {
      setLoading(false);
    }
  }, [snapshot]);

  const learn = useCallback(
    async (correctAnswer: string, description?: string) => {
      if (!snapshot) return null;
      setLoading(true);
      setError(null);
      try {
        await api("/api/game/learn", {
          method: "POST",
          body: JSON.stringify({
            sessionId: snapshot.sessionId,
            correctAnswer,
            category: snapshot.category,
            description,
          }),
        });
        setSnapshot((s) => (s ? { ...s, status: "lost" } : s));
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to record");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [snapshot]
  );

  const reset = useCallback(() => setSnapshot(null), []);

  // Sync sessionId to localStorage so a refresh can resume (best-effort).
  useEffect(() => {
    if (snapshot?.sessionId) {
      try {
        localStorage.setItem("gma-session", snapshot.sessionId);
      } catch {
        /* ignore */
      }
    }
  }, [snapshot?.sessionId]);

  return {
    snapshot,
    loading,
    error,
    start,
    answer,
    confirm,
    undo,
    restart,
    learn,
    reset,
    setSnapshot,
  };
}
