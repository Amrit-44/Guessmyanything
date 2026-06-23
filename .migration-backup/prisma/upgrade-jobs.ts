/**
 * GUESS MY JOB — Knowledge Base Upgrade
 *
 * This script ONLY touches job data. It:
 *   1. Adds new industry subcategories (Finance, Construction, Transportation,
 *      Government, Agriculture, Science, Hospitality, Legal, Manufacturing).
 *   2. Adds industry tags (industry-healthcare, etc.) to ALL job entities.
 *   3. Enriches existing jobs with deep fingerprint tags (work environment,
 *      education, income, physical, interaction, schedule, tools, stress).
 *   4. Adds 50+ rare/specialized jobs across all 14 industries.
 *   5. Adds 14 industry-probing questions (job-specific).
 *   6. Adds 40+ discriminating job questions probing rich attributes.
 *
 * Idempotent: safe to run multiple times.
 *
 * Run: bun run prisma/upgrade-jobs.ts
 */

import { db } from "../src/lib/db";

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function ensureTag(name: string): Promise<{ id: string; slug: string }> {
  const slug = slugify(name);
  const existing = await db.tag.findUnique({ where: { slug } });
  if (existing) return { id: existing.id, slug };
  const created = await db.tag.create({ data: { name, slug } });
  return { id: created.id, slug };
}

async function ensureSubcategory(
  categoryId: string,
  name: string,
  slug: string
): Promise<string> {
  const existing = await db.subcategory.findFirst({
    where: { slug, categoryId },
  });
  if (existing) return existing.id;
  const maxOrder = await db.subcategory.aggregate({
    where: { categoryId },
    _max: { sortOrder: true },
  });
  const created = await db.subcategory.create({
    data: {
      name,
      slug,
      categoryId,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });
  return created.id;
}

async function ensureQuestion(
  text: string,
  tagSlug: string,
  categoryId: string
): Promise<void> {
  const existing = await db.question.findFirst({ where: { text } });
  if (existing) return;
  const tag = await ensureTag(tagSlug);
  await db.question.create({
    data: {
      text,
      primaryTagId: tag.id,
      categoryId,
      inverted: false,
    },
  });
}

async function addTagsToEntity(
  entityId: string,
  tagNames: string[]
): Promise<void> {
  for (const name of tagNames) {
    const tag = await ensureTag(name);
    const exists = await db.entityTag.findUnique({
      where: { entityId_tagId: { entityId, tagId: tag.id } },
    });
    if (!exists) {
      await db.entityTag.create({
        data: { entityId, tagId: tag.id, weight: 1 },
      });
    }
  }
}

async function createEntity(
  name: string,
  categoryId: string,
  subcategoryId: string | null,
  description: string,
  tags: string[],
  popularity: number,
  difficulty: number
): Promise<void> {
  const slug = slugify(name);
  const existing = await db.entity.findUnique({
    where: { categoryId_slug: { categoryId, slug } },
  });
  if (existing) {
    // Just add missing tags
    await addTagsToEntity(existing.id, tags);
    return;
  }

  const tagSlugs: string[] = [];
  const tagIds: string[] = [];
  for (const t of tags) {
    const tag = await ensureTag(t);
    tagSlugs.push(tag.slug);
    tagIds.push(tag.id);
  }

  await db.entity.create({
    data: {
      name,
      slug,
      description,
      categoryId,
      subcategoryId,
      difficulty,
      popularity,
      tagCache: tagSlugs.join(","),
      tags: {
        create: tagIds.map((id) => ({ tagId: id, weight: 1 })),
      },
    },
  });
}

// ------------------------------------------------------------
// Industry → subcategory mapping for existing jobs
// Each entry: [jobName, industryTagSlug, newSubcategorySlug]
// ------------------------------------------------------------

const EXISTING_JOB_INDUSTRY: { name: string; industry: string; sub: string }[] = [
  { name: "Doctor", industry: "industry-healthcare", sub: "healthcare" },
  { name: "Nurse", industry: "industry-healthcare", sub: "healthcare" },
  { name: "Surgeon", industry: "industry-healthcare", sub: "healthcare" },
  { name: "Dentist", industry: "industry-healthcare", sub: "healthcare" },
  { name: "Veterinarian", industry: "industry-healthcare", sub: "healthcare" },
  { name: "Software Engineer", industry: "industry-technology", sub: "technology" },
  { name: "Data Scientist", industry: "industry-technology", sub: "technology" },
  { name: "Web Developer", industry: "industry-technology", sub: "technology" },
  { name: "Teacher", industry: "industry-education", sub: "education" },
  { name: "Professor", industry: "industry-education", sub: "education" },
  { name: "Actor", industry: "industry-arts", sub: "arts-media" },
  { name: "Musician", industry: "industry-arts", sub: "arts-media" },
  { name: "Painter", industry: "industry-arts", sub: "arts-media" },
  { name: "Chef", industry: "industry-hospitality", sub: "arts-media" },
  { name: "Writer", industry: "industry-arts", sub: "arts-media" },
  { name: "Electrician", industry: "industry-construction", sub: "trades" },
  { name: "Plumber", industry: "industry-construction", sub: "trades" },
  { name: "Carpenter", industry: "industry-construction", sub: "trades" },
  { name: "Mechanic", industry: "industry-manufacturing", sub: "trades" },
  { name: "Farmer", industry: "industry-agriculture", sub: "trades" },
  { name: "Lawyer", industry: "industry-legal", sub: "business-law" },
  { name: "Accountant", industry: "industry-finance", sub: "business-law" },
  { name: "Pilot", industry: "industry-transportation", sub: "business-law" },
  { name: "Police Officer", industry: "industry-government", sub: "business-law" },
  { name: "Firefighter", industry: "industry-government", sub: "business-law" },
];

// ------------------------------------------------------------
// Rich tag enrichment for existing jobs
// Tags: work-environment, physical, education, income, interaction,
//        schedule, tools, stress, creativity, travel
// ------------------------------------------------------------

const EXISTING_JOB_RICH_TAGS: Record<string, string[]> = {
  Doctor: ["indoor", "hospital", "doctorate", "high-income", "public-facing", "shift-work", "on-call", "life-or-death", "high-stress", "problem-solving", "science", "people-focused", "degree", "uniform", "precise"],
  Nurse: ["indoor", "hospital", "degree", "medium-income", "public-facing", "shift-work", "night-shift", "on-call", "life-or-death", "high-stress", "caregiving", "people-focused", "uniform", "physical"],
  Surgeon: ["indoor", "hospital", "doctorate", "high-income", "public-facing", "on-call", "life-or-death", "high-stress", "precise", "problem-solving", "science", "degree", "manual-dexterity"],
  Dentist: ["indoor", "office", "doctorate", "high-income", "public-facing", "regular-hours", "precise", "manual-dexterity", "science", "degree", "people-focused"],
  Veterinarian: ["indoor", "outdoor", "doctorate", "high-income", "public-facing", "on-call", "animal-care", "science", "degree", "problem-solving", "people-focused"],
  "Software Engineer": ["indoor", "office", "remote", "bachelors", "high-income", "solo-work", "team-work", "regular-hours", "computer", "coding", "analytical", "creative", "no-travel", "degree", "technology", "machine-focused"],
  "Data Scientist": ["indoor", "office", "remote", "masters", "high-income", "solo-work", "regular-hours", "computer", "analytical", "science", "degree", "technology", "machine-focused"],
  "Web Developer": ["indoor", "office", "remote", "bachelors", "high-income", "solo-work", "team-work", "regular-hours", "computer", "coding", "creative", "no-travel", "degree", "technology"],
  Teacher: ["indoor", "school", "bachelors", "medium-income", "public-facing", "regular-hours", "works-with-children", "creative", "people-focused", "degree", "education", "caregiving", "public-speaking"],
  Professor: ["indoor", "school", "doctorate", "high-income", "public-facing", "regular-hours", "analytical", "science", "people-focused", "degree", "education", "public-speaking", "research"],
  Actor: ["indoor", "studio", "outdoor", "variable-income", "public-facing", "irregular-hours", "creative", "arts", "people-focused", "fame-possible", "public-speaking", "no-degree"],
  Musician: ["indoor", "studio", "outdoor", "variable-income", "public-facing", "irregular-hours", "night-shift", "creative", "arts", "fame-possible", "no-degree"],
  Painter: ["indoor", "studio", "variable-income", "solo-work", "irregular-hours", "creative", "arts", "no-degree", "hands-on"],
  Chef: ["indoor", "kitchen", "certificate", "medium-income", "team-work", "shift-work", "night-shift", "high-stress", "creative", "physical", "hands-on", "food", "arts", "dangerous"],
  Writer: ["indoor", "office", "remote", "variable-income", "solo-work", "irregular-hours", "creative", "arts", "no-degree", "computer"],
  Electrician: ["indoor", "outdoor", "certificate", "medium-income", "solo-work", "irregular-hours", "physical", "dangerous", "tools", "license-required", "trades", "construction-site", "manual-dexterity"],
  Plumber: ["indoor", "outdoor", "certificate", "medium-income", "solo-work", "irregular-hours", "physical", "tools", "license-required", "trades", "manual-dexterity"],
  Carpenter: ["indoor", "outdoor", "certificate", "medium-income", "physical", "creative", "tools", "hands-on", "trades", "construction-site", "manual-dexterity"],
  Mechanic: ["indoor", "certificate", "medium-income", "physical", "tools", "machinery", "trades", "manual-dexterity", "vehicles", "dangerous"],
  Farmer: ["outdoor", "no-degree", "variable-income", "physical", "early-riser", "seasonal", "machinery", "animal-care", "trades", "agriculture", "heavy-lifting", "dangerous"],
  Lawyer: ["indoor", "office", "doctorate", "high-income", "public-facing", "client-facing", "regular-hours", "high-stress", "analytical", "problem-solving", "degree", "law", "public-speaking", "license-required"],
  Accountant: ["indoor", "office", "bachelors", "high-income", "client-facing", "regular-hours", "computer", "analytical", "degree", "finance", "license-required", "sedentary"],
  Pilot: ["vehicle", "bachelors", "high-income", "irregular-hours", "night-shift", "high-stress", "life-or-death", "license-required", "machinery", "frequent-travel", "degree", "uniform", "dangerous", "transportation"],
  "Police Officer": ["outdoor", "indoor", "certificate", "medium-income", "public-facing", "shift-work", "night-shift", "dangerous", "life-or-death", "high-stress", "physical", "uniform", "weapons", "law", "license-required"],
  Firefighter: ["outdoor", "certificate", "medium-income", "shift-work", "night-shift", "dangerous", "life-or-death", "high-stress", "physical", "uniform", "team-work", "heavy-lifting", "government"],
};

// ------------------------------------------------------------
// NEW RARE & SPECIALIZED JOBS (Fix #7)
// Each: name, industry, subcategory, description, tags, popularity, difficulty
// ------------------------------------------------------------

interface NewJob {
  name: string;
  industry: string; // industry tag slug
  sub: string; // subcategory slug
  description: string;
  tags: string[];
  popularity: number;
  difficulty: number;
}

const NEW_JOBS: NewJob[] = [
  // --- Healthcare ---
  { name: "Paramedic", industry: "industry-healthcare", sub: "healthcare", description: "An emergency medical responder who treats patients on-site and during transport.", popularity: 72, difficulty: 2, tags: ["profession", "healthcare", "industry-healthcare", "degree", "outdoor", "indoor", "vehicle", "shift-work", "night-shift", "on-call", "life-or-death", "high-stress", "physical", "uniform", "people-focused", "caregiving", "dangerous", "manual-dexterity"] },
  { name: "Pharmacist", industry: "industry-healthcare", sub: "healthcare", description: "A professional who dispenses medications and advises patients.", popularity: 68, difficulty: 2, tags: ["profession", "healthcare", "industry-healthcare", "doctorate", "indoor", "office", "high-income", "public-facing", "regular-hours", "science", "degree", "people-focused", "license-required", "precise", "sedentary"] },
  { name: "Radiologist", industry: "industry-healthcare", sub: "healthcare", description: "A doctor who interprets medical imaging like X-rays and MRIs.", popularity: 55, difficulty: 4, tags: ["profession", "healthcare", "industry-healthcare", "doctorate", "indoor", "hospital", "high-income", "solo-work", "regular-hours", "science", "degree", "computer", "analytical", "machine-focused", "precise", "license-required"] },
  { name: "Physical Therapist", industry: "industry-healthcare", sub: "healthcare", description: "A healthcare professional who helps patients recover mobility.", popularity: 65, difficulty: 2, tags: ["profession", "healthcare", "industry-healthcare", "degree", "indoor", "office", "medium-income", "public-facing", "regular-hours", "physical", "people-focused", "caregiving", "manual-dexterity", "hands-on"] },
  { name: "Optometrist", industry: "industry-healthcare", sub: "healthcare", description: "A doctor who examines eyes and prescribes vision corrections.", popularity: 50, difficulty: 3, tags: ["profession", "healthcare", "industry-healthcare", "doctorate", "indoor", "office", "high-income", "public-facing", "regular-hours", "science", "degree", "people-focused", "license-required", "precise", "instruments"] },
  { name: "Phlebotomist", industry: "industry-healthcare", sub: "healthcare", description: "A technician who draws blood for testing.", popularity: 40, difficulty: 4, tags: ["profession", "healthcare", "industry-healthcare", "certificate", "indoor", "hospital", "low-income", "public-facing", "regular-hours", "people-focused", "instruments", "precise", "manual-dexterity"] },

  // --- Technology ---
  { name: "DevOps Engineer", industry: "industry-technology", sub: "technology", description: "An engineer who automates deployment and infrastructure.", popularity: 62, difficulty: 3, tags: ["profession", "technology", "industry-technology", "bachelors", "indoor", "office", "remote", "high-income", "solo-work", "team-work", "regular-hours", "computer", "coding", "analytical", "degree", "machine-focused"] },
  { name: "Cybersecurity Analyst", industry: "industry-technology", sub: "technology", description: "A professional who protects systems from cyber threats.", popularity: 60, difficulty: 3, tags: ["profession", "technology", "industry-technology", "bachelors", "indoor", "office", "remote", "high-income", "solo-work", "regular-hours", "computer", "analytical", "degree", "on-call", "high-stress", "problem-solving"] },
  { name: "AI Researcher", industry: "industry-technology", sub: "technology", description: "A scientist who develops artificial intelligence algorithms.", popularity: 55, difficulty: 5, tags: ["profession", "technology", "industry-technology", "doctorate", "indoor", "office", "remote", "high-income", "solo-work", "regular-hours", "computer", "analytical", "science", "degree", "research", "creative", "problem-solving"] },
  { name: "Blockchain Developer", industry: "industry-technology", sub: "technology", description: "A developer who builds decentralized applications.", popularity: 48, difficulty: 4, tags: ["profession", "technology", "industry-technology", "bachelors", "indoor", "office", "remote", "high-income", "solo-work", "irregular-hours", "computer", "coding", "analytical", "degree", "creative"] },

  // --- Education ---
  { name: "Librarian", industry: "industry-education", sub: "education", description: "A professional who manages library collections and helps patrons.", popularity: 55, difficulty: 3, tags: ["profession", "education", "industry-education", "masters", "indoor", "school", "medium-income", "public-facing", "regular-hours", "solo-work", "analytical", "degree", "people-focused", "sedentary", "computer"] },
  { name: "School Counselor", industry: "industry-education", sub: "education", description: "A professional who guides students' academic and emotional wellbeing.", popularity: 50, difficulty: 3, tags: ["profession", "education", "industry-education", "masters", "indoor", "school", "medium-income", "public-facing", "regular-hours", "people-focused", "degree", "caregiving", "works-with-children", "problem-solving"] },
  { name: "Tutor", industry: "industry-education", sub: "education", description: "An instructor who provides one-on-one academic help.", popularity: 45, difficulty: 2, tags: ["profession", "education", "industry-education", "bachelors", "indoor", "remote", "variable-income", "public-facing", "irregular-hours", "people-focused", "creative", "no-travel", "degree"] },

  // --- Business ---
  { name: "Entrepreneur", industry: "industry-business", sub: "business-law", description: "A person who starts and runs their own business.", popularity: 75, difficulty: 2, tags: ["profession", "business", "industry-business", "bachelors", "indoor", "office", "variable-income", "high-stress", "irregular-hours", "creative", "problem-solving", "leadership", "team-work", "public-speaking", "degree", "client-facing"] },
  { name: "HR Manager", industry: "industry-business", sub: "business-law", description: "A manager who oversees human resources and employee relations.", popularity: 58, difficulty: 2, tags: ["profession", "business", "industry-business", "bachelors", "indoor", "office", "high-income", "public-facing", "regular-hours", "people-focused", "team-work", "analytical", "degree", "leadership", "sedentary"] },
  { name: "Management Consultant", industry: "industry-business", sub: "business-law", description: "An advisor who helps organizations improve performance.", popularity: 55, difficulty: 3, tags: ["profession", "business", "industry-business", "masters", "indoor", "office", "high-income", "client-facing", "irregular-hours", "analytical", "frequent-travel", "degree", "problem-solving", "public-speaking", "high-stress"] },
  { name: "Real Estate Agent", industry: "industry-business", sub: "business-law", description: "A professional who helps clients buy and sell property.", popularity: 60, difficulty: 2, tags: ["profession", "business", "industry-business", "certificate", "indoor", "outdoor", "variable-income", "public-facing", "client-facing", "irregular-hours", "people-focused", "license-required", "local-travel", "sales"] },

  // --- Finance ---
  { name: "Actuary", industry: "industry-finance", sub: "business-law", description: "A professional who assesses financial risk using math and statistics.", popularity: 45, difficulty: 4, tags: ["profession", "finance", "industry-finance", "bachelors", "indoor", "office", "high-income", "solo-work", "regular-hours", "computer", "analytical", "degree", "license-required", "sedentary", "math"] },
  { name: "Financial Advisor", industry: "industry-finance", sub: "business-law", description: "A professional who helps clients manage investments and finances.", popularity: 55, difficulty: 2, tags: ["profession", "finance", "industry-finance", "bachelors", "indoor", "office", "high-income", "client-facing", "regular-hours", "people-focused", "degree", "license-required", "analytical", "sedentary"] },
  { name: "Investment Banker", industry: "industry-finance", sub: "business-law", description: "A professional who advises on large financial transactions.", popularity: 52, difficulty: 3, tags: ["profession", "finance", "industry-finance", "bachelors", "indoor", "office", "high-income", "client-facing", "irregular-hours", "high-stress", "analytical", "degree", "frequent-travel", "sedentary", "team-work"] },
  { name: "Loan Officer", industry: "industry-finance", sub: "business-law", description: "A professional who evaluates and approves loan applications.", popularity: 42, difficulty: 3, tags: ["profession", "finance", "industry-finance", "bachelors", "indoor", "office", "medium-income", "client-facing", "regular-hours", "analytical", "degree", "computer", "sedentary"] },

  // --- Construction ---
  { name: "Architect", industry: "industry-construction", sub: "trades", description: "A professional who designs buildings and structures.", popularity: 70, difficulty: 2, tags: ["profession", "construction", "industry-construction", "masters", "indoor", "office", "outdoor", "high-income", "client-facing", "regular-hours", "creative", "analytical", "degree", "license-required", "computer", "problem-solving"] },
  { name: "Civil Engineer", industry: "industry-construction", sub: "trades", description: "An engineer who designs infrastructure like roads and bridges.", popularity: 58, difficulty: 3, tags: ["profession", "construction", "industry-construction", "bachelors", "indoor", "outdoor", "high-income", "regular-hours", "analytical", "degree", "license-required", "computer", "problem-solving", "team-work"] },
  { name: "Welder", industry: "industry-construction", sub: "trades", description: "A tradesperson who joins metal parts using high heat.", popularity: 50, difficulty: 3, tags: ["profession", "construction", "industry-construction", "certificate", "indoor", "outdoor", "medium-income", "physical", "dangerous", "tools", "manual-dexterity", "trades", "construction-site", "heavy-lifting"] },
  { name: "Crane Operator", industry: "industry-construction", sub: "trades", description: "An operator who drives large construction cranes.", popularity: 38, difficulty: 4, tags: ["profession", "construction", "industry-construction", "certificate", "outdoor", "medium-income", "dangerous", "machinery", "license-required", "physical", "construction-site", "manual-dexterity", "high-stress"] },

  // --- Transportation ---
  { name: "Truck Driver", industry: "industry-transportation", sub: "business-law", description: "A driver who transports goods over long distances.", popularity: 65, difficulty: 2, tags: ["profession", "transportation", "industry-transportation", "certificate", "vehicle", "outdoor", "medium-income", "solo-work", "irregular-hours", "night-shift", "physical", "license-required", "sedentary", "local-travel", "frequent-travel", "dangerous"] },
  { name: "Train Conductor", industry: "industry-transportation", sub: "business-law", description: "A professional who manages train operations and passengers.", popularity: 48, difficulty: 3, tags: ["profession", "transportation", "industry-transportation", "certificate", "vehicle", "medium-income", "public-facing", "shift-work", "uniform", "license-required", "team-work", "regular-hours"] },
  { name: "Air Traffic Controller", industry: "industry-transportation", sub: "business-law", description: "A professional who coordinates aircraft movements at airports.", popularity: 55, difficulty: 4, tags: ["profession", "transportation", "industry-transportation", "certificate", "indoor", "high-income", "high-stress", "life-or-death", "shift-work", "night-shift", "license-required", "analytical", "problem-solving", "sedentary", "computer"] },
  { name: "Ship Captain", industry: "industry-transportation", sub: "business-law", description: "A mariner who commands vessels at sea.", popularity: 45, difficulty: 4, tags: ["profession", "transportation", "industry-transportation", "certificate", "outdoor", "vehicle", "high-income", "high-stress", "life-or-death", "license-required", "leadership", "team-work", "frequent-travel", "irregular-hours", "uniform"] },

  // --- Government ---
  { name: "Politician", industry: "industry-government", sub: "business-law", description: "An elected official who makes public policy decisions.", popularity: 70, difficulty: 2, tags: ["profession", "government", "industry-government", "bachelors", "indoor", "outdoor", "variable-income", "public-facing", "irregular-hours", "high-stress", "people-focused", "public-speaking", "leadership", "degree", "frequent-travel"] },
  { name: "Diplomat", industry: "industry-government", sub: "business-law", description: "An official who represents their country abroad.", popularity: 48, difficulty: 4, tags: ["profession", "government", "industry-government", "masters", "indoor", "office", "high-income", "public-facing", "irregular-hours", "international", "frequent-travel", "people-focused", "degree", "analytical", "public-speaking"] },
  { name: "Social Worker", industry: "industry-government", sub: "business-law", description: "A professional who helps people cope with challenges.", popularity: 58, difficulty: 2, tags: ["profession", "government", "industry-government", "bachelors", "indoor", "outdoor", "medium-income", "public-facing", "regular-hours", "people-focused", "caregiving", "high-stress", "degree", "problem-solving", "emotional"] },
  { name: "Postal Worker", industry: "industry-government", sub: "business-law", description: "A worker who sorts and delivers mail.", popularity: 45, difficulty: 2, tags: ["profession", "government", "industry-government", "no-degree", "outdoor", "indoor", "low-income", "physical", "regular-hours", "uniform", "early-riser", "local-travel"] },

  // --- Agriculture ---
  { name: "Landscaper", industry: "industry-agriculture", sub: "trades", description: "A worker who designs and maintains outdoor spaces.", popularity: 52, difficulty: 2, tags: ["profession", "agriculture", "industry-agriculture", "no-degree", "outdoor", "medium-income", "physical", "seasonal", "tools", "machinery", "creative", "hands-on", "manual-dexterity", "early-riser"] },
  { name: "Beekeeper", industry: "industry-agriculture", sub: "trades", description: "A person who tends bees and harvests honey.", popularity: 30, difficulty: 5, tags: ["profession", "agriculture", "industry-agriculture", "no-degree", "outdoor", "variable-income", "solo-work", "seasonal", "animal-care", "dangerous", "physical", "specialized-training", "hands-on", "rare-job"] },
  { name: "Agricultural Scientist", industry: "industry-agriculture", sub: "trades", description: "A scientist who studies crops and farming methods.", popularity: 35, difficulty: 4, tags: ["profession", "agriculture", "industry-agriculture", "masters", "outdoor", "lab", "medium-income", "regular-hours", "analytical", "science", "degree", "research", "solo-work", "computer"] },

  // --- Science ---
  { name: "Biologist", industry: "industry-science", sub: "trades", description: "A scientist who studies living organisms.", popularity: 55, difficulty: 3, tags: ["profession", "science", "industry-science", "doctorate", "indoor", "lab", "outdoor", "medium-income", "regular-hours", "analytical", "science", "degree", "research", "solo-work", "computer", "instruments"] },
  { name: "Chemist", industry: "industry-science", sub: "trades", description: "A scientist who studies chemical substances and reactions.", popularity: 52, difficulty: 3, tags: ["profession", "science", "industry-science", "doctorate", "indoor", "lab", "medium-income", "regular-hours", "analytical", "science", "degree", "research", "solo-work", "instruments", "dangerous", "precise"] },
  { name: "Astronomer", industry: "industry-science", sub: "trades", description: "A scientist who studies celestial objects and the universe.", popularity: 42, difficulty: 5, tags: ["profession", "science", "industry-science", "doctorate", "indoor", "office", "medium-income", "regular-hours", "analytical", "science", "degree", "research", "solo-work", "computer", "night-shift", "rare-job"] },
  { name: "Forensic Scientist", industry: "industry-science", sub: "trades", description: "A scientist who analyzes evidence for criminal investigations.", popularity: 58, difficulty: 3, tags: ["profession", "science", "industry-science", "masters", "indoor", "lab", "medium-income", "regular-hours", "analytical", "science", "degree", "problem-solving", "precise", "high-stress", "instruments", "government"] },
  { name: "Marine Biologist", industry: "industry-science", sub: "trades", description: "A scientist who studies ocean life and ecosystems.", popularity: 48, difficulty: 4, tags: ["profession", "science", "industry-science", "doctorate", "outdoor", "lab", "vehicle", "medium-income", "regular-hours", "analytical", "science", "degree", "research", "animal-care", "swimming", "frequent-travel", "rare-job"] },

  // --- Arts ---
  { name: "Graphic Designer", industry: "industry-arts", sub: "arts-media", description: "A designer who creates visual content for brands and media.", popularity: 62, difficulty: 2, tags: ["profession", "arts", "industry-arts", "bachelors", "indoor", "office", "remote", "medium-income", "solo-work", "regular-hours", "creative", "computer", "degree", "analytical"] },
  { name: "Photographer", industry: "industry-arts", sub: "arts-media", description: "An artist who captures images for clients or publications.", popularity: 55, difficulty: 2, tags: ["profession", "arts", "industry-arts", "certificate", "indoor", "outdoor", "variable-income", "solo-work", "irregular-hours", "creative", "instruments", "no-travel", "local-travel", "freelance"] },
  { name: "Animator", industry: "industry-arts", sub: "arts-media", description: "An artist who creates moving images for film, TV, and games.", popularity: 50, difficulty: 3, tags: ["profession", "arts", "industry-arts", "bachelors", "indoor", "office", "remote", "medium-income", "solo-work", "team-work", "regular-hours", "creative", "computer", "degree", "sedentary"] },
  { name: "Fashion Designer", industry: "industry-arts", sub: "arts-media", description: "A designer who creates clothing and accessories.", popularity: 52, difficulty: 3, tags: ["profession", "arts", "industry-arts", "bachelors", "indoor", "studio", "variable-income", "creative", "hands-on", "irregular-hours", "degree", "people-focused", "manual-dexterity", "frequent-travel"] },

  // --- Hospitality ---
  { name: "Hotel Manager", industry: "industry-hospitality", sub: "arts-media", description: "A manager who oversees hotel operations and staff.", popularity: 55, difficulty: 2, tags: ["profession", "hospitality", "industry-hospitality", "bachelors", "indoor", "medium-income", "public-facing", "shift-work", "high-stress", "leadership", "team-work", "people-focused", "degree", "problem-solving"] },
  { name: "Bartender", industry: "industry-hospitality", sub: "arts-media", description: "A professional who prepares and serves drinks at a bar.", popularity: 60, difficulty: 2, tags: ["profession", "hospitality", "industry-hospitality", "no-degree", "indoor", "kitchen", "variable-income", "public-facing", "night-shift", "irregular-hours", "physical", "creative", "people-focused", "hands-on", "license-required"] },
  { name: "Tour Guide", industry: "industry-hospitality", sub: "arts-media", description: "A guide who leads groups through attractions and sites.", popularity: 45, difficulty: 2, tags: ["profession", "hospitality", "industry-hospitality", "no-degree", "outdoor", "variable-income", "public-facing", "irregular-hours", "people-focused", "public-speaking", "local-travel", "physical", "creative"] },
  { name: "Flight Attendant", industry: "industry-hospitality", sub: "arts-media", description: "A professional who ensures passenger safety and comfort on flights.", popularity: 58, difficulty: 2, tags: ["profession", "hospitality", "industry-hospitality", "certificate", "vehicle", "medium-income", "public-facing", "irregular-hours", "night-shift", "uniform", "people-focused", "frequent-travel", "physical", "caregiving", "license-required"] },

  // --- Legal ---
  { name: "Judge", industry: "industry-legal", sub: "business-law", description: "An official who presides over court proceedings.", popularity: 65, difficulty: 3, tags: ["profession", "legal", "industry-legal", "doctorate", "indoor", "courtroom", "high-income", "public-facing", "regular-hours", "analytical", "degree", "license-required", "leadership", "high-stress", "public-speaking", "uniform"] },
  { name: "Paralegal", industry: "industry-legal", sub: "business-law", description: "A professional who assists lawyers with legal work.", popularity: 50, difficulty: 3, tags: ["profession", "legal", "industry-legal", "associate", "indoor", "office", "medium-income", "regular-hours", "analytical", "computer", "degree", "sedentary", "research"] },
  { name: "Court Reporter", industry: "industry-legal", sub: "business-law", description: "A professional who transcribes court proceedings verbatim.", popularity: 35, difficulty: 5, tags: ["profession", "legal", "industry-legal", "certificate", "indoor", "courtroom", "medium-income", "regular-hours", "solo-work", "sedentary", "specialized-training", "precise", "license-required", "computer", "rare-job"] },

  // --- Manufacturing ---
  { name: "Factory Worker", industry: "industry-manufacturing", sub: "trades", description: "A worker who operates machinery on a production line.", popularity: 55, difficulty: 2, tags: ["profession", "manufacturing", "industry-manufacturing", "no-degree", "indoor", "low-income", "physical", "shift-work", "repetitive", "machinery", "team-work", "dangerous", "manual-dexterity"] },
  { name: "Quality Inspector", industry: "industry-manufacturing", sub: "trades", description: "A professional who checks products for defects.", popularity: 42, difficulty: 3, tags: ["profession", "manufacturing", "industry-manufacturing", "certificate", "indoor", "medium-income", "regular-hours", "analytical", "precise", "instruments", "solo-work", "repetitive"] },
  { name: "Industrial Engineer", industry: "industry-manufacturing", sub: "trades", description: "An engineer who optimizes manufacturing processes.", popularity: 48, difficulty: 3, tags: ["profession", "manufacturing", "industry-manufacturing", "bachelors", "indoor", "outdoor", "high-income", "regular-hours", "analytical", "degree", "computer", "problem-solving", "team-work", "license-required"] },

  // --- Ultra-rare jobs (Fix #7) ---
  { name: "Astronaut", industry: "industry-science", sub: "trades", description: "A person trained to travel and work in space.", popularity: 65, difficulty: 5, tags: ["profession", "science", "industry-science", "doctorate", "vehicle", "high-income", "life-or-death", "high-stress", "physical", "dangerous", "degree", "specialized-training", "frequent-travel", "rare-job", "uniform", "problem-solving", "science", "team-work", "public-speaking"] },
  { name: "Sommelier", industry: "industry-hospitality", sub: "arts-media", description: "A professional who specializes in wine service and pairing.", popularity: 30, difficulty: 5, tags: ["profession", "hospitality", "industry-hospitality", "certificate", "indoor", "kitchen", "medium-income", "public-facing", "client-facing", "specialized-training", "license-required", "people-focused", "creative", "rare-job", "food"] },
  { name: "Archaeologist", industry: "industry-science", sub: "trades", description: "A scientist who studies human history through excavation.", popularity: 50, difficulty: 4, tags: ["profession", "science", "industry-science", "doctorate", "outdoor", "lab", "medium-income", "regular-hours", "analytical", "science", "degree", "research", "physical", "frequent-travel", "solo-work", "instruments"] },
  { name: "Cartographer", industry: "industry-science", sub: "trades", description: "A professional who creates maps and charts.", popularity: 25, difficulty: 5, tags: ["profession", "science", "industry-science", "bachelors", "indoor", "office", "medium-income", "solo-work", "regular-hours", "analytical", "creative", "computer", "degree", "instruments", "rare-job", "precise"] },
  { name: "Underwater Welder", industry: "industry-construction", sub: "trades", description: "A specialist who welds structures underwater.", popularity: 15, difficulty: 5, tags: ["profession", "construction", "industry-construction", "certificate", "outdoor", "vehicle", "high-income", "dangerous", "life-or-death", "physical", "specialized-training", "license-required", "tools", "manual-dexterity", "swimming", "rare-job", "heavy-lifting"] },
  { name: "Volcanologist", industry: "industry-science", sub: "trades", description: "A scientist who studies volcanoes and eruptions.", popularity: 20, difficulty: 5, tags: ["profession", "science", "industry-science", "doctorate", "outdoor", "medium-income", "dangerous", "analytical", "science", "degree", "research", "physical", "frequent-travel", "solo-work", "rare-job", "instruments"] },
  { name: "Stunt Double", industry: "industry-arts", sub: "arts-media", description: "A performer who stands in for actors in dangerous scenes.", popularity: 25, difficulty: 5, tags: ["profession", "arts", "industry-arts", "no-degree", "indoor", "outdoor", "variable-income", "dangerous", "physical", "irregular-hours", "specialized-training", "creative", "rare-job", "team-work", "fame-possible"] },
  { name: "Lighthouse Keeper", industry: "industry-government", sub: "business-law", description: "A person who maintains lighthouses and aids to navigation.", popularity: 10, difficulty: 5, tags: ["profession", "government", "industry-government", "no-degree", "outdoor", "low-income", "solo-work", "night-shift", "irregular-hours", "physical", "rare-job", "specialized-training", "remote-location"] },
];

// ------------------------------------------------------------
// INDUSTRY-PROBING QUESTIONS (14) — asked early in job mode
// ------------------------------------------------------------

const INDUSTRY_QUESTIONS: { text: string; tag: string }[] = [
  { text: "Does this job involve healthcare or medicine?", tag: "industry-healthcare" },
  { text: "Is this a technology or software job?", tag: "industry-technology" },
  { text: "Does this job involve teaching or education?", tag: "industry-education" },
  { text: "Is this a business or management job?", tag: "industry-business" },
  { text: "Does this job involve finance or money management?", tag: "industry-finance" },
  { text: "Is this a construction or building trade job?", tag: "industry-construction" },
  { text: "Does this job involve transportation or driving?", tag: "industry-transportation" },
  { text: "Is this a government or public service job?", tag: "industry-government" },
  { text: "Does this job involve agriculture or farming?", tag: "industry-agriculture" },
  { text: "Is this a scientific research job?", tag: "industry-science" },
  { text: "Is this job in the arts or entertainment?", tag: "industry-arts" },
  { text: "Does this job involve hospitality or food service?", tag: "industry-hospitality" },
  { text: "Is this a legal or law-related job?", tag: "industry-legal" },
  { text: "Is this a manufacturing or factory job?", tag: "industry-manufacturing" },
];

// ------------------------------------------------------------
// DISCRIMINATING JOB QUESTIONS (40+) — probe rich attributes
// ------------------------------------------------------------

const DISCRIMINATING_QUESTIONS: { text: string; tag: string }[] = [
  // Work environment
  { text: "Does this job involve working outdoors?", tag: "outdoor" },
  { text: "Is this job primarily desk-based?", tag: "sedentary" },
  { text: "Does this job involve working in a hospital?", tag: "hospital" },
  { text: "Does this job involve working in a laboratory?", tag: "lab" },
  { text: "Does this job involve working in a kitchen?", tag: "kitchen" },
  { text: "Does this job involve working in a courtroom?", tag: "courtroom" },
  { text: "Does this job involve working in a school?", tag: "school" },
  { text: "Does this job involve working on a construction site?", tag: "construction-site" },
  { text: "Does this job involve working in a vehicle?", tag: "vehicle" },
  { text: "Can this job be done remotely from home?", tag: "remote" },

  // Education
  { text: "Does this job require a doctoral degree?", tag: "doctorate" },
  { text: "Does this job require only a high school diploma?", tag: "no-degree" },
  { text: "Does this job require a specialized license?", tag: "license-required" },
  { text: "Does this job require a master's degree?", tag: "masters" },

  // Income
  { text: "Is this a high-paying job?", tag: "high-income" },
  { text: "Is this a modest-paying job?", tag: "low-income" },
  { text: "Does this job have variable or freelance income?", tag: "variable-income" },

  // Physical demands
  { text: "Does this job require heavy physical labor?", tag: "heavy-lifting" },
  { text: "Is this job physically demanding?", tag: "physical" },
  { text: "Does this job require manual dexterity?", tag: "manual-dexterity" },
  { text: "Does this job require working with your hands?", tag: "hands-on" },

  // Interaction
  { text: "Does this job involve working with the public?", tag: "public-facing" },
  { text: "Is this primarily solo work?", tag: "solo-work" },
  { text: "Does this job involve managing other people?", tag: "leadership" },
  { text: "Does this job involve working with children?", tag: "works-with-children" },
  { text: "Does this job involve working with animals?", tag: "animal-care" },
  { text: "Does this job involve client-facing work?", tag: "client-facing" },

  // Schedule
  { text: "Does this job require working night shifts?", tag: "night-shift" },
  { text: "Is this a 9-to-5 job with regular hours?", tag: "regular-hours" },
  { text: "Does this job require being on-call?", tag: "on-call" },
  { text: "Does this job involve shift work?", tag: "shift-work" },

  // Stress & danger
  { text: "Does this job involve life-or-death decisions?", tag: "life-or-death" },
  { text: "Is this a dangerous job?", tag: "dangerous" },
  { text: "Is this a high-stress job?", tag: "high-stress" },

  // Creativity & analysis
  { text: "Does this job involve creative work?", tag: "creative" },
  { text: "Is this primarily analytical work?", tag: "analytical" },
  { text: "Does this job involve repetitive tasks?", tag: "repetitive" },
  { text: "Does this job involve public speaking?", tag: "public-speaking" },

  // Tools & travel
  { text: "Does this job involve working with computers?", tag: "computer" },
  { text: "Does this job involve writing code?", tag: "coding" },
  { text: "Does this job involve using specialized tools?", tag: "tools" },
  { text: "Does this job involve operating machinery?", tag: "machinery" },
  { text: "Does this job require frequent travel?", tag: "frequent-travel" },
  { text: "Does this job involve sales?", tag: "sales" },
  { text: "Does this job involve wearing a uniform?", tag: "uniform" },
  { text: "Does this job involve scientific research?", tag: "research" },
];

// ------------------------------------------------------------
// Main upgrade function
// ------------------------------------------------------------

async function upgradeJobs() {
  console.log("=== GUESS MY JOB UPGRADE ===\n");

  const jobsCategory = await db.category.findUnique({ where: { slug: "jobs" } });
  if (!jobsCategory) {
    console.error("Jobs category not found! Run the main seed first.");
    process.exit(1);
  }

  // --- Step 1: Add new subcategories ---
  console.log("Step 1: Adding new subcategories...");
  const newSubs = [
    { name: "Finance", slug: "finance" },
    { name: "Construction", slug: "construction" },
    { name: "Transportation", slug: "transportation" },
    { name: "Government", slug: "government" },
    { name: "Agriculture", slug: "agriculture" },
    { name: "Science", slug: "science" },
    { name: "Hospitality", slug: "hospitality" },
    { name: "Legal", slug: "legal" },
    { name: "Manufacturing", slug: "manufacturing" },
    { name: "Business", slug: "business" },
  ];
  for (const s of newSubs) {
    await ensureSubcategory(jobsCategory.id, s.name, s.slug);
  }
  console.log(`  + ${newSubs.length} subcategories ensured.\n`);

  // --- Step 2: Add industry tags to existing jobs ---
  console.log("Step 2: Adding industry tags to existing jobs...");
  let industryTagged = 0;
  for (const mapping of EXISTING_JOB_INDUSTRY) {
    const entity = await db.entity.findFirst({
      where: { name: mapping.name, categoryId: jobsCategory.id },
    });
    if (!entity) continue;
    await addTagsToEntity(entity.id, [mapping.industry]);
    industryTagged++;
  }
  console.log(`  + ${industryTagged} existing jobs tagged with industry.\n`);

  // --- Step 3: Enrich existing jobs with rich fingerprint tags ---
  console.log("Step 3: Enriching existing jobs with rich tags...");
  let enriched = 0;
  for (const [jobName, richTags] of Object.entries(EXISTING_JOB_RICH_TAGS)) {
    const entity = await db.entity.findFirst({
      where: { name: jobName, categoryId: jobsCategory.id },
    });
    if (!entity) continue;
    await addTagsToEntity(entity.id, richTags);
    enriched++;
  }
  console.log(`  + ${enriched} existing jobs enriched with deep tags.\n`);

  // --- Step 4: Add new rare/specialized jobs ---
  console.log("Step 4: Adding new rare & specialized jobs...");
  let newJobsCreated = 0;
  for (const job of NEW_JOBS) {
    // Find or create subcategory
    const sub = await db.subcategory.findFirst({
      where: { slug: job.sub, categoryId: jobsCategory.id },
    });
    const subId = sub?.id ?? null;

    // Build full tag list (includes industry tag + all specified tags)
    const allTags = [...new Set([job.industry, ...job.tags])];

    await createEntity(
      job.name,
      jobsCategory.id,
      subId,
      job.description,
      allTags,
      job.popularity,
      job.difficulty
    );
    newJobsCreated++;
  }
  console.log(`  + ${newJobsCreated} new jobs added.\n`);

  // --- Step 5: Add industry-probing questions ---
  console.log("Step 5: Adding industry-probing questions...");
  let industryQCreated = 0;
  for (const q of INDUSTRY_QUESTIONS) {
    await ensureQuestion(q.text, q.tag, jobsCategory.id);
    industryQCreated++;
  }
  console.log(`  + ${industryQCreated} industry questions ensured.\n`);

  // --- Step 6: Add discriminating questions ---
  console.log("Step 6: Adding discriminating job questions...");
  let discrimQCreated = 0;
  for (const q of DISCRIMINATING_QUESTIONS) {
    await ensureQuestion(q.text, q.tag, jobsCategory.id);
    discrimQCreated++;
  }
  console.log(`  + ${discrimQCreated} discriminating questions ensured.\n`);

  // --- Summary ---
  const totalJobs = await db.entity.count({
    where: { categoryId: jobsCategory.id, isActive: true },
  });
  const totalJobQuestions = await db.question.count({
    where: { categoryId: jobsCategory.id, isActive: true },
  });
  const totalJobTags = await db.entityTag.count({
    where: { entity: { categoryId: jobsCategory.id } },
  });

  console.log("=== UPGRADE COMPLETE ===");
  console.log(`  Total job entities: ${totalJobs}`);
  console.log(`  Total job questions: ${totalJobQuestions}`);
  console.log(`  Total job tag associations: ${totalJobTags}`);
}

upgradeJobs()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
