"use client";
import { useCallback, useState } from "react";

export type AgeAnswer = "yes" | "probably" | "dont_know" | "probably_not" | "no";

export interface AgeSnapshot {
  sessionId: string;
  status: "playing" | "guessing" | "won" | "lost";
  question: { questionId: string; text: string; questionNumber: number; category: string } | null;
  range: { min: number; max: number };
  estimatedAge: number;
  questionCount: number;
  history: { questionText: string; answer: AgeAnswer; tag: string }[];
  confidence: number;
  guess: { age: number; min: number; max: number; confidence: number } | null;
}

async function api<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...opts, headers: { "Content-Type": "application/json", ...(opts?.headers ?? {}) } });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "Request failed");
  return data as T;
}

export function useAgeGame() {
  const [snapshot, setSnapshot] = useState<AgeSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    setLoading(true); setError(null);
    try { const snap = await api<AgeSnapshot>("/api/age/start", { method: "POST" }); setSnapshot(snap); return snap; }
    catch (e) { setError(e instanceof Error ? e.message : "Failed to start"); return null; }
    finally { setLoading(false); }
  }, []);

  const answer = useCallback(async (a: AgeAnswer) => {
    if (!snapshot) return null;
    setLoading(true); setError(null);
    try { const snap = await api<AgeSnapshot>("/api/age/answer", { method: "POST", body: JSON.stringify({ sessionId: snapshot.sessionId, answer: a }) }); setSnapshot(snap); return snap; }
    catch (e) { setError(e instanceof Error ? e.message : "Failed to answer"); return null; }
    finally { setLoading(false); }
  }, [snapshot]);

  const confirm = useCallback(async (correct: boolean) => {
    if (!snapshot) return null;
    setLoading(true); setError(null);
    try { const snap = await api<AgeSnapshot>("/api/age/confirm", { method: "POST", body: JSON.stringify({ sessionId: snapshot.sessionId, correct }) }); setSnapshot(snap); return snap; }
    catch (e) { setError(e instanceof Error ? e.message : "Failed to confirm"); return null; }
    finally { setLoading(false); }
  }, [snapshot]);

  const learn = useCallback(async (actualAge: number) => {
    if (!snapshot) return null;
    setLoading(true); setError(null);
    try { await api("/api/age/learn", { method: "POST", body: JSON.stringify({ sessionId: snapshot.sessionId, actualAge }) }); setSnapshot(s => s ? { ...s, status: "lost" } : s); return true; }
    catch (e) { setError(e instanceof Error ? e.message : "Failed to record"); return null; }
    finally { setLoading(false); }
  }, [snapshot]);

  const reset = useCallback(() => setSnapshot(null), []);

  return { snapshot, loading, error, start, answer, confirm, learn, reset };
}
