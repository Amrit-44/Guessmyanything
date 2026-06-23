import { db } from "@workspace/db";
import { eq, inArray, notInArray, and } from "drizzle-orm";
import {
  entities,
  entityTags,
  tags,
  questions,
  settings,
} from "@workspace/db";

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
  confidenceThreshold: number;
  scoreGapThreshold: number;
  candidatePoolSize: number;
  maxGuesses: number;
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

export async function loadConfig(): Promise<EngineConfig> {
  try {
    const rows = await db.select().from(settings).where(eq(settings.group, "game"));
    const map = new Map(rows.map((s) => [s.key, s.value]));
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

export function answerWeight(answer: Answer, cfg: EngineConfig): number {
  switch (answer) {
    case "yes": return cfg.weightYes;
    case "probably": return cfg.weightProbably;
    case "dont_know": return cfg.weightDontKnow;
    case "probably_not": return cfg.weightProbablyNot;
    case "no": return -cfg.weightNo;
    default: return 0;
  }
}

export function parseScoreboard(json: string): ScoreEntry[] {
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

export function parseHistory(json: string): HistoryEntry[] {
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

export async function buildInitialScoreboard(
  cfg: EngineConfig,
  categoryFilter: string | null
): Promise<ScoreEntry[]> {
  const { categories } = await import("@workspace/db");
  let rows;
  if (categoryFilter) {
    const cats = await db.select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, categoryFilter));
    if (cats.length === 0) return [];
    const catId = cats[0].id;
    rows = await db.select({
      id: entities.id, name: entities.name, categoryId: entities.categoryId, popularity: entities.popularity,
    }).from(entities).where(and(eq(entities.isActive, true), eq(entities.categoryId, catId)));
  } else {
    rows = await db.select({
      id: entities.id, name: entities.name, categoryId: entities.categoryId, popularity: entities.popularity,
    }).from(entities).where(eq(entities.isActive, true));
  }
  rows.sort((a, b) => b.popularity - a.popularity);
  return rows.map((e) => ({
    id: e.id, name: e.name, categoryId: e.categoryId,
    score: cfg.initialScore + (e.popularity - 50) * 0.1,
    popularity: e.popularity,
  }));
}

export async function applySingleAnswer(
  scoreboard: ScoreEntry[],
  entry: HistoryEntry,
  cfg: EngineConfig
): Promise<ScoreEntry[]> {
  const weight = answerWeight(entry.answer, cfg);
  if (weight === 0) return scoreboard;

  const tagRows = await db.select({ entityId: entityTags.entityId })
    .from(entityTags)
    .innerJoin(tags, eq(entityTags.tagId, tags.id))
    .where(eq(tags.slug, entry.tagSlug));
  const hasTag = new Set(tagRows.map((r) => r.entityId));

  for (const s of scoreboard) {
    const has = hasTag.has(s.id);
    const effectiveHas = entry.inverted ? !has : has;
    const delta = effectiveHas ? weight : -Math.abs(weight);
    s.score = Math.max(0, s.score + delta);
  }
  scoreboard.sort((a, b) => b.score - a.score || b.popularity - a.popularity);
  return scoreboard;
}

export async function rebuildScoreboard(
  scoreboard: ScoreEntry[],
  history: HistoryEntry[],
  cfg: EngineConfig
): Promise<ScoreEntry[]> {
  for (const s of scoreboard) {
    s.score = cfg.initialScore + (s.popularity - 50) * 0.1;
  }
  for (const entry of history) {
    await applySingleAnswer(scoreboard, entry, cfg);
  }
  return scoreboard;
}

export const JOB_INDUSTRIES = [
  "industry-healthcare", "industry-technology", "industry-education",
  "industry-business", "industry-finance", "industry-construction",
  "industry-transportation", "industry-government", "industry-agriculture",
  "industry-science", "industry-arts", "industry-hospitality",
  "industry-legal", "industry-manufacturing",
] as const;

export interface IndustryDetection {
  industry: string;
  industryLabel: string;
  confidence: number;
}

export async function detectIndustry(scoreboard: ScoreEntry[]): Promise<IndustryDetection | null> {
  const pool = scoreboard.slice(0, 100);
  const poolIds = pool.map((s) => s.id);
  if (poolIds.length === 0) return null;

  const tagRows = await db.select({ entityId: entityTags.entityId, slug: tags.slug })
    .from(entityTags)
    .innerJoin(tags, eq(entityTags.tagId, tags.id))
    .where(and(
      inArray(entityTags.entityId, poolIds),
      inArray(tags.slug, [...JOB_INDUSTRIES])
    ));

  const entityIndustry = new Map<string, string>();
  for (const row of tagRows) entityIndustry.set(row.entityId, row.slug);

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

  let dominant = "", dominantMass = 0;
  for (const [ind, mass] of industryMass) {
    if (mass > dominantMass) { dominantMass = mass; dominant = ind; }
  }
  return { industry: dominant, industryLabel: dominant.replace("industry-", ""), confidence: dominantMass / totalMass };
}

async function getIndustryEntityIds(industryTagSlug: string): Promise<Set<string>> {
  const rows = await db.select({ entityId: entityTags.entityId })
    .from(entityTags)
    .innerJoin(tags, eq(entityTags.tagId, tags.id))
    .where(eq(tags.slug, industryTagSlug));
  return new Set(rows.map((r) => r.entityId));
}

export interface SelectedQuestion {
  questionId: string;
  questionText: string;
  tagId: string;
  tagSlug: string;
  inverted: boolean;
  balance: number;
}

export async function selectNextQuestion(
  scoreboard: ScoreEntry[],
  askedIds: string[],
  cfg: EngineConfig,
  categoryFilter: string | null,
  probedTagSlugs: string[]
): Promise<SelectedQuestion | null> {
  const { categories } = await import("@workspace/db");
  const isCategoryMode = !!categoryFilter && categoryFilter !== "anything";
  const isAnythingMode = !categoryFilter || categoryFilter === "anything";
  const isJobMode = categoryFilter === "jobs";
  const askedCount = askedIds.length;

  let pool = scoreboard.slice(0, cfg.candidatePoolSize);
  const poolIds = pool.map((s) => s.id);

  const poolTagRows = await db.select({ entityId: entityTags.entityId, slug: tags.slug, tagId: tags.id })
    .from(entityTags)
    .innerJoin(tags, eq(entityTags.tagId, tags.id))
    .where(inArray(entityTags.entityId, poolIds));

  const entityTagMap = new Map<string, Set<string>>();
  for (const row of poolTagRows) {
    let set = entityTagMap.get(row.entityId);
    if (!set) { set = new Set(); entityTagMap.set(row.entityId, set); }
    set.add(row.slug);
  }

  let industryLock: IndustryDetection | null = null;
  if (isJobMode) {
    industryLock = await detectIndustry(scoreboard);
    if (industryLock && industryLock.confidence > 0.65) {
      const indEntityIds = await getIndustryEntityIds(industryLock.industry);
      const filtered = pool.filter((s) => indEntityIds.has(s.id));
      if (filtered.length >= 5) pool = filtered;
    }
  }

  const probedSet = new Set(probedTagSlugs);

  let qRows;
  if (isCategoryMode) {
    const cats = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, categoryFilter!));
    if (cats.length === 0) return null;
    const catId = cats[0].id;
    qRows = await db.select({
      id: questions.id, text: questions.text, inverted: questions.inverted,
      tagId: questions.primaryTagId, timesAsked: questions.timesAsked,
      successCount: questions.successCount, failCount: questions.failCount,
      avgInfoGain: questions.avgInfoGain,
    }).from(questions)
      .innerJoin(tags, eq(questions.primaryTagId, tags.id))
      .where(and(
        eq(questions.isActive, true),
        askedIds.length > 0 ? notInArray(questions.id, askedIds) : undefined,
        eq(questions.categoryId, catId)
      ));
  } else {
    qRows = await db.select({
      id: questions.id, text: questions.text, inverted: questions.inverted,
      tagId: questions.primaryTagId, timesAsked: questions.timesAsked,
      successCount: questions.successCount, failCount: questions.failCount,
      avgInfoGain: questions.avgInfoGain,
    }).from(questions)
      .innerJoin(tags, eq(questions.primaryTagId, tags.id))
      .where(and(
        eq(questions.isActive, true),
        askedIds.length > 0 ? notInArray(questions.id, askedIds) : undefined,
      ));
  }

  const questionTagSlugs = await db.select({ questionId: questions.id, slug: tags.slug })
    .from(questions)
    .innerJoin(tags, eq(questions.primaryTagId, tags.id))
    .where(inArray(questions.id, qRows.map((q) => q.id)));

  const qSlugMap = new Map(questionTagSlugs.map((r) => [r.questionId, r.slug]));

  if (qRows.length === 0) return null;

  const BROAD_TAGS = new Set(["real_person","fictional_character","profession","animal","place","movie","tv_show","video_game","brand","object","sport","historical_figure","celebrity"]);
  const INDUSTRY_TAG_SET = new Set<string>([...JOB_INDUSTRIES]);

  const broadBoost = isAnythingMode ? Math.max(0, 0.35 - askedCount * 0.09) : 0;
  const industryBoost = isJobMode ? Math.max(0, 0.4 - askedCount * 0.08) : 0;

  let best: { questionId: string; questionText: string; tagId: string; tagSlug: string; inverted: boolean; score: number; balance: number } | null = null;

  for (const q of qRows) {
    const slug = qSlugMap.get(q.id) ?? "";
    if (probedSet.has(slug)) continue;

    let massWith = 0, massWithout = 0;
    for (const s of pool) {
      const tSet = entityTagMap.get(s.id);
      const has = tSet ? tSet.has(slug) : false;
      const effectiveHas = q.inverted ? !has : has;
      if (effectiveHas) massWith += Math.max(s.score, 1);
      else massWithout += Math.max(s.score, 1);
    }
    if (massWith === 0 || massWithout === 0) continue;

    const balance = 1 - Math.abs(massWith - massWithout) / (massWith + massWithout);
    const totalQ = q.timesAsked ?? 0;
    const winRate = totalQ > 0 ? q.successCount / totalQ : 0.5;
    const infoGain = q.avgInfoGain ?? 0;
    const eff = totalQ > 0 ? 0.25 + 0.35 * winRate + 0.4 * infoGain : 0.55;
    const broad = isAnythingMode && BROAD_TAGS.has(slug) ? broadBoost : 0;
    const indBoost = isJobMode && INDUSTRY_TAG_SET.has(slug) ? industryBoost : 0;
    const score = balance * 0.7 + eff * 0.2 + broad + indBoost;

    if (!best || score > best.score) {
      best = { questionId: q.id, questionText: q.text, tagId: q.tagId, tagSlug: slug, inverted: q.inverted, score, balance };
    }
  }

  if (!best) {
    for (const q of qRows) {
      const slug = qSlugMap.get(q.id) ?? "";
      let massWith = 0, massWithout = 0;
      for (const s of pool) {
        const tSet = entityTagMap.get(s.id);
        const has = tSet ? tSet.has(slug) : false;
        const effectiveHas = q.inverted ? !has : has;
        if (effectiveHas) massWith += Math.max(s.score, 1);
        else massWithout += Math.max(s.score, 1);
      }
      if (massWith === 0 || massWithout === 0) continue;
      const balance = 1 - Math.abs(massWith - massWithout) / (massWith + massWithout);
      best = { questionId: q.id, questionText: q.text, tagId: q.tagId, tagSlug: slug, inverted: q.inverted, score: balance, balance };
      break;
    }
  }

  if (!best) return null;
  return { questionId: best.questionId, questionText: best.questionText, tagId: best.tagId, tagSlug: best.tagSlug, inverted: best.inverted, balance: best.balance };
}

export function computeConfidencePercent(scoreboard: ScoreEntry[], topN = 10, temperature = 25): number {
  const top = scoreboard.slice(0, topN);
  if (top.length === 0) return 0;
  const maxScore = top[0].score;
  const expScores = top.map((s) => Math.exp((s.score - maxScore) / temperature));
  const sumExp = expScores.reduce((a, b) => a + b, 0);
  return Math.round((expScores[0] / sumExp) * 100);
}

export function computeGuessConfidences(scoreboard: ScoreEntry[], numGuesses = 3, topN = 10, temperature = 25): number[] {
  const top = scoreboard.slice(0, topN);
  if (top.length === 0) return [];
  const maxScore = top[0].score;
  const expScores = top.map((s) => Math.exp((s.score - maxScore) / temperature));
  const sumExp = expScores.reduce((a, b) => a + b, 0);
  return top.slice(0, numGuesses).map((_, i) => Math.round((expScores[i] / sumExp) * 100));
}

export function shouldGuess(
  scoreboard: ScoreEntry[],
  questionsAsked: number,
  cfg: EngineConfig,
  alreadyGuessedIds: string[]
): { guess: boolean; reason: string } {
  const available = scoreboard.filter((s) => !alreadyGuessedIds.includes(s.id));
  if (available.length === 0) return { guess: false, reason: "exhausted" };
  if (questionsAsked >= cfg.maxQuestions) return { guess: true, reason: "max_questions" };
  if (questionsAsked < cfg.minQuestions) return { guess: false, reason: "min_questions" };
  const [first, second] = available;
  const topScore = first.score;
  const secondScore = second ? second.score : 0;
  const confidenceMet = topScore >= cfg.initialScore * cfg.confidenceThreshold;
  const gapMet = topScore - secondScore >= cfg.scoreGapThreshold;
  if (confidenceMet && gapMet) return { guess: true, reason: "confident" };
  if (questionsAsked >= cfg.minQuestions + 4 && gapMet && topScore > cfg.initialScore) return { guess: true, reason: "leader" };
  return { guess: false, reason: "not_ready" };
}
