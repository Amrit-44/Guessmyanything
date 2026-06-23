import { db } from "@workspace/db";
import { ageSessions, ageResults, ageQuestions, ageLearnings } from "@workspace/db";
import { eq, inArray, sql } from "drizzle-orm";
import {
  type AgeAnswer, type AgeHistoryEntry, type AgeSnapshot,
  ensureAgeQuestions, applyAgeAnswer, selectAgeQuestion, computeAgeConfidence, shouldAgeGuess,
} from "./age-engine.js";

function parseHistory(json: string): AgeHistoryEntry[] {
  try { const a = JSON.parse(json); return Array.isArray(a) ? a : []; } catch { return []; }
}
function parseAskedIds(json: string): string[] {
  try { const a = JSON.parse(json); return Array.isArray(a) ? a : []; } catch { return []; }
}

async function buildSnapshot(s: any): Promise<AgeSnapshot> {
  const history = parseHistory(s.history);
  const confidence = s.confidence ?? computeAgeConfidence(s.minAge, s.maxAge);
  const estimatedAge = Math.round((s.minAge + s.maxAge) / 2);
  let question: AgeSnapshot["question"] = null;
  if (s.status === "playing" && history.length > 0) {
    const l = history[history.length - 1];
    question = { questionId: l.questionId, text: l.questionText, questionNumber: history.length, category: l.category };
  }
  let guess: AgeSnapshot["guess"] = null;
  if (s.finalGuess !== null && s.finalMin !== null && s.finalMax !== null) {
    guess = { age: s.finalGuess, min: s.finalMin, max: s.finalMax, confidence: s.confidence ?? 0 };
  }
  return {
    sessionId: s.id, status: s.status, question,
    range: { min: s.minAge, max: s.maxAge }, estimatedAge, questionCount: s.questionCount,
    history: history.map((h) => ({ questionText: h.questionText, answer: h.answer, tag: h.tag })),
    confidence, guess,
  };
}

export async function startAgeGame(): Promise<AgeSnapshot> {
  await ensureAgeQuestions();
  const next = await selectAgeQuestion(0, 100, [], []);
  if (!next) throw new Error("No age questions available.");
  const history: AgeHistoryEntry[] = [{ questionId: next.questionId, questionText: next.text, tag: next.tag, category: next.category, yesMin: next.yesMin, yesMax: next.yesMax, noMin: next.noMin, noMax: next.noMax, answer: "dont_know" }];
  const rows = await db.insert(ageSessions).values({ minAge: 0, maxAge: 100, history: JSON.stringify(history), askedIds: JSON.stringify([next.questionId]), status: "playing", questionCount: 1 }).returning();
  const session = rows[0];
  await db.update(ageQuestions).set({ timesAsked: sql`${ageQuestions.timesAsked} + 1` }).where(eq(ageQuestions.id, next.questionId));
  return buildSnapshot(session);
}

export async function answerAgeQuestion(sessionId: string, answer: AgeAnswer): Promise<AgeSnapshot> {
  const rows = await db.select().from(ageSessions).where(eq(ageSessions.id, sessionId)).limit(1);
  const session = rows[0]; if (!session) throw new Error("Session not found.");
  if (session.status !== "playing") throw new Error("Game is not in playing state.");
  let minAge = session.minAge, maxAge = session.maxAge;
  const history = parseHistory(session.history), askedIds = parseAskedIds(session.askedIds);
  if (history.length === 0) throw new Error("No current question.");
  const current = history[history.length - 1]; current.answer = answer;
  const result = applyAgeAnswer(minAge, maxAge, current); minAge = result.min; maxAge = result.max;
  const qRows = await db.select({ timesAsked: ageQuestions.timesAsked, avgInfoGain: ageQuestions.avgInfoGain }).from(ageQuestions).where(eq(ageQuestions.id, current.questionId)).limit(1);
  if (qRows[0]) {
    const q = qRows[0];
    const newAvg = q.timesAsked > 0 ? (q.avgInfoGain * (q.timesAsked - 1) + result.infoGain) / q.timesAsked : result.infoGain;
    await db.update(ageQuestions).set({ avgInfoGain: newAvg }).where(eq(ageQuestions.id, current.questionId));
  }
  const confidence = computeAgeConfidence(minAge, maxAge);
  const decision = shouldAgeGuess(minAge, maxAge, history.length);
  let nextStatus = "playing", questionCount = session.questionCount;
  let finalGuess: number | null = null, finalMin: number | null = null, finalMax: number | null = null, confidenceFinal: number | null = null;
  if (decision.guess) {
    finalGuess = Math.round((minAge + maxAge) / 2); finalMin = minAge; finalMax = maxAge; confidenceFinal = confidence; nextStatus = "guessing";
  } else {
    const next = await selectAgeQuestion(minAge, maxAge, askedIds, history);
    if (next) {
      history.push({ questionId: next.questionId, questionText: next.text, tag: next.tag, category: next.category, yesMin: next.yesMin, yesMax: next.yesMax, noMin: next.noMin, noMax: next.noMax, answer: "dont_know" });
      askedIds.push(next.questionId); questionCount += 1;
      await db.update(ageQuestions).set({ timesAsked: sql`${ageQuestions.timesAsked} + 1` }).where(eq(ageQuestions.id, next.questionId));
    } else {
      finalGuess = Math.round((minAge + maxAge) / 2); finalMin = minAge; finalMax = maxAge; confidenceFinal = confidence; nextStatus = "guessing";
    }
  }
  const updated = await db.update(ageSessions).set({ minAge, maxAge, history: JSON.stringify(history), askedIds: JSON.stringify(askedIds), status: nextStatus, questionCount, finalGuess, finalMin, finalMax, confidence: confidenceFinal, updatedAt: new Date() }).where(eq(ageSessions.id, sessionId)).returning();
  return buildSnapshot(updated[0]);
}

export async function confirmAgeGuess(sessionId: string, correct: boolean): Promise<AgeSnapshot> {
  const rows = await db.select().from(ageSessions).where(eq(ageSessions.id, sessionId)).limit(1);
  const session = rows[0]; if (!session) throw new Error("Session not found.");
  if (session.status !== "guessing") throw new Error("Game is not awaiting confirmation.");
  if (correct) {
    const askedIds = parseAskedIds(session.askedIds);
    if (askedIds.length > 0) await db.update(ageQuestions).set({ successCount: sql`${ageQuestions.successCount} + 1` }).where(inArray(ageQuestions.id, askedIds));
    await db.update(ageSessions).set({ status: "won", updatedAt: new Date() }).where(eq(ageSessions.id, sessionId));
    await recordAgeResult(session, true);
  } else {
    await db.update(ageSessions).set({ status: "lost", updatedAt: new Date() }).where(eq(ageSessions.id, sessionId));
    await recordAgeResult(session, false);
  }
  const updated = await db.select().from(ageSessions).where(eq(ageSessions.id, sessionId)).limit(1);
  return buildSnapshot(updated[0]);
}

export async function learnAgeFromFailure(sessionId: string, actualAge: number): Promise<{ ok: true }> {
  const rows = await db.select().from(ageSessions).where(eq(ageSessions.id, sessionId)).limit(1);
  const session = rows[0]; if (!session) throw new Error("Session not found.");
  const history = parseHistory(session.history);
  await db.insert(ageLearnings).values({
    guessedAge: session.finalGuess ?? 0, guessedMin: session.finalMin ?? 0, guessedMax: session.finalMax ?? 0, actualAge,
    history: JSON.stringify(history.map((h) => ({ question: h.questionText, answer: h.answer, tag: h.tag }))), status: "pending",
  });
  await db.update(ageSessions).set({ status: "lost", updatedAt: new Date() }).where(eq(ageSessions.id, sessionId));
  return { ok: true };
}

async function recordAgeResult(session: any, won: boolean): Promise<void> {
  const durationSec = Math.max(1, Math.round((Date.now() - new Date(session.createdAt).getTime()) / 1000));
  await db.insert(ageResults).values({ questionCount: session.questionCount, won, guessedAge: session.finalGuess ?? 0, guessedMin: session.finalMin ?? 0, guessedMax: session.finalMax ?? 0, durationSec });
}

export async function getAgeSnapshot(sessionId: string): Promise<AgeSnapshot | null> {
  const rows = await db.select().from(ageSessions).where(eq(ageSessions.id, sessionId)).limit(1);
  const session = rows[0]; if (!session) return null;
  return buildSnapshot(session);
}
