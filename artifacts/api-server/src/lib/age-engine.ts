import { db } from "@workspace/db";
import { ageQuestions } from "@workspace/db";
import { eq, notInArray } from "drizzle-orm";

export type AgeAnswer = "yes" | "probably" | "dont_know" | "probably_not" | "no";

export interface AgeHistoryEntry {
  questionId: string; questionText: string; tag: string; category: string;
  yesMin: number; yesMax: number; noMin: number; noMax: number; answer: AgeAnswer;
}

export interface AgeSnapshot {
  sessionId: string; status: "playing" | "guessing" | "won" | "lost";
  question: { questionId: string; text: string; questionNumber: number; category: string } | null;
  range: { min: number; max: number }; estimatedAge: number; questionCount: number;
  history: { questionText: string; answer: AgeAnswer; tag: string }[];
  confidence: number;
  guess: { age: number; min: number; max: number; confidence: number } | null;
}

const DEFAULT_AGE_QUESTIONS = [
  { text: "Did you grow up playing the original Nintendo or Atari?", tag: "retro_gaming", category: "tier1_technology", yesMin: 30, yesMax: 55, noMin: 0, noMax: 40 },
  { text: "Do you remember using a rotary phone or VHS tapes?", tag: "retro_tech", category: "tier1_technology", yesMin: 35, yesMax: 100, noMin: 0, noMax: 40 },
  { text: "Did you use dial-up internet to go online?", tag: "dialup", category: "tier1_technology", yesMin: 28, yesMax: 100, noMin: 0, noMax: 28 },
  { text: "Did you grow up with smartphones from a young age?", tag: "smartphone_native", category: "tier1_technology", yesMin: 8, yesMax: 28, noMin: 20, noMax: 100 },
  { text: "Did you grow up with social media as a teenager?", tag: "social_media", category: "tier1_technology", yesMin: 12, yesMax: 32, noMin: 0, noMax: 100 },
  { text: "Were you born before the year 2000?", tag: "born_before_2000", category: "tier1_technology", yesMin: 25, yesMax: 100, noMin: 0, noMax: 25 },
  { text: "Do you remember where you were on 9/11?", tag: "remembers_911", category: "tier1_technology", yesMin: 24, yesMax: 100, noMin: 0, noMax: 24 },
  { text: "Did you have a MySpace account?", tag: "myspace", category: "tier1_technology", yesMin: 25, yesMax: 42, noMin: 0, noMax: 100 },
  { text: "Are you currently attending university or college?", tag: "university", category: "tier2_education", yesMin: 17, yesMax: 26, noMin: 0, noMax: 100 },
  { text: "Have you been working in your field for more than 10 years?", tag: "experienced_career", category: "tier2_work", yesMin: 32, yesMax: 65, noMin: 0, noMax: 35 },
  { text: "Are you a recent graduate (within the last 2 years)?", tag: "recent_grad", category: "tier2_education", yesMin: 21, yesMax: 28, noMin: 0, noMax: 100 },
  { text: "Are you currently in school (any level)?", tag: "school", category: "tier2_education", yesMin: 5, yesMax: 25, noMin: 0, noMax: 100 },
  { text: "Have you graduated from university?", tag: "graduated", category: "tier2_education", yesMin: 22, yesMax: 100, noMin: 0, noMax: 25 },
  { text: "Do you have a full-time job?", tag: "career", category: "tier2_work", yesMin: 20, yesMax: 70, noMin: 0, noMax: 100 },
  { text: "Are you retired?", tag: "retired", category: "tier2_work", yesMin: 60, yesMax: 100, noMin: 0, noMax: 65 },
  { text: "Are you fully financially independent from your parents?", tag: "finances", category: "tier3_life_event", yesMin: 20, yesMax: 100, noMin: 0, noMax: 24 },
  { text: "Do you currently rent your primary residence?", tag: "renting", category: "tier3_life_event", yesMin: 20, yesMax: 40, noMin: 0, noMax: 100 },
  { text: "Do you have a mortgage?", tag: "mortgage", category: "tier3_life_event", yesMin: 28, yesMax: 65, noMin: 0, noMax: 100 },
  { text: "Are you still dependent on your parents?", tag: "dependent", category: "tier3_life_event", yesMin: 0, yesMax: 22, noMin: 18, noMax: 100 },
  { text: "Have you moved out of your parents' house?", tag: "moved_out", category: "tier3_life_event", yesMin: 18, yesMax: 100, noMin: 0, noMax: 25 },
  { text: "Are you married?", tag: "married", category: "tier3_life_event", yesMin: 22, yesMax: 80, noMin: 0, noMax: 100 },
  { text: "Do you have children?", tag: "parent", category: "tier3_life_event", yesMin: 25, yesMax: 55, noMin: 0, noMax: 100 },
  { text: "Can you legally drive a car?", tag: "driving", category: "tier3_milestone", yesMin: 16, yesMax: 100, noMin: 0, noMax: 16 },
  { text: "Can you legally vote?", tag: "voting", category: "tier3_milestone", yesMin: 18, yesMax: 100, noMin: 0, noMax: 18 },
  { text: "Can you legally drink alcohol?", tag: "drinking", category: "tier3_milestone", yesMin: 18, yesMax: 100, noMin: 0, noMax: 18 },
  { text: "Based on my guesses so far, are you closer to your 20s than your 40s?", tag: "closer_20s", category: "tier4_numeric", yesMin: 18, yesMax: 32, noMin: 30, noMax: 100 },
  { text: "Would you say you're closer to 30 than to 50?", tag: "closer_30", category: "tier4_numeric", yesMin: 25, yesMax: 40, noMin: 38, noMax: 100 },
  { text: "Are you in the first half of your life (under 40)?", tag: "under_40", category: "tier4_numeric", yesMin: 0, yesMax: 39, noMin: 40, noMax: 100 },
  { text: "Are you closer to 50 than to 70?", tag: "closer_50", category: "tier4_numeric", yesMin: 40, yesMax: 60, noMin: 58, noMax: 100 },
  { text: "Are you closer to your 60s than your 40s?", tag: "closer_60", category: "tier4_numeric", yesMin: 55, yesMax: 70, noMin: 0, noMax: 58 },
];

export async function ensureAgeQuestions(): Promise<void> {
  const rows = await db.select({ id: ageQuestions.id }).from(ageQuestions).limit(1);
  if (rows.length > 0) return;
  for (const q of DEFAULT_AGE_QUESTIONS) {
    await db.insert(ageQuestions).values({ text: q.text, tag: q.tag, category: q.category, yesMin: q.yesMin, yesMax: q.yesMax, noMin: q.noMin, noMax: q.noMax, isActive: true });
  }
}

export function applyAgeAnswer(minAge: number, maxAge: number, entry: AgeHistoryEntry): { min: number; max: number; infoGain: number } {
  let min = minAge, max = maxAge;
  const prevRange = max - min + 1;
  let rMin: number, rMax: number;
  switch (entry.answer) {
    case "yes": rMin = entry.yesMin; rMax = entry.yesMax; break;
    case "probably": rMin = Math.max(0, entry.yesMin - 3); rMax = Math.min(120, entry.yesMax + 3); break;
    case "dont_know": return { min, max, infoGain: 0 };
    case "probably_not": rMin = Math.max(0, entry.noMin - 3); rMax = Math.min(120, entry.noMax + 3); break;
    case "no": rMin = entry.noMin; rMax = entry.noMax; break;
    default: return { min, max, infoGain: 0 };
  }
  min = Math.max(min, rMin); max = Math.min(max, rMax);
  min = Math.max(0, Math.min(min, 120)); max = Math.max(0, Math.min(max, 120));
  if (min > max) { const m = Math.round((min + max) / 2); min = m; max = m; }
  const newRange = max - min + 1;
  return { min, max, infoGain: prevRange > 0 ? Math.max(0, 1 - newRange / prevRange) : 0 };
}

export async function selectAgeQuestion(minAge: number, maxAge: number, askedIds: string[], history: AgeHistoryEntry[]) {
  await ensureAgeQuestions();
  const rows = askedIds.length > 0
    ? await db.select().from(ageQuestions).where(notInArray(ageQuestions.id, askedIds))
    : await db.select().from(ageQuestions).where(eq(ageQuestions.isActive, true));

  if (rows.length === 0) return null;
  const currentRange = maxAge - minAge + 1, askedCount = askedIds.length;
  const maxAllowedTier = currentRange <= 8 && askedCount >= 10 ? 4 : 3;
  const tieredQs = rows.filter(q => {
    const m = q.category.match(/^tier(\d)_/);
    const t = m ? parseInt(m[1]) : 4;
    return t <= maxAllowedTier;
  });
  const pool = tieredQs.length > 0 ? tieredQs : rows;
  const lastCat = history.length > 0 ? history[history.length - 1].category : null;
  let best: any = null;
  for (const q of pool) {
    const yesOv = Math.max(0, Math.min(q.yesMax, maxAge) - Math.max(q.yesMin, minAge) + 1);
    const noOv = Math.max(0, Math.min(q.noMax, maxAge) - Math.max(q.noMin, minAge) + 1);
    const tot = yesOv + noOv; if (tot === 0) continue;
    const balance = 1 - Math.abs(yesOv - noOv) / tot;
    const coverage = tot / (2 * (maxAge - minAge + 1));
    const infoGain = balance * coverage;
    const divPen = q.category === lastCat ? 0.15 : 0;
    const eff = q.timesAsked > 0 ? 0.4 + 0.6 * (q.successCount / q.timesAsked) : 0.6;
    const m = q.category.match(/^tier(\d)_/); const tier = m ? parseInt(m[1]) : 4;
    const tierBonus = (4 - tier) * 0.1;
    const score = infoGain * 0.5 + eff * 0.15 + coverage * 0.15 + tierBonus - divPen;
    if (!best || score > best.score) {
      best = { questionId: q.id, text: q.text, tag: q.tag, category: q.category.replace(/^tier\d+_/, ""), yesMin: q.yesMin, yesMax: q.yesMax, noMin: q.noMin, noMax: q.noMax, infoGain, score };
    }
  }
  if (!best) {
    for (const q of rows) {
      const yesOv = Math.max(0, Math.min(q.yesMax, maxAge) - Math.max(q.yesMin, minAge) + 1);
      const noOv = Math.max(0, Math.min(q.noMax, maxAge) - Math.max(q.noMin, minAge) + 1);
      if (yesOv + noOv === 0) continue;
      best = { questionId: q.id, text: q.text, tag: q.tag, category: q.category.replace(/^tier\d+_/, ""), yesMin: q.yesMin, yesMax: q.yesMax, noMin: q.noMin, noMax: q.noMax, infoGain: 0.5, score: 0.5 };
      break;
    }
  }
  return best;
}

export function computeAgeConfidence(min: number, max: number): number {
  const r = max - min + 1;
  if (r <= 1) return 98; if (r <= 2) return 95; if (r <= 3) return 91; if (r <= 5) return 85;
  if (r <= 8) return 75; if (r <= 12) return 60; if (r <= 20) return 40; if (r <= 30) return 25; return 15;
}

export function shouldAgeGuess(min: number, max: number, qCount: number, minQ = 5, maxQ = 18) {
  if (qCount >= maxQ) return { guess: true, reason: "max" };
  if (min === max) return { guess: true, reason: "exact" };
  if (max - min <= 2 && qCount >= minQ) return { guess: true, reason: "narrow" };
  if (max - min <= 4 && qCount >= minQ + 3) return { guess: true, reason: "narrow_enough" };
  return { guess: false, reason: "not_ready" };
}
