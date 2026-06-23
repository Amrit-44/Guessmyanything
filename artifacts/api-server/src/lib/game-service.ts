import { db } from "@workspace/db";
import {
  entities, categories, gameSessions, gameResults, questions, entityTags, tags, learnings,
} from "@workspace/db";
import { eq, inArray, sql } from "drizzle-orm";
import {
  type Answer, type ScoreEntry, type HistoryEntry, type GuessEntry, type EngineConfig,
  loadConfig, parseScoreboard, parseHistory, buildInitialScoreboard, applySingleAnswer,
  rebuildScoreboard, selectNextQuestion, shouldGuess, detectIndustry,
  computeConfidencePercent, computeGuessConfidences,
} from "./engine.js";

export interface QuestionView { questionId: string; text: string; questionNumber: number; }
export interface GuessView {
  entityId: string; entityName: string; description: string | null;
  categoryName: string; score: number; rank: number; confidence?: number;
}
export interface GameSnapshot {
  sessionId: string; status: "playing" | "guessing" | "won" | "lost";
  question: QuestionView | null; guess: GuessView | null; topGuesses: GuessView[];
  questionCount: number;
  history: { questionId: string; questionText: string; answer: Answer }[];
  category: string | null; categoryName: string | null;
  confidence: { topScore: number; secondScore: number; gap: number; percent: number };
  industry: { name: string; confidence: number } | null;
}

function parseAskedIds(json: string): string[] {
  try { const a = JSON.parse(json); return Array.isArray(a) ? a : []; } catch { return []; }
}
function parseGuessesMade(json: string): string[] {
  try { const a = JSON.parse(json); return Array.isArray(a) ? a : []; } catch { return []; }
}
function computeConfidence(scoreboard: ScoreEntry[]) {
  const top = scoreboard[0], second = scoreboard[1];
  const topScore = top ? top.score : 0, secondScore = second ? second.score : 0;
  return { topScore, secondScore, gap: topScore - secondScore, percent: computeConfidencePercent(scoreboard) };
}

async function entityToGuessView(s: ScoreEntry, rank: number): Promise<GuessView> {
  const rows = await db.select({
    name: entities.name, description: entities.description, catName: categories.name,
  }).from(entities).innerJoin(categories, eq(entities.categoryId, categories.id))
    .where(eq(entities.id, s.id)).limit(1);
  const e = rows[0];
  return { entityId: s.id, entityName: e?.name ?? s.name, description: e?.description ?? null, categoryName: e?.catName ?? "Unknown", score: Math.round(s.score), rank };
}

async function trackQuestionAnalytics(questionId: string, balance: number): Promise<void> {
  const rows = await db.select({ timesAsked: questions.timesAsked, avgInfoGain: questions.avgInfoGain })
    .from(questions).where(eq(questions.id, questionId)).limit(1);
  if (!rows[0]) return;
  const q = rows[0];
  const newCount = q.timesAsked + 1;
  const newAvg = q.timesAsked > 0 ? (q.avgInfoGain * q.timesAsked + balance) / newCount : balance;
  await db.update(questions).set({ timesAsked: newCount, avgInfoGain: newAvg }).where(eq(questions.id, questionId));
}

async function buildSnapshot(session: any, cfg: EngineConfig): Promise<GameSnapshot> {
  const scoreboard = parseScoreboard(session.scoreboard);
  const history = parseHistory(session.history);
  const category = session.categoryFilter;
  let categoryName: string | null = null;
  if (category) {
    const rows = await db.select({ name: categories.name }).from(categories).where(eq(categories.slug, category)).limit(1);
    categoryName = rows[0]?.name ?? null;
  }
  let question: QuestionView | null = null;
  if (session.status === "playing" && history.length > 0) {
    const last = history[history.length - 1];
    question = { questionId: last.questionId, text: last.questionText, questionNumber: history.length };
  }
  let guess: GuessView | null = null;
  if (session.currentGuess) { try { guess = JSON.parse(session.currentGuess); } catch { guess = null; } }
  const top3 = scoreboard.slice(0, 3);
  const guessConfidences = computeGuessConfidences(scoreboard, 3);
  const topGuesses: GuessView[] = [];
  for (let i = 0; i < top3.length; i++) {
    const gv = await entityToGuessView(top3[i], i + 1);
    gv.confidence = guessConfidences[i] ?? 0;
    topGuesses.push(gv);
  }
  let industry: { name: string; confidence: number } | null = null;
  if (category === "jobs") {
    const ind = await detectIndustry(scoreboard);
    if (ind && ind.confidence > 0.15) industry = { name: ind.industryLabel.charAt(0).toUpperCase() + ind.industryLabel.slice(1), confidence: Math.round(ind.confidence * 100) };
  }
  return {
    sessionId: session.id, status: session.status,
    question, guess, topGuesses, questionCount: session.questionCount,
    history: history.map((h: HistoryEntry) => ({ questionId: h.questionId, questionText: h.questionText, answer: h.answer })),
    category, categoryName, confidence: computeConfidence(scoreboard), industry,
  };
}

async function recordResult(session: any, won: boolean, guessedEntity: string, cfg: EngineConfig, correctEntity?: string): Promise<void> {
  const durationSec = Math.max(1, Math.round((Date.now() - new Date(session.createdAt).getTime()) / 1000));
  await db.insert(gameResults).values({ category: session.categoryFilter ?? "Anything", questionCount: session.questionCount, won, guessedEntity, correctEntity: correctEntity ?? null, durationSec });
}

export async function startGame(categoryFilter: string | null): Promise<GameSnapshot> {
  const cfg = await loadConfig();
  if (categoryFilter) {
    const rows = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, categoryFilter)).limit(1);
    if (!rows[0]) categoryFilter = null;
  }
  const scoreboard = await buildInitialScoreboard(cfg, categoryFilter);
  if (scoreboard.length === 0) throw new Error("No entities available for this category.");
  const next = await selectNextQuestion(scoreboard, [], cfg, categoryFilter, []);
  if (!next) throw new Error("No questions available.");
  const history: HistoryEntry[] = [{ questionId: next.questionId, questionText: next.questionText, tagId: next.tagId, tagSlug: next.tagSlug, inverted: next.inverted, answer: "dont_know" }];
  const rows = await db.insert(gameSessions).values({ categoryFilter, scoreboard: JSON.stringify(scoreboard), history: JSON.stringify(history), askedIds: JSON.stringify([next.questionId]), status: "playing", questionCount: 1 }).returning();
  const session = rows[0];
  await trackQuestionAnalytics(next.questionId, next.balance);
  return buildSnapshot(session, cfg);
}

export async function answerQuestion(sessionId: string, answer: Answer): Promise<GameSnapshot> {
  const cfg = await loadConfig();
  const rows = await db.select().from(gameSessions).where(eq(gameSessions.id, sessionId)).limit(1);
  const session = rows[0]; if (!session) throw new Error("Session not found.");
  if (session.status !== "playing") throw new Error("Game is not in playing state.");
  const scoreboard = parseScoreboard(session.scoreboard);
  const history = parseHistory(session.history);
  const askedIds = parseAskedIds(session.askedIds);
  const guessesMade = parseGuessesMade(session.guessesMade);
  if (history.length === 0) throw new Error("No current question.");
  const current = history[history.length - 1]; current.answer = answer;
  await applySingleAnswer(scoreboard, current, cfg);
  const decision = shouldGuess(scoreboard, history.length, cfg, guessesMade);
  let nextStatus = "playing", currentGuessJson: string | null = null, questionCount = session.questionCount;
  if (decision.guess) {
    const candidate = scoreboard.find((s) => !guessesMade.includes(s.id));
    if (candidate) { const gv = await entityToGuessView(candidate, guessesMade.length + 1); currentGuessJson = JSON.stringify(gv); nextStatus = "guessing"; }
    else { nextStatus = "lost"; await recordResult(session, false, "—", cfg); }
  } else {
    const probedTags = history.map((h) => h.tagSlug);
    const next = await selectNextQuestion(scoreboard, askedIds, cfg, session.categoryFilter, probedTags);
    if (next) {
      history.push({ questionId: next.questionId, questionText: next.questionText, tagId: next.tagId, tagSlug: next.tagSlug, inverted: next.inverted, answer: "dont_know" });
      askedIds.push(next.questionId); questionCount += 1;
      await trackQuestionAnalytics(next.questionId, next.balance);
    } else {
      const candidate = scoreboard.find((s) => !guessesMade.includes(s.id));
      if (candidate) { const gv = await entityToGuessView(candidate, guessesMade.length + 1); currentGuessJson = JSON.stringify(gv); nextStatus = "guessing"; }
      else { nextStatus = "lost"; await recordResult(session, false, "—", cfg); }
    }
  }
  const updated = await db.update(gameSessions).set({ scoreboard: JSON.stringify(scoreboard), history: JSON.stringify(history), askedIds: JSON.stringify(askedIds), status: nextStatus, currentGuess: currentGuessJson, questionCount, updatedAt: new Date() }).where(eq(gameSessions.id, sessionId)).returning();
  return buildSnapshot(updated[0], cfg);
}

export async function confirmGuess(sessionId: string, correct: boolean): Promise<GameSnapshot> {
  const cfg = await loadConfig();
  const rows = await db.select().from(gameSessions).where(eq(gameSessions.id, sessionId)).limit(1);
  const session = rows[0]; if (!session) throw new Error("Session not found.");
  if (session.status !== "guessing") throw new Error("Game is not awaiting guess confirmation.");
  const scoreboard = parseScoreboard(session.scoreboard);
  const history = parseHistory(session.history);
  const askedIds = parseAskedIds(session.askedIds);
  const guessesMade = parseGuessesMade(session.guessesMade);
  const currentGuess: GuessEntry | null = session.currentGuess ? JSON.parse(session.currentGuess) : null;
  if (!currentGuess) throw new Error("No current guess.");
  if (correct) {
    if (askedIds.length > 0) await db.update(questions).set({ successCount: sql`${questions.successCount} + 1` }).where(inArray(questions.id, askedIds));
    await db.update(gameSessions).set({ status: "won", currentGuess: null, updatedAt: new Date() }).where(eq(gameSessions.id, sessionId));
    await recordResult(session, true, (currentGuess as any).entityName, cfg);
    const u = await db.select().from(gameSessions).where(eq(gameSessions.id, sessionId)).limit(1);
    return buildSnapshot(u[0], cfg);
  }
  guessesMade.push((currentGuess as any).entityId);
  if (askedIds.length > 0) await db.update(questions).set({ failCount: sql`${questions.failCount} + 1` }).where(inArray(questions.id, askedIds));
  if (guessesMade.length >= cfg.maxGuesses) {
    await db.update(gameSessions).set({ guessesMade: JSON.stringify(guessesMade), status: "lost", currentGuess: null, updatedAt: new Date() }).where(eq(gameSessions.id, sessionId));
    await recordResult(session, false, "—", cfg);
    const u = await db.select().from(gameSessions).where(eq(gameSessions.id, sessionId)).limit(1);
    return buildSnapshot(u[0], cfg);
  }
  const decision = shouldGuess(scoreboard, history.length, cfg, guessesMade);
  let nextStatus = "playing", currentGuessJson: string | null = null, questionCount = session.questionCount;
  if (decision.guess) {
    const candidate = scoreboard.find((s) => !guessesMade.includes(s.id));
    if (candidate) { const gv = await entityToGuessView(candidate, guessesMade.length + 1); currentGuessJson = JSON.stringify(gv); nextStatus = "guessing"; }
    else { nextStatus = "lost"; await recordResult(session, false, "—", cfg); }
  } else {
    const probedTags = history.map((h) => h.tagSlug);
    const next = await selectNextQuestion(scoreboard, askedIds, cfg, session.categoryFilter, probedTags);
    if (next) {
      history.push({ questionId: next.questionId, questionText: next.questionText, tagId: next.tagId, tagSlug: next.tagSlug, inverted: next.inverted, answer: "dont_know" });
      askedIds.push(next.questionId); questionCount += 1;
      await trackQuestionAnalytics(next.questionId, next.balance);
    } else {
      const candidate = scoreboard.find((s) => !guessesMade.includes(s.id));
      if (candidate) { const gv = await entityToGuessView(candidate, guessesMade.length + 1); currentGuessJson = JSON.stringify(gv); nextStatus = "guessing"; }
      else { nextStatus = "lost"; await recordResult(session, false, "—", cfg); }
    }
  }
  const updated = await db.update(gameSessions).set({ guessesMade: JSON.stringify(guessesMade), status: nextStatus, currentGuess: currentGuessJson, history: JSON.stringify(history), askedIds: JSON.stringify(askedIds), questionCount, updatedAt: new Date() }).where(eq(gameSessions.id, sessionId)).returning();
  return buildSnapshot(updated[0], cfg);
}

export async function undoLastAnswer(sessionId: string): Promise<GameSnapshot> {
  const cfg = await loadConfig();
  const rows = await db.select().from(gameSessions).where(eq(gameSessions.id, sessionId)).limit(1);
  const session = rows[0]; if (!session) throw new Error("Session not found.");
  if (session.status === "won" || session.status === "lost") throw new Error("Cannot undo a finished game.");
  const scoreboard = parseScoreboard(session.scoreboard);
  let history = parseHistory(session.history);
  let askedIds = parseAskedIds(session.askedIds);
  if (history.length === 0) throw new Error("Nothing to undo.");
  if (session.status === "guessing") {
    const updated = await db.update(gameSessions).set({ status: "playing", currentGuess: null, updatedAt: new Date() }).where(eq(gameSessions.id, sessionId)).returning();
    return buildSnapshot(updated[0], cfg);
  }
  const last = history[history.length - 1];
  history = history.slice(0, -1);
  askedIds = askedIds.filter((id) => id !== last.questionId);
  let questionCount = Math.max(1, session.questionCount - 1);
  if (history.length === 0) {
    const fresh = await selectNextQuestion(scoreboard, askedIds, cfg, session.categoryFilter, []);
    if (fresh) {
      history.push({ questionId: fresh.questionId, questionText: fresh.questionText, tagId: fresh.tagId, tagSlug: fresh.tagSlug, inverted: fresh.inverted, answer: "dont_know" });
      askedIds.push(fresh.questionId); questionCount = 1;
      await trackQuestionAnalytics(fresh.questionId, fresh.balance);
    }
  } else {
    const newLast = history[history.length - 1];
    if (newLast.answer !== "dont_know") {
      const replayHistory = history.slice(0, -1);
      await rebuildScoreboard(scoreboard, replayHistory, cfg);
      newLast.answer = "dont_know";
    }
  }
  const updated = await db.update(gameSessions).set({ history: JSON.stringify(history), askedIds: JSON.stringify(askedIds), scoreboard: JSON.stringify(scoreboard), status: "playing", currentGuess: null, questionCount, updatedAt: new Date() }).where(eq(gameSessions.id, sessionId)).returning();
  return buildSnapshot(updated[0], cfg);
}

export async function restartGame(sessionId: string): Promise<GameSnapshot> {
  const rows = await db.select({ categoryFilter: gameSessions.categoryFilter }).from(gameSessions).where(eq(gameSessions.id, sessionId)).limit(1);
  const session = rows[0]; if (!session) throw new Error("Session not found.");
  await db.delete(gameSessions).where(eq(gameSessions.id, sessionId));
  return startGame(session.categoryFilter);
}

export async function learnFromFailure(sessionId: string, correctAnswer: string, category?: string, description?: string): Promise<{ ok: true }> {
  const rows = await db.select().from(gameSessions).where(eq(gameSessions.id, sessionId)).limit(1);
  const session = rows[0]; if (!session) throw new Error("Session not found.");
  const history = parseHistory(session.history);
  const guessesMade = parseGuessesMade(session.guessesMade);
  const guessEntities = guessesMade.length > 0
    ? await db.select({ id: entities.id, name: entities.name }).from(entities).where(inArray(entities.id, guessesMade))
    : [];
  const aiGuesses = guessEntities.map((e) => e.name);
  const existing = await db.select({ id: entities.id }).from(entities).where(eq(entities.name, correctAnswer)).limit(1);
  await db.insert(learnings).values({
    correctAnswer, category: category ?? session.categoryFilter, description: description ?? null,
    existingEntityId: existing[0]?.id ?? null,
    history: JSON.stringify(history.map((h) => ({ question: h.questionText, answer: h.answer }))),
    aiGuesses: JSON.stringify(aiGuesses), status: "pending",
  });
  const cfg = await loadConfig();
  await recordResult(session, false, correctAnswer, cfg, aiGuesses.join(", "));
  await db.update(gameSessions).set({ status: "lost", currentGuess: null, updatedAt: new Date() }).where(eq(gameSessions.id, sessionId));
  return { ok: true };
}

export async function getSnapshot(sessionId: string): Promise<GameSnapshot | null> {
  const cfg = await loadConfig();
  const rows = await db.select().from(gameSessions).where(eq(gameSessions.id, sessionId)).limit(1);
  const session = rows[0]; if (!session) return null;
  return buildSnapshot(session, cfg);
}

export async function submitFeedback(type: string, message: string, context?: string, rating?: number): Promise<{ ok: true }> {
  const { feedback } = await import("@workspace/db");
  await db.insert(feedback).values({ type, message, context: context ?? null, rating: rating ?? null });
  return { ok: true };
}
