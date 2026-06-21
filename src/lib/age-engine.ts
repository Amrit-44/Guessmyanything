/**
 * GUESS MY AGE — Intelligent Life-Stage Estimation Engine
 * Asks life-stage questions instead of binary search.
 */

import { db } from "@/lib/db";

export type AgeAnswer = "yes" | "probably" | "dont_know" | "probably_not" | "no";

export interface AgeHistoryEntry {
  questionId: string;
  questionText: string;
  tag: string;
  category: string;
  yesMin: number;
  yesMax: number;
  noMin: number;
  noMax: number;
  answer: AgeAnswer;
}

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

// FLAW 2 FIX: Tier-based question priority.
// Tier 1 (cultural/technology) asked first, Tier 4 (numeric) last resort.
// Each question has a `tier` field (1-4). The selection engine prefers
// lower-tier questions unless the range is already very narrow.

const DEFAULT_AGE_QUESTIONS: { text: string; tag: string; category: string; tier: number; yesMin: number; yesMax: number; noMin: number; noMax: number }[] = [
  // === TIER 1: Cultural / Technology Markers (ask first) ===
  { text: "Did you grow up playing the original Nintendo or Atari?", tag: "retro_gaming", category: "technology", tier: 1, yesMin: 30, yesMax: 55, noMin: 0, noMax: 40 },
  { text: "Do you remember using a rotary phone or VHS tapes?", tag: "retro_tech", category: "technology", tier: 1, yesMin: 35, yesMax: 100, noMin: 0, noMax: 40 },
  { text: "Did you use dial-up internet to go online?", tag: "dialup", category: "technology", tier: 1, yesMin: 28, yesMax: 100, noMin: 0, noMax: 28 },
  { text: "Did you grow up with smartphones from a young age?", tag: "smartphone_native", category: "technology", tier: 1, yesMin: 8, yesMax: 28, noMin: 20, noMax: 100 },
  { text: "Did you grow up with social media as a teenager?", tag: "social_media", category: "technology", tier: 1, yesMin: 12, yesMax: 32, noMin: 0, noMax: 100 },
  { text: "Were you born before the year 2000?", tag: "born_before_2000", category: "technology", tier: 1, yesMin: 25, yesMax: 100, noMin: 0, noMax: 25 },
  { text: "Were you born before the year 1990?", tag: "born_before_1990", category: "technology", tier: 1, yesMin: 35, yesMax: 100, noMin: 0, noMax: 35 },
  { text: "Do you remember where you were on 9/11?", tag: "remembers_911", category: "technology", tier: 1, yesMin: 24, yesMax: 100, noMin: 0, noMax: 24 },
  { text: "Did you watch cartoons on Saturday mornings as a kid?", tag: "saturday_cartoons", category: "technology", tier: 1, yesMin: 25, yesMax: 55, noMin: 0, noMax: 100 },
  { text: "Did you have a MySpace account?", tag: "myspace", category: "technology", tier: 1, yesMin: 25, yesMax: 42, noMin: 0, noMax: 100 },
  { text: "Do you remember when MTV mostly played music videos?", tag: "mtv_music", category: "technology", tier: 1, yesMin: 35, yesMax: 60, noMin: 0, noMax: 35 },

  // === TIER 2: Career & Education Milestones ===
  { text: "Are you currently attending university or college?", tag: "university", category: "education", tier: 2, yesMin: 17, yesMax: 26, noMin: 0, noMax: 100 },
  { text: "Have you been working in your field for more than 10 years?", tag: "experienced_career", category: "work", tier: 2, yesMin: 32, yesMax: 65, noMin: 0, noMax: 35 },
  { text: "Are you a recent graduate (within the last 2 years)?", tag: "recent_grad", category: "education", tier: 2, yesMin: 21, yesMax: 28, noMin: 0, noMax: 100 },
  { text: "Are you currently in school (any level)?", tag: "school", category: "education", tier: 2, yesMin: 5, yesMax: 25, noMin: 0, noMax: 100 },
  { text: "Have you graduated from university?", tag: "graduated", category: "education", tier: 2, yesMin: 22, yesMax: 100, noMin: 0, noMax: 25 },
  { text: "Do you have a full-time job?", tag: "career", category: "work", tier: 2, yesMin: 20, yesMax: 70, noMin: 0, noMax: 100 },
  { text: "Have you started your career?", tag: "started_career", category: "work", tier: 2, yesMin: 21, yesMax: 70, noMin: 0, noMax: 24 },
  { text: "Are you retired?", tag: "retired", category: "work", tier: 2, yesMin: 60, yesMax: 100, noMin: 0, noMax: 65 },
  { text: "Are you old enough to have finished high school?", tag: "highschool", category: "education", tier: 2, yesMin: 18, yesMax: 100, noMin: 0, noMax: 17 },

  // === TIER 3: Financial Independence & Life Events ===
  { text: "Are you fully financially independent from your parents?", tag: "finances", category: "life_event", tier: 3, yesMin: 20, yesMax: 100, noMin: 0, noMax: 24 },
  { text: "Do you currently rent your primary residence?", tag: "renting", category: "life_event", tier: 3, yesMin: 20, yesMax: 40, noMin: 0, noMax: 100 },
  { text: "Do you have a mortgage?", tag: "mortgage", category: "life_event", tier: 3, yesMin: 28, yesMax: 65, noMin: 0, noMax: 100 },
  { text: "Are you still dependent on your parents?", tag: "dependent", category: "life_event", tier: 3, yesMin: 0, yesMax: 22, noMin: 18, noMax: 100 },
  { text: "Have you moved out of your parents' house?", tag: "moved_out", category: "life_event", tier: 3, yesMin: 18, yesMax: 100, noMin: 0, noMax: 25 },
  { text: "Are you married?", tag: "married", category: "life_event", tier: 3, yesMin: 22, yesMax: 80, noMin: 0, noMax: 100 },
  { text: "Do you have children?", tag: "parent", category: "life_event", tier: 3, yesMin: 25, yesMax: 55, noMin: 0, noMax: 100 },
  { text: "Can you legally drive a car?", tag: "driving", category: "milestone", tier: 3, yesMin: 16, yesMax: 100, noMin: 0, noMax: 16 },
  { text: "Can you legally vote?", tag: "voting", category: "milestone", tier: 3, yesMin: 18, yesMax: 100, noMin: 0, noMax: 18 },
  { text: "Can you legally drink alcohol?", tag: "drinking", category: "milestone", tier: 3, yesMin: 18, yesMax: 100, noMin: 0, noMax: 18 },
  { text: "Are you interested in retirement planning?", tag: "retirement_planning", category: "interest", tier: 3, yesMin: 40, yesMax: 100, noMin: 0, noMax: 45 },

  // === TIER 4: Direct Numeric (LAST RESORT only) ===
  { text: "Based on my guesses so far, are you closer to your 20s than your 40s?", tag: "closer_20s", category: "numeric", tier: 4, yesMin: 18, yesMax: 32, noMin: 30, noMax: 100 },
  { text: "Would you say you're closer to 30 than to 50?", tag: "closer_30", category: "numeric", tier: 4, yesMin: 25, yesMax: 40, noMin: 38, noMax: 100 },
  { text: "Are you in the first half of your life (under 40)?", tag: "under_40", category: "numeric", tier: 4, yesMin: 0, yesMax: 39, noMin: 40, noMax: 100 },
  { text: "Are you closer to 50 than to 70?", tag: "closer_50", category: "numeric", tier: 4, yesMin: 40, yesMax: 60, noMin: 58, noMax: 100 },
  { text: "Are you closer to your 60s than your 40s?", tag: "closer_60", category: "numeric", tier: 4, yesMin: 55, yesMax: 70, noMin: 0, noMax: 58 },
];

export async function ensureAgeQuestions(): Promise<void> {
  const count = await db.ageQuestion.count();
  if (count > 0) return;
  for (const q of DEFAULT_AGE_QUESTIONS) {
    // Encode tier in the category field as "tierN_category" to avoid schema changes.
    // The selectAgeQuestion function decodes this to apply tier priority.
    const tierCategory = `tier${q.tier}_${q.category}`;
    await db.ageQuestion.create({
      data: { text: q.text, tag: q.tag, category: tierCategory, yesMin: q.yesMin, yesMax: q.yesMax, noMin: q.noMin, noMax: q.noMax, isActive: true },
    });
  }
}

function parseHistory(json: string): AgeHistoryEntry[] {
  try { const arr = JSON.parse(json); return Array.isArray(arr) ? arr : []; } catch { return []; }
}
function parseAskedIds(json: string): string[] {
  try { const arr = JSON.parse(json); return Array.isArray(arr) ? arr : []; } catch { return []; }
}

export function applyAgeAnswer(minAge: number, maxAge: number, entry: AgeHistoryEntry): { min: number; max: number; infoGain: number } {
  let min = minAge, max = maxAge;
  const prevRange = max - min + 1;
  let rangeMin: number, rangeMax: number;
  switch (entry.answer) {
    case "yes": rangeMin = entry.yesMin; rangeMax = entry.yesMax; break;
    case "probably": rangeMin = Math.max(0, entry.yesMin - 3); rangeMax = Math.min(120, entry.yesMax + 3); break;
    case "dont_know": return { min, max, infoGain: 0 };
    case "probably_not": rangeMin = Math.max(0, entry.noMin - 3); rangeMax = Math.min(120, entry.noMax + 3); break;
    case "no": rangeMin = entry.noMin; rangeMax = entry.noMax; break;
    default: return { min, max, infoGain: 0 };
  }
  min = Math.max(min, rangeMin);
  max = Math.min(max, rangeMax);
  min = Math.max(0, Math.min(min, 120));
  max = Math.max(0, Math.min(max, 120));
  if (min > max) { const mid = Math.round((min + max) / 2); min = mid; max = mid; }
  const newRange = max - min + 1;
  const infoGain = prevRange > 0 ? Math.max(0, 1 - newRange / prevRange) : 0;
  return { min, max, infoGain };
}

export async function selectAgeQuestion(minAge: number, maxAge: number, askedIds: string[], history: AgeHistoryEntry[]) {
  await ensureAgeQuestions();
  const questions = await db.ageQuestion.findMany({ where: { isActive: true, id: { notIn: askedIds } } });
  if (questions.length === 0) return null;

  // FLAW 2 FIX: Decode tier from category field ("tierN_category" → tier N)
  // and apply strict tier priority. Tier 1 questions are always preferred
  // over Tier 4, unless the range is very narrow (< 8 years) and all
  // higher-tier questions have been exhausted.
  const currentRange = maxAge - minAge + 1;
  const askedCount = askedIds.length;

  // Determine the highest priority tier available.
  // If the range is still wide (> 8), never use tier 4.
  // If the range is narrow but we haven't asked many questions, still prefer 1-3.
  const maxAllowedTier = currentRange <= 8 && askedCount >= 10 ? 4 : 3;

  // Filter questions by allowed tier
  const tieredQuestions = questions.filter(q => {
    const tierMatch = q.category.match(/^tier(\d)_/);
    const tier = tierMatch ? parseInt(tierMatch[1]) : 4;
    return tier <= maxAllowedTier;
  });

  // If all tier-restricted questions are exhausted, fall back to ALL questions
  // (safe fallback so the game never freezes)
  const pool = tieredQuestions.length > 0 ? tieredQuestions : questions;

  const lastCategory = history.length > 0 ? history[history.length - 1].category : null;
  let best: any = null;
  for (const q of pool) {
    const yesOverlap = Math.max(0, Math.min(q.yesMax, maxAge) - Math.max(q.yesMin, minAge) + 1);
    const noOverlap = Math.max(0, Math.min(q.noMax, maxAge) - Math.max(q.noMin, minAge) + 1);
    const totalOverlap = yesOverlap + noOverlap;
    if (totalOverlap === 0) continue;
    const balance = totalOverlap > 0 ? 1 - Math.abs(yesOverlap - noOverlap) / totalOverlap : 0;
    const coverage = totalOverlap / (2 * (maxAge - minAge + 1));
    const infoGain = balance * coverage;
    const diversityPenalty = q.category === lastCategory ? 0.15 : 0;
    const eff = q.timesAsked > 0 ? 0.4 + 0.6 * (q.successCount / q.timesAsked) : 0.6;

    // FLAW 2 FIX: Tier bonus — lower tier (more contextual) gets a boost
    const tierMatch = q.category.match(/^tier(\d)_/);
    const tier = tierMatch ? parseInt(tierMatch[1]) : 4;
    const tierBonus = (4 - tier) * 0.1; // Tier 1: +0.3, Tier 2: +0.2, Tier 3: +0.1, Tier 4: 0

    const score = infoGain * 0.5 + eff * 0.15 + coverage * 0.15 + tierBonus - diversityPenalty;
    if (!best || score > best.score) {
      // Decode the display category (strip "tierN_" prefix)
      const displayCategory = q.category.replace(/^tier\d+_/, "");
      best = { questionId: q.id, text: q.text, tag: q.tag, category: displayCategory, yesMin: q.yesMin, yesMax: q.yesMax, noMin: q.noMin, noMax: q.noMax, infoGain, score };
    }
  }

  // FLAW 2 FIX: Safe fallback — if no question passed the filters,
  // pick any question with the best info gain from the full pool
  if (!best) {
    for (const q of questions) {
      const yesOverlap = Math.max(0, Math.min(q.yesMax, maxAge) - Math.max(q.yesMin, minAge) + 1);
      const noOverlap = Math.max(0, Math.min(q.noMax, maxAge) - Math.max(q.noMin, minAge) + 1);
      const totalOverlap = yesOverlap + noOverlap;
      if (totalOverlap === 0) continue;
      const balance = totalOverlap > 0 ? 1 - Math.abs(yesOverlap - noOverlap) / totalOverlap : 0;
      const displayCategory = q.category.replace(/^tier\d+_/, "");
      best = { questionId: q.id, text: q.text, tag: q.tag, category: displayCategory, yesMin: q.yesMin, yesMax: q.yesMax, noMin: q.noMin, noMax: q.noMax, infoGain: balance, score: balance };
      break;
    }
  }

  return best;
}

export function computeAgeConfidence(min: number, max: number): number {
  const range = max - min + 1;
  if (range <= 1) return 98;
  if (range <= 2) return 95;
  if (range <= 3) return 91;
  if (range <= 5) return 85;
  if (range <= 8) return 75;
  if (range <= 12) return 60;
  if (range <= 20) return 40;
  if (range <= 30) return 25;
  return 15;
}

export function shouldAgeGuess(min: number, max: number, questionCount: number, minQ = 5, maxQ = 18) {
  if (questionCount >= maxQ) return { guess: true, reason: "max_questions" };
  if (min === max) return { guess: true, reason: "exact" };
  if (max - min <= 2 && questionCount >= minQ) return { guess: true, reason: "narrow" };
  if (max - min <= 4 && questionCount >= minQ + 3) return { guess: true, reason: "narrow_enough" };
  return { guess: false, reason: "not_ready" };
}
