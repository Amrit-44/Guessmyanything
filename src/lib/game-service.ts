/**
 * GUESS MY ANYTHING — Game Service
 *
 * Orchestrates game sessions: start, answer, confirm guess, undo, restart,
 * learn, and analytics recording. Uses the intelligence engine for scoring
 * and dynamic question selection.
 */

import { db } from "@/lib/db";
import {
  type Answer,
  type ScoreEntry,
  type HistoryEntry,
  type GuessEntry,
  type EngineConfig,
  loadConfig,
  parseScoreboard,
  parseHistory,
  buildInitialScoreboard,
  applySingleAnswer,
  rebuildScoreboard,
  selectNextQuestion,
  shouldGuess,
  detectIndustry,
  computeConfidencePercent,
  computeGuessConfidences,
} from "@/lib/engine";

// ------------------------------------------------------------
// Public response types
// ------------------------------------------------------------

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
  rank: number; // 1, 2, or 3
  confidence?: number; // 0..100 percentage (job mode)
}

export interface GameSnapshot {
  sessionId: string;
  status: "playing" | "guessing" | "won" | "lost";
  question: QuestionView | null;
  guess: GuessView | null;
  topGuesses: GuessView[];
  questionCount: number;
  history: {
    questionId: string;
    questionText: string;
    answer: Answer;
  }[];
  category: string | null;
  categoryName: string | null;
  confidence: {
    topScore: number;
    secondScore: number;
    gap: number;
    percent: number; // 0..100 confidence indicator
  };
  industry: { name: string; confidence: number } | null; // job mode only
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

async function entityToGuessView(
  s: ScoreEntry,
  rank: number
): Promise<GuessView> {
  const e = await db.entity.findUnique({
    where: { id: s.id },
    select: {
      name: true,
      description: true,
      category: { select: { name: true } },
    },
  });
  return {
    entityId: s.id,
    entityName: e?.name ?? s.name,
    description: e?.description ?? null,
    categoryName: e?.category.name ?? "Unknown",
    score: Math.round(s.score),
    rank,
  };
}

function parseAskedIds(json: string): string[] {
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? (arr as string[]) : [];
  } catch {
    return [];
  }
}

function parseGuessesMade(json: string): string[] {
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? (arr as string[]) : [];
  } catch {
    return [];
  }
}

function computeConfidence(scoreboard: ScoreEntry[]) {
  const top = scoreboard[0];
  const second = scoreboard[1];
  const topScore = top ? top.score : 0;
  const secondScore = second ? second.score : 0;
  const gap = topScore - secondScore;
  // Softmax-based confidence: the top entity's share of probability mass.
  const percent = computeConfidencePercent(scoreboard);
  return { topScore, secondScore, gap, percent };
}

/**
 * Update a question's running average info gain when it is asked.
 * balance (0..1) = how evenly the question split the candidate pool.
 */
async function trackQuestionAnalytics(
  questionId: string,
  balance: number
): Promise<void> {
  const q = await db.question.findUnique({
    where: { id: questionId },
    select: { timesAsked: true, avgInfoGain: true },
  });
  if (!q) return;
  const newCount = q.timesAsked + 1;
  const newAvg =
    q.timesAsked > 0
      ? (q.avgInfoGain * q.timesAsked + balance) / newCount
      : balance;
  await db.question.update({
    where: { id: questionId },
    data: { timesAsked: newCount, avgInfoGain: newAvg },
  });
}

async function buildSnapshot(
  session: {
    id: string;
    categoryFilter: string | null;
    scoreboard: string;
    history: string;
    askedIds: string;
    status: string;
    guessesMade: string;
    questionCount: number;
    currentGuess: string | null;
  },
  cfg: EngineConfig
): Promise<GameSnapshot> {
  const scoreboard = parseScoreboard(session.scoreboard);
  const history = parseHistory(session.history);
  const category = session.categoryFilter;

  let categoryName: string | null = null;
  if (category) {
    const c = await db.category.findUnique({ where: { slug: category } });
    categoryName = c?.name ?? null;
  }

  // Current question: the last asked question (for display) — but we also need
  // to surface the "next" question when playing. The snapshot's `question`
  // field is the question currently awaiting an answer. We recompute it lazily
  // via the answer endpoint; for the snapshot we read from the last history
  // entry's text when status === playing.
  let question: QuestionView | null = null;
  if (session.status === "playing" && history.length > 0) {
    const last = history[history.length - 1];
    question = {
      questionId: last.questionId,
      text: last.questionText,
      questionNumber: history.length,
    };
  }

  let guess: GuessView | null = null;
  if (session.currentGuess) {
    try {
      guess = JSON.parse(session.currentGuess) as GuessView;
    } catch {
      guess = null;
    }
  }

  // Top 3 guesses for multi-guess display.
  const top3 = scoreboard.slice(0, 3);
  const guessConfidences = computeGuessConfidences(scoreboard, 3);
  const topGuesses: GuessView[] = [];
  for (let i = 0; i < top3.length; i++) {
    const gv = await entityToGuessView(top3[i], i + 1);
    gv.confidence = guessConfidences[i] ?? 0;
    topGuesses.push(gv);
  }

  // Industry detection (job mode only).
  let industry: { name: string; confidence: number } | null = null;
  if (category === "jobs") {
    const ind = await detectIndustry(scoreboard);
    if (ind && ind.confidence > 0.15) {
      industry = {
        name: ind.industryLabel.charAt(0).toUpperCase() + ind.industryLabel.slice(1),
        confidence: Math.round(ind.confidence * 100),
      };
    }
  }

  return {
    sessionId: session.id,
    status: session.status as GameSnapshot["status"],
    question,
    guess,
    topGuesses,
    questionCount: session.questionCount,
    history: history.map((h) => ({
      questionId: h.questionId,
      questionText: h.questionText,
      answer: h.answer,
    })),
    category,
    categoryName,
    confidence: computeConfidence(scoreboard),
    industry,
  };
}

// ------------------------------------------------------------
// START a new game
// ------------------------------------------------------------

export async function startGame(categoryFilter: string | null): Promise<GameSnapshot> {
  const cfg = await loadConfig();

  // Validate category if provided.
  if (categoryFilter) {
    const cat = await db.category.findUnique({ where: { slug: categoryFilter } });
    if (!cat) categoryFilter = null;
  }

  const scoreboard = await buildInitialScoreboard(cfg, categoryFilter);
  if (scoreboard.length === 0) {
    throw new Error("No entities available for this category.");
  }

  // Pick the first question.
  const next = await selectNextQuestion(scoreboard, [], cfg, categoryFilter, []);
  if (!next) {
    throw new Error("No questions available.");
  }

  const history: HistoryEntry[] = [
    {
      questionId: next.questionId,
      questionText: next.questionText,
      tagId: next.tagId,
      tagSlug: next.tagSlug,
      inverted: next.inverted,
      answer: "dont_know", // placeholder, will be overwritten on answer
    },
  ];

  const session = await db.gameSession.create({
    data: {
      categoryFilter,
      scoreboard: JSON.stringify(scoreboard),
      history: JSON.stringify(history),
      askedIds: JSON.stringify([next.questionId]),
      status: "playing",
      questionCount: 1,
    },
  });

  // Track question analytics (timesAsked + avgInfoGain).
  await trackQuestionAnalytics(next.questionId, next.balance);

  return buildSnapshot(session, cfg);
}

// ------------------------------------------------------------
// ANSWER the current question
// ------------------------------------------------------------

export async function answerQuestion(
  sessionId: string,
  answer: Answer
): Promise<GameSnapshot> {
  const cfg = await loadConfig();
  const session = await db.gameSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new Error("Session not found.");
  if (session.status !== "playing")
    throw new Error("Game is not in playing state.");

  const scoreboard = parseScoreboard(session.scoreboard);
  const history = parseHistory(session.history);
  const askedIds = parseAskedIds(session.askedIds);
  const guessesMade = parseGuessesMade(session.guessesMade);

  if (history.length === 0) throw new Error("No current question.");

  // Replace the sentinel answer on the last history entry with the real answer.
  const current = history[history.length - 1];
  current.answer = answer;

  // Apply the answer to the scoreboard (incremental).
  await applySingleAnswer(scoreboard, current, cfg);

  // Decide: guess or ask another question.
  const decision = shouldGuess(scoreboard, history.length, cfg, guessesMade);

  let nextStatus: string = "playing";
  let currentGuessJson: string | null = null;
  let questionCount = session.questionCount;

  if (decision.guess) {
    // Pick the top entity not yet guessed.
    const candidate = scoreboard.find((s) => !guessesMade.includes(s.id));
    if (candidate) {
      const guessView = await entityToGuessView(candidate, guessesMade.length + 1);
      currentGuessJson = JSON.stringify(guessView);
      nextStatus = "guessing";
    } else {
      // Exhausted all guesses.
      nextStatus = "lost";
      await recordResult(session, false, "—", cfg);
    }
  } else {
    // Pick the next question. Pass probed tag slugs + answer history for
    // near-duplicate prevention AND mutually-exclusive-group filtering.
    const probedTags = history.map((h) => h.tagSlug);
    const answerHistory = history.map((h) => ({ tagSlug: h.tagSlug, answer: h.answer }));
    const next = await selectNextQuestion(scoreboard, askedIds, cfg, session.categoryFilter, probedTags, answerHistory);
    if (next) {
      history.push({
        questionId: next.questionId,
        questionText: next.questionText,
        tagId: next.tagId,
        tagSlug: next.tagSlug,
        inverted: next.inverted,
        answer: "dont_know",
      });
      askedIds.push(next.questionId);
      questionCount += 1;
      await trackQuestionAnalytics(next.questionId, next.balance);
    } else {
      // No more questions — force a guess.
      const candidate = scoreboard.find((s) => !guessesMade.includes(s.id));
      if (candidate) {
        const guessView = await entityToGuessView(candidate, guessesMade.length + 1);
        currentGuessJson = JSON.stringify(guessView);
        nextStatus = "guessing";
      } else {
        nextStatus = "lost";
        await recordResult(session, false, "—", cfg);
      }
    }
  }

  const updated = await db.gameSession.update({
    where: { id: sessionId },
    data: {
      scoreboard: JSON.stringify(scoreboard),
      history: JSON.stringify(history),
      askedIds: JSON.stringify(askedIds),
      status: nextStatus,
      currentGuess: currentGuessJson,
      questionCount,
    },
  });

  return buildSnapshot(updated, cfg);
}

// ------------------------------------------------------------
// CONFIRM or DENY a guess
// ------------------------------------------------------------

export async function confirmGuess(
  sessionId: string,
  correct: boolean
): Promise<GameSnapshot> {
  const cfg = await loadConfig();
  const session = await db.gameSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new Error("Session not found.");
  if (session.status !== "guessing")
    throw new Error("Game is not awaiting guess confirmation.");

  const scoreboard = parseScoreboard(session.scoreboard);
  const history = parseHistory(session.history);
  const askedIds = parseAskedIds(session.askedIds);
  const guessesMade = parseGuessesMade(session.guessesMade);
  const currentGuess = session.currentGuess
    ? (JSON.parse(session.currentGuess) as GuessEntry)
    : null;

  if (!currentGuess) throw new Error("No current guess.");

  if (correct) {
    // Mark the question success for all asked questions (the question led to a win).
    await db.question.updateMany({
      where: { id: { in: askedIds } },
      data: { successCount: { increment: 1 } },
    });
    await db.gameSession.update({
      where: { id: sessionId },
      data: { status: "won", currentGuess: null },
    });
    await recordResult(session, true, currentGuess.entityName, cfg);
    const updated = await db.gameSession.findUnique({ where: { id: sessionId } });
    return buildSnapshot(updated!, cfg);
  }

  // Wrong guess: record it and continue.
  guessesMade.push(currentGuess.entityId);
  // Increment fail count for asked questions (they led to a wrong guess).
  await db.question.updateMany({
    where: { id: { in: askedIds } },
    data: { failCount: { increment: 1 } },
  });

  // Give up after too many wrong guesses — let the user teach us.
  if (guessesMade.length >= cfg.maxGuesses) {
    await db.gameSession.update({
      where: { id: sessionId },
      data: {
        guessesMade: JSON.stringify(guessesMade),
        status: "lost",
        currentGuess: null,
      },
    });
    await recordResult(session, false, "—", cfg);
    const updated = await db.gameSession.findUnique({ where: { id: sessionId } });
    return buildSnapshot(updated!, cfg);
  }

  // Try to make another guess if confidence still supports it, else ask more.
  const decision = shouldGuess(scoreboard, history.length, cfg, guessesMade);

  let nextStatus = "playing";
  let currentGuessJson: string | null = null;
  let questionCount = session.questionCount;

  if (decision.guess) {
    const candidate = scoreboard.find((s) => !guessesMade.includes(s.id));
    if (candidate) {
      const gv = await entityToGuessView(candidate, guessesMade.length + 1);
      currentGuessJson = JSON.stringify(gv);
      nextStatus = "guessing";
    } else {
      nextStatus = "lost";
      await recordResult(session, false, "—", cfg);
    }
  } else {
    const probedTags = history.map((h) => h.tagSlug);
    const answerHistory = history.map((h) => ({ tagSlug: h.tagSlug, answer: h.answer }));
    const next = await selectNextQuestion(scoreboard, askedIds, cfg, session.categoryFilter, probedTags, answerHistory);
    if (next) {
      history.push({
        questionId: next.questionId,
        questionText: next.questionText,
        tagId: next.tagId,
        tagSlug: next.tagSlug,
        inverted: next.inverted,
        answer: "dont_know",
      });
      askedIds.push(next.questionId);
      questionCount += 1;
      await trackQuestionAnalytics(next.questionId, next.balance);
    } else {
      const candidate = scoreboard.find((s) => !guessesMade.includes(s.id));
      if (candidate) {
        const gv = await entityToGuessView(candidate, guessesMade.length + 1);
        currentGuessJson = JSON.stringify(gv);
        nextStatus = "guessing";
      } else {
        nextStatus = "lost";
        await recordResult(session, false, "—", cfg);
      }
    }
  }

  const updated = await db.gameSession.update({
    where: { id: sessionId },
    data: {
      guessesMade: JSON.stringify(guessesMade),
      status: nextStatus,
      currentGuess: currentGuessJson,
      history: JSON.stringify(history),
      askedIds: JSON.stringify(askedIds),
      questionCount,
    },
  });

  return buildSnapshot(updated, cfg);
}

// ------------------------------------------------------------
// UNDO the last answer
// ------------------------------------------------------------

export async function undoLastAnswer(sessionId: string): Promise<GameSnapshot> {
  const cfg = await loadConfig();
  const session = await db.gameSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new Error("Session not found.");
  if (session.status === "won" || session.status === "lost")
    throw new Error("Cannot undo a finished game.");

  const scoreboard = parseScoreboard(session.scoreboard);
  let history = parseHistory(session.history);
  let askedIds = parseAskedIds(session.askedIds);
  const guessesMade = parseGuessesMade(session.guessesMade);

  if (history.length === 0) throw new Error("Nothing to undo.");

  // If we're in guessing state, just cancel the guess (don't remove a question).
  if (session.status === "guessing") {
    const updated = await db.gameSession.update({
      where: { id: sessionId },
      data: { status: "playing", currentGuess: null },
    });
    return buildSnapshot(updated, cfg);
  }

  // Remove the last question (the one currently awaiting an answer) — it has
  // the sentinel answer. If the last entry has a real answer, remove it too.
  const last = history[history.length - 1];
  history = history.slice(0, -1);
  askedIds = askedIds.filter((id) => id !== last.questionId);

  // If there's still a question pending (the new last entry), keep it. If
  // history is now empty we need a fresh first question.
  let questionCount = session.questionCount - 1;
  if (questionCount < 1) questionCount = 1;

  if (history.length === 0) {
    // Restart with a fresh first question.
    const fresh = await selectNextQuestion(scoreboard, askedIds, cfg, session.categoryFilter, []);
    if (fresh) {
      history.push({
        questionId: fresh.questionId,
        questionText: fresh.questionText,
        tagId: fresh.tagId,
        tagSlug: fresh.tagSlug,
        inverted: fresh.inverted,
        answer: "dont_know",
      });
      askedIds.push(fresh.questionId);
      questionCount = 1;
      await trackQuestionAnalytics(fresh.questionId, fresh.balance);
    }
  } else {
    // The new last entry: if it had a real answer, we need to revert the score
    // for that answer and mark it as the pending question again.
    const newLast = history[history.length - 1];
    if (newLast.answer !== "dont_know") {
      // Rebuild scoreboard from history minus this answer.
      const replayHistory = history.slice(0, -1);
      await rebuildScoreboard(scoreboard, replayHistory, cfg);
      newLast.answer = "dont_know";
    }
  }

  const updated = await db.gameSession.update({
    where: { id: sessionId },
    data: {
      history: JSON.stringify(history),
      askedIds: JSON.stringify(askedIds),
      scoreboard: JSON.stringify(scoreboard),
      status: "playing",
      currentGuess: null,
      questionCount,
    },
  });

  return buildSnapshot(updated, cfg);
}

// ------------------------------------------------------------
// RESTART the game (same category)
// ------------------------------------------------------------

export async function restartGame(sessionId: string): Promise<GameSnapshot> {
  const session = await db.gameSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new Error("Session not found.");
  // Delete and start fresh.
  await db.gameSession.delete({ where: { id: sessionId } });
  return startGame(session.categoryFilter);
}

// ------------------------------------------------------------
// LEARN — record what the user was thinking of when AI failed
// ------------------------------------------------------------

export async function learnFromFailure(
  sessionId: string,
  correctAnswer: string,
  category?: string,
  description?: string
): Promise<{ ok: true }> {
  const session = await db.gameSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new Error("Session not found.");

  const history = parseHistory(session.history);
  const guessesMade = parseGuessesMade(session.guessesMade);

  // Look up entity names for guesses.
  const guessEntities = await db.entity.findMany({
    where: { id: { in: guessesMade } },
    select: { id: true, name: true },
  });
  const aiGuesses = guessEntities.map((e) => e.name);

  // Check if the correct answer matches an existing entity.
  const existing = await db.entity.findFirst({
    where: { name: { equals: correctAnswer } },
  });

  await db.learning.create({
    data: {
      correctAnswer,
      category: category ?? session.categoryFilter,
      description: description ?? null,
      existingEntityId: existing?.id ?? null,
      history: JSON.stringify(
        history.map((h) => ({
          question: h.questionText,
          answer: h.answer,
        }))
      ),
      aiGuesses: JSON.stringify(aiGuesses),
      status: "pending",
    },
  });

  // Record the game result as a loss.
  const cfg = await loadConfig();
  await recordResult(session, false, correctAnswer, cfg, aiGuesses.join(", "));

  // Mark session as lost.
  await db.gameSession.update({
    where: { id: sessionId },
    data: { status: "lost", currentGuess: null },
  });

  return { ok: true };
}

// ------------------------------------------------------------
// Record a game result for analytics
// ------------------------------------------------------------

async function recordResult(
  session: { id: string; categoryFilter: string | null; questionCount: number; createdAt: Date },
  won: boolean,
  guessedEntity: string,
  cfg: EngineConfig,
  correctEntity?: string
): Promise<void> {
  const durationSec = Math.max(
    1,
    Math.round((Date.now() - session.createdAt.getTime()) / 1000)
  );
  await db.gameResult.create({
    data: {
      category: session.categoryFilter ?? "Anything",
      questionCount: session.questionCount,
      won,
      guessedEntity,
      correctEntity: correctEntity ?? null,
      durationSec,
    },
  });
}

// ------------------------------------------------------------
// Get current snapshot (for resume)
// ------------------------------------------------------------

export async function getSnapshot(sessionId: string): Promise<GameSnapshot | null> {
  const cfg = await loadConfig();
  const session = await db.gameSession.findUnique({ where: { id: sessionId } });
  if (!session) return null;
  return buildSnapshot(session, cfg);
}
