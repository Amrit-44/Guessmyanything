/**
 * GUESS MY ANYTHING — Intelligence Engine V2
 *
 * Weighted scoring (NOT elimination) + dynamic question selection via
 * information-gain / balanced-split heuristic + multi-tier confidence.
 *
 * Every entity keeps a running score. Answers nudge scores up/down based on
 * tag membership. We never hard-eliminate, so the engine recovers from user
 * mistakes and ambiguous answers.
 */

import { db } from "@/lib/db";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

export type Answer = "yes" | "probably" | "dont_know" | "probably_not" | "no";

export interface ScoreEntry {
  id: string;
  name: string;
  categoryId: string;
  score: number;
  popularity: number;
}

export interface HistoryEntry {
  questionId: string;
  questionText: string;
  tagId: string;
  tagSlug: string;
  inverted: boolean;
  answer: Answer;
}

export interface GuessEntry {
  entityId: string;
  entityName: string;
  score: number;
}

export interface EngineConfig {
  initialScore: number;
  weightYes: number;
  weightProbably: number;
  weightDontKnow: number;
  weightProbablyNot: number;
  weightNo: number;
  minQuestions: number;
  maxQuestions: number;
  confidenceThreshold: number; // top score must exceed initial * this
  scoreGapThreshold: number; // top - second must exceed this
  candidatePoolSize: number;
  maxGuesses: number; // after this many wrong guesses, the AI gives up
}

export const DEFAULT_CONFIG: EngineConfig = {
  initialScore: 100,
  weightYes: 15,
  weightProbably: 8,
  weightDontKnow: 0,
  weightProbablyNot: 8,
  weightNo: 15,
  minQuestions: 8,
  maxQuestions: 28,
  confidenceThreshold: 1.45,
  scoreGapThreshold: 55,
  candidatePoolSize: 200,
  maxGuesses: 3,
};

// ------------------------------------------------------------
// Config loading (from DB settings, falling back to defaults)
// ------------------------------------------------------------

export async function loadConfig(): Promise<EngineConfig> {
  try {
    const settings = await db.setting.findMany({ where: { group: "game" } });
    const map = new Map(settings.map((s) => [s.key, s.value]));
    const num = (k: string, d: number) => {
      const v = map.get(k);
      return v ? Number(v) : d;
    };
    return {
      initialScore: num("initialScore", DEFAULT_CONFIG.initialScore),
      weightYes: num("weightYes", DEFAULT_CONFIG.weightYes),
      weightProbably: num("weightProbably", DEFAULT_CONFIG.weightProbably),
      weightDontKnow: num("weightDontKnow", DEFAULT_CONFIG.weightDontKnow),
      weightProbablyNot: num("weightProbablyNot", DEFAULT_CONFIG.weightProbablyNot),
      weightNo: num("weightNo", DEFAULT_CONFIG.weightNo),
      minQuestions: num("minQuestions", DEFAULT_CONFIG.minQuestions),
      maxQuestions: num("maxQuestions", DEFAULT_CONFIG.maxQuestions),
      confidenceThreshold: num("confidenceThreshold", DEFAULT_CONFIG.confidenceThreshold),
      scoreGapThreshold: num("scoreGapThreshold", DEFAULT_CONFIG.scoreGapThreshold),
      candidatePoolSize: num("candidatePoolSize", DEFAULT_CONFIG.candidatePoolSize),
      maxGuesses: num("maxGuesses", DEFAULT_CONFIG.maxGuesses),
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

// ------------------------------------------------------------
// Answer weight mapping
// ------------------------------------------------------------

export function answerWeight(answer: Answer, cfg: EngineConfig): number {
  switch (answer) {
    case "yes":
      return cfg.weightYes;
    case "probably":
      return cfg.weightProbably;
    case "dont_know":
      return cfg.weightDontKnow;
    case "probably_not":
      return cfg.weightProbablyNot;
    case "no":
      return -cfg.weightNo;
    default:
      return 0;
  }
}

// ------------------------------------------------------------
// Scoreboard helpers
// ------------------------------------------------------------

export function parseScoreboard(json: string): ScoreEntry[] {
  try {
    const arr = JSON.parse(json);
    if (!Array.isArray(arr)) return [];
    return arr as ScoreEntry[];
  } catch {
    return [];
  }
}

export function parseHistory(json: string): HistoryEntry[] {
  try {
    const arr = JSON.parse(json);
    if (!Array.isArray(arr)) return [];
    return arr as HistoryEntry[];
  } catch {
    return [];
  }
}

// ------------------------------------------------------------
// Build the initial scoreboard for a category filter
// ------------------------------------------------------------

export async function buildInitialScoreboard(
  cfg: EngineConfig,
  categoryFilter: string | null
): Promise<ScoreEntry[]> {
  const entities = await db.entity.findMany({
    where: {
      isActive: true,
      ...(categoryFilter ? { category: { slug: categoryFilter } } : {}),
    },
    select: { id: true, name: true, categoryId: true, popularity: true },
  });

  // Sort by popularity desc so ties break toward well-known entities.
  entities.sort((a, b) => b.popularity - a.popularity);

  return entities.map((e) => ({
    id: e.id,
    name: e.name,
    categoryId: e.categoryId,
    score: cfg.initialScore + (e.popularity - 50) * 0.1, // tiny prior
    popularity: e.popularity,
  }));
}

// ------------------------------------------------------------
// Apply a SINGLE answer to the scoreboard (incremental, scalable).
// Queries only the one tag's membership instead of all tags.
// ------------------------------------------------------------

export async function applySingleAnswer(
  scoreboard: ScoreEntry[],
  entry: HistoryEntry,
  cfg: EngineConfig
): Promise<ScoreEntry[]> {
  const weight = answerWeight(entry.answer, cfg);
  if (weight === 0) return scoreboard; // "don't know" changes nothing

  // Single indexed query: which entities have this tag?
  const tagRows = await db.entityTag.findMany({
    where: { tag: { slug: entry.tagSlug } },
    select: { entityId: true },
  });
  const hasTag = new Set(tagRows.map((r) => r.entityId));

  for (const s of scoreboard) {
    const has = hasTag.has(s.id);
    // Normal question: Yes(+w) => has ? +w : -w
    // Inverted question: Yes(+w) => has ? -w : +w
    const matches = entry.inverted ? !has : has;
    const delta = matches ? weight : -weight;
    s.score += delta;
    if (s.score < 0) s.score = 0;
  }

  scoreboard.sort((a, b) => b.score - a.score || b.popularity - a.popularity);
  return scoreboard;
}

// ------------------------------------------------------------
// Rebuild the scoreboard from scratch by replaying full history.
// Used for undo & resume. O(questions × entities).
// ------------------------------------------------------------

export async function rebuildScoreboard(
  scoreboard: ScoreEntry[],
  history: HistoryEntry[],
  cfg: EngineConfig
): Promise<ScoreEntry[]> {
  // Reset scores to initial + popularity prior.
  for (const s of scoreboard) {
    s.score = cfg.initialScore + (s.popularity - 50) * 0.1;
  }
  // Replay each answer incrementally.
  for (const entry of history) {
    await applySingleAnswer(scoreboard, entry, cfg);
  }
  return scoreboard;
}

// ------------------------------------------------------------
// JOB MODE — Industry detection & locking
//
// The strict category lock (only loading questions whose category
// matches the selected mode) now applies to ALL categories, not just
// jobs — see selectNextQuestion(). This prevents off-category questions
// like "Is it a large animal?" from appearing in Countries mode.
//
// Beyond the shared category lock, job mode adds:
//   1. INDUSTRY DETECTION: computes score mass per industry tag to
//      identify the user's industry (Healthcare, Technology, etc.).
//   2. INDUSTRY LOCKING: when one industry exceeds 65% confidence,
//      filters the candidate pool to that industry so subsequent
//      questions discriminate WITHIN the industry.
//   3. INDUSTRY BROAD BOOST: early questions prioritize industry-
//      probing tags so the industry is identified quickly.
// ------------------------------------------------------------

export const JOB_INDUSTRIES = [
  "industry-healthcare",
  "industry-technology",
  "industry-education",
  "industry-business",
  "industry-finance",
  "industry-construction",
  "industry-transportation",
  "industry-government",
  "industry-agriculture",
  "industry-science",
  "industry-arts",
  "industry-hospitality",
  "industry-legal",
  "industry-manufacturing",
] as const;

export interface IndustryDetection {
  industry: string; // tag slug e.g. "industry-healthcare"
  industryLabel: string; // human label e.g. "healthcare"
  confidence: number; // 0..1
}

/**
 * Detect the dominant industry in the current candidate pool.
 * Returns null if no industry tags are present (non-job mode).
 */
export async function detectIndustry(
  scoreboard: ScoreEntry[]
): Promise<IndustryDetection | null> {
  const pool = scoreboard.slice(0, 100);
  const poolIds = pool.map((s) => s.id);
  if (poolIds.length === 0) return null;

  const tagRows = await db.entityTag.findMany({
    where: {
      entityId: { in: poolIds },
      tag: { slug: { in: [...JOB_INDUSTRIES] } },
    },
    select: { entityId: true, tag: { select: { slug: true } } },
  });

  const entityIndustry = new Map<string, string>();
  for (const row of tagRows) {
    entityIndustry.set(row.entityId, row.tag.slug);
  }

  const industryMass = new Map<string, number>();
  let totalMass = 0;
  for (const s of pool) {
    const ind = entityIndustry.get(s.id);
    if (ind) {
      industryMass.set(ind, (industryMass.get(ind) ?? 0) + Math.max(s.score, 1));
      totalMass += Math.max(s.score, 1);
    }
  }

  if (totalMass === 0) return null;

  let dominant = "";
  let dominantMass = 0;
  for (const [ind, mass] of industryMass) {
    if (mass > dominantMass) {
      dominantMass = mass;
      dominant = ind;
    }
  }

  const confidence = dominantMass / totalMass;
  const industryLabel = dominant.replace("industry-", "");
  return { industry: dominant, industryLabel, confidence };
}

/**
 * Get the set of entity IDs that belong to a given industry tag.
 */
async function getIndustryEntityIds(
  industryTagSlug: string
): Promise<Set<string>> {
  const rows = await db.entityTag.findMany({
    where: { tag: { slug: industryTagSlug } },
    select: { entityId: true },
  });
  return new Set(rows.map((r) => r.entityId));
}

// ------------------------------------------------------------
// Dynamic question selection — information gain heuristic
//
// We want the question whose tag best splits the current candidate
// pool close to 50/50 (by score mass). Such questions extract the
// most information per answer. We also fold in historical
// effectiveness (win rate + avg info gain) so proven questions get
// a mild boost.
//
// JOB MODE enhancements:
//   - Strict category lock (only job questions)
//   - Near-duplicate prevention (never re-probe the same tag)
//   - Industry detection + locking
//   - Industry broad boost for early questions
// ------------------------------------------------------------

export interface SelectedQuestion {
  questionId: string;
  questionText: string;
  tagId: string;
  tagSlug: string;
  inverted: boolean;
  balance: number; // 0..1, how evenly this question splits the pool
}

export async function selectNextQuestion(
  scoreboard: ScoreEntry[],
  askedIds: string[],
  cfg: EngineConfig,
  categoryFilter: string | null,
  probedTagSlugs: string[] = []
): Promise<SelectedQuestion | null> {
  const askedCount = askedIds.length;
  const isJobMode = categoryFilter === "jobs";
  const isAnythingMode = categoryFilter === null;
  const isCategoryMode = categoryFilter !== null;

  // --- Candidate pool (shrinks as game progresses) ---
  const dynamicPoolSize = Math.max(
    12,
    Math.min(cfg.candidatePoolSize, 60 - askedCount * 4)
  );
  let pool = scoreboard.slice(0, dynamicPoolSize);
  if (pool.length === 0) return null;

  const poolIds = pool.map((s) => s.id);

  // Load tag memberships for the pool entities.
  const poolTagRows = await db.entityTag.findMany({
    where: { entityId: { in: poolIds } },
    select: { entityId: true, tag: { select: { slug: true, id: true } } },
  });

  const entityTags = new Map<string, Set<string>>();
  for (const row of poolTagRows) {
    let set = entityTags.get(row.entityId);
    if (!set) {
      set = new Set();
      entityTags.set(row.entityId, set);
    }
    set.add(row.tag.slug);
  }

  // --- JOB MODE: Industry detection & locking ---
  let industryLock: IndustryDetection | null = null;
  if (isJobMode) {
    industryLock = await detectIndustry(scoreboard);
    // Lock when industry confidence exceeds 65% AND the filtered pool is
    // large enough to still have meaningful question splits.
    if (industryLock && industryLock.confidence > 0.65) {
      const indEntityIds = await getIndustryEntityIds(industryLock.industry);
      const filtered = pool.filter((s) => indEntityIds.has(s.id));
      if (filtered.length >= 5) {
        pool = filtered;
      }
    }
  }

  // --- Near-duplicate prevention: never re-probe a tag already asked ---
  const probedSet = new Set(probedTagSlugs);

  // --- Eligible questions ---
  // STRICT CATEGORY LOCK: when a specific category is selected, ONLY load
  // questions assigned to that category. General questions (categoryId: null)
  // are NEVER loaded in category mode, so the engine can NEVER ask an
  // off-category question like "Is it a large animal?" while playing
  // Countries. Anything mode loads ALL questions (broad splitters + every
  // category's questions) so it can narrow down then drill in.
  const questionWhere = isCategoryMode
    ? {
        isActive: true,
        id: { notIn: askedIds },
        category: { slug: categoryFilter as string },
      }
    : { isActive: true, id: { notIn: askedIds } };

  const questions = await db.question.findMany({
    where: questionWhere,
    select: {
      id: true,
      text: true,
      inverted: true,
      primaryTag: { select: { id: true, slug: true } },
      timesAsked: true,
      successCount: true,
      failCount: true,
      avgInfoGain: true,
    },
  });

  if (questions.length === 0) return null;

  // --- Broad-tag boosts ---
  const BROAD_TAGS = new Set([
    "real_person",
    "fictional_character",
    "profession",
    "animal",
    "place",
    "movie",
    "tv_show",
    "video_game",
    "brand",
    "object",
    "sport",
    "historical_figure",
    "celebrity",
  ]);
  const INDUSTRY_TAG_SET = new Set<string>([...JOB_INDUSTRIES]);

  // Anything mode: broad category boost decays over first few questions.
  const broadBoost = isAnythingMode
    ? Math.max(0, 0.35 - askedCount * 0.09)
    : 0;

  // Job mode: industry-probing boost decays over first 6 questions.
  const industryBoost = isJobMode
    ? Math.max(0, 0.4 - askedCount * 0.08)
    : 0;

  let best: { questionId: string; questionText: string; tagId: string; tagSlug: string; inverted: boolean; score: number; balance: number } | null = null;

  for (const q of questions) {
    const slug = q.primaryTag.slug;

    // Near-duplicate prevention: skip if this tag was already probed.
    if (probedSet.has(slug)) continue;

    // Compute balance on the (possibly industry-locked) pool.
    let massWith = 0;
    let massWithout = 0;
    for (const s of pool) {
      const tags = entityTags.get(s.id);
      const has = tags ? tags.has(slug) : false;
      const effectiveHas = q.inverted ? !has : has;
      if (effectiveHas) massWith += Math.max(s.score, 1);
      else massWithout += Math.max(s.score, 1);
    }

    if (massWith === 0 && massWithout === 0) continue;

    // Balance: 1.0 when 50/50, 0 when one-sided.
    const balance =
      1 - Math.abs(massWith - massWithout) / (massWith + massWithout);

    // Skip questions that split nothing useful.
    if (massWith === 0 || massWithout === 0) continue;

    // --- Effectiveness (Fix #5): blend win rate + avg info gain ---
    const totalQ = q.timesAsked || 0;
    const winRate = totalQ > 0 ? q.successCount / totalQ : 0.5;
    const infoGain = q.avgInfoGain || 0;
    const eff = totalQ > 0
      ? 0.25 + 0.35 * winRate + 0.4 * infoGain
      : 0.55;

    // --- Boosts ---
    const broad = isAnythingMode && BROAD_TAGS.has(slug) ? broadBoost : 0;
    const indBoost = isJobMode && INDUSTRY_TAG_SET.has(slug) ? industryBoost : 0;

    // Final score: balance dominates, effectiveness is a tie-breaker,
    // broad/industry boosts ensure category-carving questions go first.
    const score = balance * 0.7 + eff * 0.2 + broad + indBoost;

    if (!best || score > best.score) {
      best = {
        questionId: q.id,
        questionText: q.text,
        tagId: q.primaryTag.id,
        tagSlug: slug,
        inverted: q.inverted,
        score,
        balance,
      };
    }
  }

  // Fallback: if every question was filtered (all tags probed or no splits),
  // relax the near-duplicate filter and try again with just the askedIds filter.
  if (!best) {
    for (const q of questions) {
      const slug = q.primaryTag.slug;
      let massWith = 0;
      let massWithout = 0;
      for (const s of pool) {
        const tags = entityTags.get(s.id);
        const has = tags ? tags.has(slug) : false;
        const effectiveHas = q.inverted ? !has : has;
        if (effectiveHas) massWith += Math.max(s.score, 1);
        else massWithout += Math.max(s.score, 1);
      }
      if (massWith === 0 || massWithout === 0) continue;
      const balance =
        1 - Math.abs(massWith - massWithout) / (massWith + massWithout);
      best = {
        questionId: q.id,
        questionText: q.text,
        tagId: q.primaryTag.id,
        tagSlug: slug,
        inverted: q.inverted,
        score: balance,
        balance,
      };
      break;
    }
  }

  if (!best) return null;

  return {
    questionId: best.questionId,
    questionText: best.questionText,
    tagId: best.tagId,
    tagSlug: best.tagSlug,
    inverted: best.inverted,
    balance: best.balance,
  };
}

// ------------------------------------------------------------
// Confidence evaluation
// ------------------------------------------------------------

/**
 * Compute a softmax-based confidence percentage for the top entity.
 * Uses top-N entities with a temperature parameter so the percentage
 * reflects how dominant the leader is relative to its competitors.
 */
export function computeConfidencePercent(
  scoreboard: ScoreEntry[],
  topN = 10,
  temperature = 25
): number {
  const top = scoreboard.slice(0, topN);
  if (top.length === 0) return 0;
  const maxScore = top[0].score;
  const expScores = top.map((s) => Math.exp((s.score - maxScore) / temperature));
  const sumExp = expScores.reduce((a, b) => a + b, 0);
  return Math.round((expScores[0] / sumExp) * 100);
}

/**
 * Compute per-entity confidence percentages for the top guesses.
 */
export function computeGuessConfidences(
  scoreboard: ScoreEntry[],
  numGuesses = 3,
  topN = 10,
  temperature = 25
): number[] {
  const top = scoreboard.slice(0, topN);
  if (top.length === 0) return [];
  const maxScore = top[0].score;
  const expScores = top.map((s) => Math.exp((s.score - maxScore) / temperature));
  const sumExp = expScores.reduce((a, b) => a + b, 0);
  return top.slice(0, numGuesses).map((_, i) => Math.round((expScores[i] / sumExp) * 100));
}

export interface ConfidenceResult {
  shouldGuess: boolean;
  reason: string;
  topGuesses: GuessEntry[];
}

export function evaluateConfidence(
  scoreboard: ScoreEntry[],
  cfg: EngineConfig
): ConfidenceResult {
  const top = scoreboard.slice(0, 3).map((s) => ({
    entityId: s.id,
    entityName: s.name,
    score: s.score,
  }));

  if (top.length === 0) {
    return { shouldGuess: false, reason: "no_candidates", topGuesses: [] };
  }

  // Always allow a guess after max questions.
  const questionCount = scoreboard.length; // not used directly; caller passes
  void questionCount;

  return {
    shouldGuess: false, // decided by caller using history length
    reason: "defer",
    topGuesses: top,
  };
}

export function shouldGuess(
  scoreboard: ScoreEntry[],
  questionsAsked: number,
  cfg: EngineConfig,
  alreadyGuessedIds: string[]
): { guess: boolean; reason: string } {
  const available = scoreboard.filter(
    (s) => !alreadyGuessedIds.includes(s.id)
  );
  if (available.length === 0) return { guess: false, reason: "exhausted" };

  // Force a guess once we hit max questions.
  if (questionsAsked >= cfg.maxQuestions) {
    return { guess: true, reason: "max_questions" };
  }

  // Need a minimum number of questions before guessing.
  if (questionsAsked < cfg.minQuestions) {
    return { guess: false, reason: "min_questions" };
  }

  const [first, second] = available;
  const topScore = first.score;
  const secondScore = second ? second.score : 0;

  const confidenceMet = topScore >= cfg.initialScore * cfg.confidenceThreshold;
  const gapMet = topScore - secondScore >= cfg.scoreGapThreshold;

  if (confidenceMet && gapMet) {
    return { guess: true, reason: "confident" };
  }

  // Mid-confidence: enough questions asked AND a clear leader, allow guess.
  if (questionsAsked >= cfg.minQuestions + 4 && gapMet && topScore > cfg.initialScore) {
    return { guess: true, reason: "leader" };
  }

  return { guess: false, reason: "not_ready" };
}
