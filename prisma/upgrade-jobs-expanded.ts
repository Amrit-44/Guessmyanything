/**
 * GUESS MY JOB — Expanded Knowledge Base (300+ jobs)
 *
 * Adds ~227 NEW jobs to the existing 88, bringing the total to 300+.
 * Each job is tagged with the 8-attribute system (industry, work
 * environment, education, salary, experience, physical demand, tools,
 * skills) using the SAME tag vocabulary as upgrade-jobs.ts so existing
 * questions work on new jobs too.
 *
 * Also adds 20-25 NEW natural-language questions probing the 8
 * attributes, with NO duplicates from the existing 76 questions.
 *
 * Idempotent: safe to run multiple times. Skips jobs that already exist.
 *
 * Run: bun run prisma/upgrade-jobs-expanded.ts
 */

import { db } from "../src/lib/db";

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
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
  const created = await db.subcategory.create({
    data: { name, slug, categoryId },
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
    data: { text, primaryTagId: tag.id, categoryId, inverted: false },
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
    // Just add missing tags (don't overwrite existing data).
    await addTagsToEntity(existing.id, tags);
    return;
  }

  const tagSlugs: string[] = [];
  const tagIds: string[] = [];
  const seen = new Set<string>();
  for (const t of tags) {
    const tag = await ensureTag(t);
    if (seen.has(tag.id)) continue;
    seen.add(tag.id);
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
      tags: { create: tagIds.map((id) => ({ tagId: id, weight: 1 })) },
    },
  });
}

// ------------------------------------------------------------
// Job definition interface (compact 8-attribute format)
// ------------------------------------------------------------

interface JobDef {
  name: string;
  sub: string; // subcategory slug
  desc: string;
  pop: number; // popularity 1-100
  diff: number; // difficulty 1-5
  // 8 core attributes — each generates tags:
  industry: string[]; // e.g. ["technology"] → "industry-technology"
  workEnv: string[]; // e.g. ["indoor", "office", "remote"] → used as-is
  education: string[]; // e.g. ["bachelor"] → "bachelors" (matches existing)
  salary: string[]; // e.g. ["high"] → "high-income"
  experience: string[]; // e.g. ["mid", "senior"] → "experience-mid", "experience-senior"
  physical: string[]; // e.g. ["sedentary"] → used as-is
  tools: string[]; // e.g. ["computer"] → used as-is
  skills: string[]; // e.g. ["programming"] → used as-is
}

/**
 * Convert a JobDef's 8 attributes into the full tag array,
 * matching the existing tag vocabulary from upgrade-jobs.ts.
 */
function jobDefToTags(j: JobDef): string[] {
  const tags: string[] = ["profession"];

  // 1. Industry → "industry-{slug}" + raw industry name
  for (const ind of j.industry) {
    tags.push(`industry-${ind}`);
    tags.push(ind);
  }

  // 2. Work environment → used as-is (indoor, outdoor, office, hospital, etc.)
  for (const w of j.workEnv) tags.push(w);

  // 3. Education → map to existing patterns
  const eduMap: Record<string, string> = {
    "no-degree": "no-degree",
    highschool: "highschool",
    associate: "associate",
    bachelor: "bachelors",
    bachelors: "bachelors",
    master: "masters",
    masters: "masters",
    doctorate: "doctorate",
    certificate: "certificate",
    tradeschool: "certificate",
    bootcamp: "bachelors",
    degree: "degree",
  };
  for (const e of j.education) {
    tags.push(eduMap[e] ?? e);
  }

  // 4. Salary → map to existing patterns
  const salMap: Record<string, string> = {
    low: "low-income",
    medium: "medium-income",
    high: "high-income",
    "very-high": "high-income",
    variable: "variable-income",
  };
  for (const s of j.salary) {
    tags.push(salMap[s] ?? `${s}-income`);
  }

  // 5. Experience → "experience-{slug}"
  for (const ex of j.experience) tags.push(`experience-${ex}`);

  // 6. Physical demand → used as-is (sedentary, light, moderate, physical, extreme)
  const physMap: Record<string, string> = {
    sedentary: "sedentary",
    light: "sedentary",
    moderate: "physical",
    heavy: "physical",
    extreme: "physical",
  };
  for (const p of j.physical) tags.push(physMap[p] ?? p);

  // 7. Tools → used as-is (computer, stethoscope, machinery, etc.)
  for (const t of j.tools) tags.push(t);

  // 8. Skills → used as-is (programming, analytical, creative, etc.)
  for (const s of j.skills) tags.push(s);

  // Deduplicate
  return [...new Set(tags)];
}

// ------------------------------------------------------------
// JOB DATA — ~227 new jobs
// (This section is generated to match existing tag vocabulary)
// ------------------------------------------------------------

// INDUSTRY SLUGS (must match JOB_INDUSTRIES in engine.ts):
// technology, healthcare, education, business, finance, construction,
// transportation, government, agriculture, science, arts, hospitality,
// legal, manufacturing

const JOBS: JobDef[] = [
  // ================================================================
  // TECHNOLOGY (~43 new jobs)
  // Existing: Software Engineer, Web Developer, Data Scientist,
  //           DevOps Engineer, Cybersecurity Analyst, Blockchain Developer, AI Researcher
  // ================================================================
  { name: "Mobile App Developer", sub: "technology", desc: "A developer who builds applications for iOS and Android devices.", pop: 60, diff: 2, industry: ["technology"], workEnv: ["indoor", "office", "remote"], education: ["bachelor", "degree"], salary: ["high"], experience: ["mid", "senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["coding", "analytical", "problem-solving", "creative", "team-work"] },
  { name: "Machine Learning Engineer", sub: "technology", desc: "An engineer who builds ML models and deploys them to production.", pop: 58, diff: 3, industry: ["technology"], workEnv: ["indoor", "office", "remote"], education: ["master", "degree"], salary: ["high", "very-high"], experience: ["mid", "senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["coding", "analytical", "problem-solving", "research", "team-work"] },
  { name: "AI Engineer", sub: "technology", desc: "An engineer who designs and builds artificial intelligence systems.", pop: 56, diff: 3, industry: ["technology"], workEnv: ["indoor", "office", "remote"], education: ["master", "degree"], salary: ["high", "very-high"], experience: ["mid", "senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["coding", "analytical", "problem-solving", "research", "creative"] },
  { name: "Cloud Architect", sub: "technology", desc: "An architect who designs cloud infrastructure and deployment strategies.", pop: 55, diff: 3, industry: ["technology"], workEnv: ["indoor", "office", "remote"], education: ["bachelor", "degree"], salary: ["very-high"], experience: ["senior", "executive"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["coding", "analytical", "problem-solving", "leadership", "team-work"] },
  { name: "Site Reliability Engineer", sub: "technology", desc: "An engineer who ensures large-scale systems stay reliable and fast.", pop: 48, diff: 3, industry: ["technology"], workEnv: ["indoor", "office", "remote"], education: ["bachelor", "degree"], salary: ["high"], experience: ["mid", "senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["coding", "analytical", "problem-solving", "troubleshooting", "on-call"] },
  { name: "Systems Administrator", sub: "technology", desc: "An administrator who manages and maintains computer systems and servers.", pop: 50, diff: 2, industry: ["technology"], workEnv: ["indoor", "office"], education: ["bachelor", "degree"], salary: ["medium", "high"], experience: ["mid"], physical: ["sedentary"], tools: ["computer", "software", "server"], skills: ["coding", "analytical", "problem-solving", "troubleshooting", "machine-focused"] },
  { name: "Network Engineer", sub: "technology", desc: "An engineer who designs and maintains computer networks.", pop: 52, diff: 2, industry: ["technology"], workEnv: ["indoor", "office"], education: ["bachelor", "degree"], salary: ["medium", "high"], experience: ["mid", "senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["analytical", "problem-solving", "troubleshooting", "machine-focused", "team-work"] },
  { name: "Penetration Tester", sub: "technology", desc: "A security professional who simulates cyberattacks to find vulnerabilities.", pop: 48, diff: 3, industry: ["technology"], workEnv: ["indoor", "office", "remote"], education: ["bachelor", "certificate", "degree"], salary: ["high"], experience: ["mid", "senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["coding", "analytical", "problem-solving", "troubleshooting", "research"] },
  { name: "Database Administrator", sub: "technology", desc: "An administrator who manages databases and ensures data integrity.", pop: 50, diff: 2, industry: ["technology"], workEnv: ["indoor", "office"], education: ["bachelor", "degree"], salary: ["medium", "high"], experience: ["mid"], physical: ["sedentary"], tools: ["computer", "software", "server"], skills: ["coding", "analytical", "problem-solving", "machine-focused", "precise"] },
  { name: "Data Analyst", sub: "technology", desc: "An analyst who interprets data to help businesses make decisions.", pop: 58, diff: 2, industry: ["technology", "business"], workEnv: ["indoor", "office", "remote"], education: ["bachelor", "degree"], salary: ["medium", "high"], experience: ["entry", "mid"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["analytical", "problem-solving", "research", "team-work"] },
  { name: "Business Intelligence Analyst", sub: "technology", desc: "An analyst who turns data into actionable business insights.", pop: 52, diff: 3, industry: ["technology", "business"], workEnv: ["indoor", "office", "remote"], education: ["bachelor", "degree"], salary: ["high"], experience: ["mid"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["analytical", "problem-solving", "research", "team-work", "communication"] },
  { name: "Full Stack Developer", sub: "technology", desc: "A developer who works on both front-end and back-end of web applications.", pop: 62, diff: 2, industry: ["technology"], workEnv: ["indoor", "office", "remote"], education: ["bachelor", "degree"], salary: ["high"], experience: ["mid", "senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["coding", "analytical", "problem-solving", "creative", "team-work"] },
  { name: "Frontend Developer", sub: "technology", desc: "A developer who builds the user-facing side of websites and apps.", pop: 60, diff: 2, industry: ["technology"], workEnv: ["indoor", "office", "remote"], education: ["bachelor", "degree"], salary: ["medium", "high"], experience: ["entry", "mid"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["coding", "creative", "analytical", "problem-solving", "team-work"] },
  { name: "Backend Developer", sub: "technology", desc: "A developer who builds server-side logic and APIs.", pop: 58, diff: 2, industry: ["technology"], workEnv: ["indoor", "office", "remote"], education: ["bachelor", "degree"], salary: ["high"], experience: ["mid", "senior"], physical: ["sedentary"], tools: ["computer", "software", "server"], skills: ["coding", "analytical", "problem-solving", "team-work"] },
  { name: "UI/UX Designer", sub: "technology", desc: "A designer who creates intuitive user interfaces and experiences.", pop: 58, diff: 2, industry: ["technology", "arts"], workEnv: ["indoor", "office", "remote"], education: ["bachelor", "degree"], salary: ["medium", "high"], experience: ["mid"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["creative", "analytical", "problem-solving", "team-work", "communication"] },
  { name: "Product Manager", sub: "technology", desc: "A manager who guides product strategy and development.", pop: 60, diff: 2, industry: ["technology", "business"], workEnv: ["indoor", "office"], education: ["bachelor", "degree"], salary: ["high", "very-high"], experience: ["senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["leadership", "analytical", "problem-solving", "communication", "public-speaking", "team-work"] },
  { name: "Technical Project Manager", sub: "technology", desc: "A manager who oversees technology projects from start to finish.", pop: 55, diff: 2, industry: ["technology", "business"], workEnv: ["indoor", "office"], education: ["bachelor", "degree"], salary: ["high"], experience: ["senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["leadership", "analytical", "problem-solving", "team-work", "communication", "organization"] },
  { name: "Scrum Master", sub: "technology", desc: "A facilitator who helps agile teams work effectively.", pop: 48, diff: 2, industry: ["technology", "business"], workEnv: ["indoor", "office", "remote"], education: ["bachelor", "certificate", "degree"], salary: ["medium", "high"], experience: ["mid"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["leadership", "communication", "team-work", "organization", "problem-solving"] },
  { name: "QA Tester", sub: "technology", desc: "A tester who finds bugs and ensures software quality.", pop: 50, diff: 2, industry: ["technology"], workEnv: ["indoor", "office", "remote"], education: ["bachelor", "degree"], salary: ["medium"], experience: ["entry", "mid"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["analytical", "problem-solving", "precise", "team-work", "troubleshooting"] },
  { name: "Automation Engineer", sub: "technology", desc: "An engineer who builds automated testing and deployment pipelines.", pop: 50, diff: 3, industry: ["technology"], workEnv: ["indoor", "office", "remote"], education: ["bachelor", "degree"], salary: ["high"], experience: ["mid", "senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["coding", "analytical", "problem-solving", "troubleshooting", "team-work"] },
  { name: "IT Support Specialist", sub: "technology", desc: "A specialist who helps users with computer and software problems.", pop: 52, diff: 1, industry: ["technology"], workEnv: ["indoor", "office"], education: ["associate", "bachelor", "degree"], salary: ["medium"], experience: ["entry", "mid"], physical: ["sedentary"], tools: ["computer", "software", "phone"], skills: ["problem-solving", "troubleshooting", "communication", "people-focused", "team-work"] },
  { name: "Help Desk Technician", sub: "technology", desc: "A technician who provides first-line technical support.", pop: 48, diff: 1, industry: ["technology"], workEnv: ["indoor", "office"], education: ["associate", "highschool"], salary: ["low", "medium"], experience: ["entry"], physical: ["sedentary"], tools: ["computer", "software", "phone"], skills: ["problem-solving", "troubleshooting", "communication", "people-focused"] },
  { name: "Solutions Architect", sub: "technology", desc: "An architect who designs technology solutions for business problems.", pop: 54, diff: 3, industry: ["technology", "business"], workEnv: ["indoor", "office"], education: ["bachelor", "degree"], salary: ["very-high"], experience: ["senior", "executive"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["analytical", "problem-solving", "leadership", "communication", "team-work", "public-speaking"] },
  { name: "Technical Writer", sub: "technology", desc: "A writer who creates documentation and guides for technical products.", pop: 48, diff: 2, industry: ["technology", "arts"], workEnv: ["indoor", "office", "remote"], education: ["bachelor", "degree"], salary: ["medium", "high"], experience: ["mid"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["writing", "analytical", "communication", "team-work", "research"] },
  { name: "Game Developer", sub: "technology", desc: "A developer who creates video games for consoles, PC, and mobile.", pop: 55, diff: 3, industry: ["technology", "arts"], workEnv: ["indoor", "office", "remote"], education: ["bachelor", "degree"], salary: ["medium", "high"], experience: ["mid"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["coding", "creative", "problem-solving", "analytical", "team-work"] },
  { name: "AR/VR Developer", sub: "technology", desc: "A developer who builds augmented and virtual reality experiences.", pop: 42, diff: 4, industry: ["technology", "arts"], workEnv: ["indoor", "office", "remote"], education: ["bachelor", "degree"], salary: ["high"], experience: ["mid", "senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["coding", "creative", "problem-solving", "analytical", "research"] },
  { name: "Embedded Systems Engineer", sub: "technology", desc: "An engineer who programs hardware devices and embedded systems.", pop: 45, diff: 4, industry: ["technology", "manufacturing"], workEnv: ["indoor", "office", "lab"], education: ["bachelor", "master", "degree"], salary: ["high"], experience: ["mid", "senior"], physical: ["sedentary"], tools: ["computer", "software", "instruments"], skills: ["coding", "analytical", "problem-solving", "machine-focused", "troubleshooting"] },
  { name: "Hardware Engineer", sub: "technology", desc: "An engineer who designs and tests computer hardware components.", pop: 50, diff: 3, industry: ["technology", "manufacturing"], workEnv: ["indoor", "office", "lab"], education: ["bachelor", "degree"], salary: ["high"], experience: ["mid", "senior"], physical: ["sedentary"], tools: ["computer", "instruments", "software"], skills: ["analytical", "problem-solving", "machine-focused", "research", "team-work"] },
  { name: "Network Architect", sub: "technology", desc: "An architect who designs communication networks and infrastructure.", pop: 48, diff: 3, industry: ["technology"], workEnv: ["indoor", "office"], education: ["bachelor", "degree"], salary: ["high", "very-high"], experience: ["senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["analytical", "problem-solving", "leadership", "team-work", "machine-focused"] },
  { name: "Security Engineer", sub: "technology", desc: "An engineer who builds systems to protect against cyber threats.", pop: 52, diff: 3, industry: ["technology"], workEnv: ["indoor", "office", "remote"], education: ["bachelor", "degree"], salary: ["high"], experience: ["mid", "senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["coding", "analytical", "problem-solving", "troubleshooting", "research"] },
  { name: "Cryptographer", sub: "technology", desc: "A specialist who designs encryption algorithms and security protocols.", pop: 35, diff: 5, industry: ["technology", "science"], workEnv: ["indoor", "office"], education: ["master", "doctorate", "degree"], salary: ["high", "very-high"], experience: ["senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["coding", "analytical", "research", "problem-solving", "math"] },
  { name: "Data Engineer", sub: "technology", desc: "An engineer who builds pipelines and infrastructure for data.", pop: 55, diff: 3, industry: ["technology"], workEnv: ["indoor", "office", "remote"], education: ["bachelor", "degree"], salary: ["high"], experience: ["mid", "senior"], physical: ["sedentary"], tools: ["computer", "software", "server"], skills: ["coding", "analytical", "problem-solving", "team-work"] },
  { name: "Analytics Manager", sub: "technology", desc: "A manager who leads a team of data analysts.", pop: 48, diff: 3, industry: ["technology", "business"], workEnv: ["indoor", "office"], education: ["bachelor", "master", "degree"], salary: ["high", "very-high"], experience: ["senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["leadership", "analytical", "problem-solving", "team-work", "communication"] },
  { name: "IT Director", sub: "technology", desc: "A director who oversees all technology operations for an organization.", pop: 45, diff: 3, industry: ["technology", "business"], workEnv: ["indoor", "office"], education: ["master", "degree"], salary: ["very-high"], experience: ["executive"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["leadership", "analytical", "problem-solving", "communication", "public-speaking", "team-work"] },
  { name: "CTO", sub: "technology", desc: "The Chief Technology Officer who sets the technology vision for a company.", pop: 50, diff: 3, industry: ["technology", "business"], workEnv: ["indoor", "office"], education: ["master", "degree"], salary: ["very-high"], experience: ["executive"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["leadership", "analytical", "problem-solving", "communication", "public-speaking", "team-work"] },
  { name: "CIO", sub: "technology", desc: "The Chief Information Officer who oversees IT strategy and systems.", pop: 45, diff: 3, industry: ["technology", "business"], workEnv: ["indoor", "office"], education: ["master", "degree"], salary: ["very-high"], experience: ["executive"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["leadership", "analytical", "problem-solving", "communication", "team-work"] },
  { name: "Software Architect", sub: "technology", desc: "An architect who designs the structure of software systems.", pop: 52, diff: 3, industry: ["technology"], workEnv: ["indoor", "office", "remote"], education: ["bachelor", "degree"], salary: ["very-high"], experience: ["senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["coding", "analytical", "problem-solving", "leadership", "team-work"] },
  { name: "Release Manager", sub: "technology", desc: "A manager who coordinates software releases and deployments.", pop: 42, diff: 3, industry: ["technology"], workEnv: ["indoor", "office", "remote"], education: ["bachelor", "degree"], salary: ["high"], experience: ["mid", "senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["leadership", "organization", "analytical", "team-work", "problem-solving"] },
  { name: "Infrastructure Manager", sub: "technology", desc: "A manager who oversees IT infrastructure and servers.", pop: 42, diff: 3, industry: ["technology"], workEnv: ["indoor", "office"], education: ["bachelor", "degree"], salary: ["high"], experience: ["senior"], physical: ["sedentary"], tools: ["computer", "software", "server"], skills: ["leadership", "analytical", "problem-solving", "team-work", "machine-focused"] },
  { name: "Cloud Engineer", sub: "technology", desc: "An engineer who builds and manages cloud-based systems.", pop: 54, diff: 3, industry: ["technology"], workEnv: ["indoor", "office", "remote"], education: ["bachelor", "degree"], salary: ["high"], experience: ["mid", "senior"], physical: ["sedentary"], tools: ["computer", "software", "server"], skills: ["coding", "analytical", "problem-solving", "troubleshooting", "team-work"] },
  { name: "Kubernetes Administrator", sub: "technology", desc: "An administrator who manages container orchestration clusters.", pop: 38, diff: 4, industry: ["technology"], workEnv: ["indoor", "office", "remote"], education: ["bachelor", "certificate", "degree"], salary: ["high"], experience: ["mid", "senior"], physical: ["sedentary"], tools: ["computer", "software", "server"], skills: ["coding", "analytical", "problem-solving", "troubleshooting", "machine-focused"] },
  { name: "Docker Specialist", sub: "technology", desc: "A specialist who containerizes applications for portable deployment.", pop: 35, diff: 4, industry: ["technology"], workEnv: ["indoor", "office", "remote"], education: ["bachelor", "certificate", "degree"], salary: ["high"], experience: ["mid", "senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["coding", "analytical", "problem-solving", "troubleshooting"] },
  { name: "API Developer", sub: "technology", desc: "A developer who builds application programming interfaces.", pop: 48, diff: 2, industry: ["technology"], workEnv: ["indoor", "office", "remote"], education: ["bachelor", "degree"], salary: ["high"], experience: ["mid"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["coding", "analytical", "problem-solving", "team-work"] },
  { name: "Integration Specialist", sub: "technology", desc: "A specialist who connects different software systems to work together.", pop: 42, diff: 3, industry: ["technology"], workEnv: ["indoor", "office", "remote"], education: ["bachelor", "degree"], salary: ["high"], experience: ["mid", "senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["coding", "analytical", "problem-solving", "troubleshooting", "team-work"] },

  // ================================================================
  // HEALTHCARE & MEDICAL (~39 new jobs)
  // Existing: Doctor, Surgeon, Nurse, Dentist, Pharmacist, Physical Therapist,
  //           Optometrist, Radiologist, Paramedic, Veterinarian, Phlebotomist
  // ================================================================
  { name: "Occupational Therapist", sub: "healthcare", desc: "A therapist who helps patients regain daily living skills after injury.", pop: 55, diff: 2, industry: ["healthcare"], workEnv: ["indoor", "hospital", "office"], education: ["master", "degree"], salary: ["medium", "high"], experience: ["mid"], physical: ["moderate"], tools: ["instruments"], skills: ["people-focused", "caregiving", "problem-solving", "manual-dexterity", "communication"] },
  { name: "Anesthesiologist", sub: "healthcare", desc: "A doctor who administers anesthesia and monitors patients during surgery.", pop: 60, diff: 4, industry: ["healthcare"], workEnv: ["indoor", "hospital"], education: ["doctorate", "degree"], salary: ["very-high"], experience: ["senior"], physical: ["sedentary"], tools: ["stethoscope", "instruments", "computer"], skills: ["analytical", "precise", "problem-solving", "high-stress", "life-or-death", "license-required"] },
  { name: "Pediatrician", sub: "healthcare", desc: "A doctor who specializes in treating children.", pop: 62, diff: 2, industry: ["healthcare"], workEnv: ["indoor", "hospital", "office"], education: ["doctorate", "degree"], salary: ["high", "very-high"], experience: ["senior"], physical: ["sedentary"], tools: ["stethoscope", "instruments"], skills: ["people-focused", "caregiving", "works-with-children", "communication", "license-required", "problem-solving"] },
  { name: "Gynecologist", sub: "healthcare", desc: "A doctor who specializes in women's reproductive health.", pop: 58, diff: 3, industry: ["healthcare"], workEnv: ["indoor", "hospital", "office"], education: ["doctorate", "degree"], salary: ["very-high"], experience: ["senior"], physical: ["sedentary"], tools: ["stethoscope", "instruments"], skills: ["people-focused", "caregiving", "communication", "license-required", "problem-solving", "precise"] },
  { name: "Cardiologist", sub: "healthcare", desc: "A doctor who specializes in heart and cardiovascular conditions.", pop: 58, diff: 4, industry: ["healthcare"], workEnv: ["indoor", "hospital", "office"], education: ["doctorate", "degree"], salary: ["very-high"], experience: ["senior"], physical: ["sedentary"], tools: ["stethoscope", "instruments", "computer"], skills: ["analytical", "problem-solving", "precise", "life-or-death", "license-required", "people-focused"] },
  { name: "Neurologist", sub: "healthcare", desc: "A doctor who specializes in the nervous system and brain disorders.", pop: 55, diff: 4, industry: ["healthcare"], workEnv: ["indoor", "hospital", "office"], education: ["doctorate", "degree"], salary: ["very-high"], experience: ["senior"], physical: ["sedentary"], tools: ["stethoscope", "instruments", "computer"], skills: ["analytical", "problem-solving", "precise", "research", "license-required", "people-focused"] },
  { name: "Psychiatrist", sub: "healthcare", desc: "A doctor who diagnoses and treats mental health conditions.", pop: 58, diff: 3, industry: ["healthcare"], workEnv: ["indoor", "hospital", "office"], education: ["doctorate", "degree"], salary: ["very-high"], experience: ["senior"], physical: ["sedentary"], tools: ["computer"], skills: ["people-focused", "caregiving", "analytical", "communication", "license-required", "problem-solving"] },
  { name: "Psychologist", sub: "healthcare", desc: "A professional who studies and treats mental processes and behavior.", pop: 62, diff: 2, industry: ["healthcare", "science"], workEnv: ["indoor", "office"], education: ["doctorate", "degree"], salary: ["high"], experience: ["senior"], physical: ["sedentary"], tools: ["computer"], skills: ["people-focused", "caregiving", "analytical", "communication", "research", "problem-solving"] },
  { name: "Counselor", sub: "healthcare", desc: "A professional who provides guidance for mental and emotional issues.", pop: 58, diff: 2, industry: ["healthcare", "education"], workEnv: ["indoor", "office", "school"], education: ["master", "degree"], salary: ["medium"], experience: ["mid"], physical: ["sedentary"], tools: ["computer"], skills: ["people-focused", "caregiving", "communication", "problem-solving", "empathy"] },
  { name: "Medical Researcher", sub: "healthcare", desc: "A scientist who studies diseases and develops new treatments.", pop: 52, diff: 4, industry: ["healthcare", "science"], workEnv: ["indoor", "lab"], education: ["doctorate", "degree"], salary: ["high"], experience: ["senior"], physical: ["sedentary"], tools: ["computer", "microscope", "instruments"], skills: ["analytical", "research", "problem-solving", "precise", "science"] },
  { name: "Lab Technician", sub: "healthcare", desc: "A technician who performs laboratory tests on samples.", pop: 50, diff: 2, industry: ["healthcare", "science"], workEnv: ["indoor", "lab"], education: ["associate", "bachelor", "degree"], salary: ["medium"], experience: ["entry", "mid"], physical: ["sedentary"], tools: ["microscope", "instruments", "computer"], skills: ["analytical", "precise", "problem-solving", "machine-focused", "team-work"] },
  { name: "Radiologic Technologist", sub: "healthcare", desc: "A technologist who operates imaging equipment like X-ray machines.", pop: 50, diff: 2, industry: ["healthcare"], workEnv: ["indoor", "hospital"], education: ["associate", "bachelor", "degree"], salary: ["medium"], experience: ["mid"], physical: ["moderate"], tools: ["instruments", "computer"], skills: ["analytical", "precise", "people-focused", "machine-focused", "license-required"] },
  { name: "Ultrasound Technician", sub: "healthcare", desc: "A technician who uses sound waves to create diagnostic images.", pop: 52, diff: 2, industry: ["healthcare"], workEnv: ["indoor", "hospital"], education: ["associate", "bachelor", "degree"], salary: ["medium", "high"], experience: ["mid"], physical: ["moderate"], tools: ["instruments", "computer"], skills: ["analytical", "precise", "people-focused", "machine-focused"] },
  { name: "EMT", sub: "healthcare", desc: "An Emergency Medical Technician who provides basic emergency care.", pop: 58, diff: 2, industry: ["healthcare"], workEnv: ["outdoor", "vehicle", "hospital"], education: ["certificate"], salary: ["low", "medium"], experience: ["entry", "mid"], physical: ["heavy"], tools: ["instruments"], skills: ["people-focused", "caregiving", "problem-solving", "high-stress", "life-or-death", "team-work"] },
  { name: "Midwife", sub: "healthcare", desc: "A professional who assists women during pregnancy, childbirth, and postpartum.", pop: 50, diff: 3, industry: ["healthcare"], workEnv: ["indoor", "hospital", "office"], education: ["master", "degree"], salary: ["medium", "high"], experience: ["mid", "senior"], physical: ["moderate"], tools: ["instruments", "stethoscope"], skills: ["people-focused", "caregiving", "communication", "problem-solving", "license-required"] },
  { name: "Dietitian", sub: "healthcare", desc: "A professional who advises on nutrition and healthy eating.", pop: 52, diff: 2, industry: ["healthcare"], workEnv: ["indoor", "hospital", "office"], education: ["bachelor", "degree"], salary: ["medium"], experience: ["mid"], physical: ["sedentary"], tools: ["computer"], skills: ["people-focused", "communication", "analytical", "problem-solving", "license-required"] },
  { name: "Nutritionist", sub: "healthcare", desc: "A professional who helps people improve their diet and health.", pop: 50, diff: 2, industry: ["healthcare"], workEnv: ["indoor", "office"], education: ["bachelor", "degree"], salary: ["medium"], experience: ["mid"], physical: ["sedentary"], tools: ["computer"], skills: ["people-focused", "communication", "analytical", "problem-solving"] },
  { name: "Audiologist", sub: "healthcare", desc: "A doctor who diagnoses and treats hearing and balance disorders.", pop: 45, diff: 3, industry: ["healthcare"], workEnv: ["indoor", "office", "hospital"], education: ["doctorate", "degree"], salary: ["high"], experience: ["senior"], physical: ["sedentary"], tools: ["instruments", "computer"], skills: ["people-focused", "analytical", "precise", "communication", "license-required"] },
  { name: "Speech Therapist", sub: "healthcare", desc: "A therapist who helps patients with speech and communication disorders.", pop: 52, diff: 2, industry: ["healthcare", "education"], workEnv: ["indoor", "office", "school", "hospital"], education: ["master", "degree"], salary: ["medium", "high"], experience: ["mid"], physical: ["sedentary"], tools: ["computer", "instruments"], skills: ["people-focused", "communication", "caregiving", "problem-solving", "works-with-children"] },
  { name: "Chiropractor", sub: "healthcare", desc: "A professional who treats musculoskeletal issues through spinal adjustments.", pop: 50, diff: 2, industry: ["healthcare"], workEnv: ["indoor", "office"], education: ["doctorate", "degree"], salary: ["medium", "high"], experience: ["mid", "senior"], physical: ["moderate"], tools: ["instruments"], skills: ["people-focused", "caregiving", "manual-dexterity", "problem-solving", "license-required"] },
  { name: "Veterinary Technician", sub: "healthcare", desc: "A technician who assists veterinarians with animal care.", pop: 48, diff: 2, industry: ["healthcare", "agriculture"], workEnv: ["indoor", "hospital"], education: ["associate", "bachelor", "degree"], salary: ["low", "medium"], experience: ["entry", "mid"], physical: ["moderate"], tools: ["instruments", "stethoscope"], skills: ["people-focused", "animal-care", "caregiving", "problem-solving", "manual-dexterity"] },
  { name: "Public Health Officer", sub: "healthcare", desc: "An official who manages community health programs and policies.", pop: 48, diff: 3, industry: ["healthcare", "government"], workEnv: ["indoor", "office"], education: ["master", "degree"], salary: ["high"], experience: ["senior"], physical: ["sedentary"], tools: ["computer"], skills: ["analytical", "leadership", "communication", "problem-solving", "public-speaking", "team-work"] },
  { name: "Epidemiologist", sub: "healthcare", desc: "A scientist who studies the spread of diseases in populations.", pop: 52, diff: 4, industry: ["healthcare", "science", "government"], workEnv: ["indoor", "office", "lab"], education: ["master", "doctorate", "degree"], salary: ["high"], experience: ["senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["analytical", "research", "problem-solving", "science", "communication"] },
  { name: "Biostatistician", sub: "healthcare", desc: "A statistician who applies statistics to biological and health data.", pop: 42, diff: 4, industry: ["healthcare", "science"], workEnv: ["indoor", "office", "lab"], education: ["master", "doctorate", "degree"], salary: ["high"], experience: ["senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["analytical", "research", "math", "problem-solving", "science"] },
  { name: "Geneticist", sub: "healthcare", desc: "A scientist who studies genes and heredity.", pop: 45, diff: 5, industry: ["healthcare", "science"], workEnv: ["indoor", "lab"], education: ["doctorate", "degree"], salary: ["high"], experience: ["senior"], physical: ["sedentary"], tools: ["microscope", "computer", "instruments"], skills: ["analytical", "research", "precise", "science", "problem-solving"] },
  { name: "Microbiologist", sub: "healthcare", desc: "A scientist who studies microorganisms like bacteria and viruses.", pop: 48, diff: 4, industry: ["healthcare", "science"], workEnv: ["indoor", "lab"], education: ["doctorate", "degree"], salary: ["medium", "high"], experience: ["senior"], physical: ["sedentary"], tools: ["microscope", "computer", "instruments"], skills: ["analytical", "research", "precise", "science", "problem-solving", "dangerous"] },
  { name: "Biochemist", sub: "healthcare", desc: "A scientist who studies chemical processes in living organisms.", pop: 50, diff: 4, industry: ["healthcare", "science"], workEnv: ["indoor", "lab"], education: ["doctorate", "degree"], salary: ["high"], experience: ["senior"], physical: ["sedentary"], tools: ["microscope", "computer", "instruments"], skills: ["analytical", "research", "precise", "science", "problem-solving", "dangerous"] },
  { name: "Pathologist", sub: "healthcare", desc: "A doctor who diagnoses diseases by examining tissues and fluids.", pop: 50, diff: 5, industry: ["healthcare"], workEnv: ["indoor", "hospital", "lab"], education: ["doctorate", "degree"], salary: ["very-high"], experience: ["senior"], physical: ["sedentary"], tools: ["microscope", "computer", "instruments"], skills: ["analytical", "precise", "research", "science", "license-required", "problem-solving"] },
  { name: "Medical Biller", sub: "healthcare", desc: "A professional who processes healthcare claims and payments.", pop: 45, diff: 1, industry: ["healthcare", "business"], workEnv: ["indoor", "office"], education: ["certificate", "associate"], salary: ["low", "medium"], experience: ["entry", "mid"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["analytical", "precise", "organization", "problem-solving"] },
  { name: "Medical Coder", sub: "healthcare", desc: "A professional who translates medical procedures into billing codes.", pop: 45, diff: 2, industry: ["healthcare", "business"], workEnv: ["indoor", "office", "remote"], education: ["certificate", "associate"], salary: ["low", "medium"], experience: ["entry", "mid"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["analytical", "precise", "organization", "problem-solving"] },
  { name: "Hospital Administrator", sub: "healthcare", desc: "A manager who oversees hospital operations and staff.", pop: 52, diff: 3, industry: ["healthcare", "business"], workEnv: ["indoor", "hospital", "office"], education: ["master", "degree"], salary: ["high", "very-high"], experience: ["senior", "executive"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["leadership", "analytical", "problem-solving", "communication", "team-work", "public-speaking"] },
  { name: "Health Coach", sub: "healthcare", desc: "A coach who helps clients achieve wellness and lifestyle goals.", pop: 48, diff: 1, industry: ["healthcare", "hospitality"], workEnv: ["indoor", "office", "remote"], education: ["certificate", "bachelor"], salary: ["low", "medium"], experience: ["entry", "mid"], physical: ["light"], tools: ["computer", "phone"], skills: ["people-focused", "communication", "caregiving", "problem-solving", "empathy"] },
  { name: "Personal Trainer", sub: "healthcare", desc: "A trainer who designs fitness programs for individual clients.", pop: 58, diff: 1, industry: ["healthcare", "sports", "hospitality"], workEnv: ["indoor", "outdoor"], education: ["certificate"], salary: ["low", "medium"], experience: ["entry", "mid"], physical: ["heavy"], tools: ["instruments"], skills: ["people-focused", "communication", "caregiving", "physical", "problem-solving", "manual-dexterity"] },
  { name: "Yoga Instructor", sub: "healthcare", desc: "An instructor who guides students through yoga practice.", pop: 52, diff: 1, industry: ["healthcare", "sports", "arts"], workEnv: ["indoor", "outdoor", "studio"], education: ["certificate"], salary: ["low", "medium"], experience: ["entry", "mid"], physical: ["heavy"], tools: ["instruments"], skills: ["people-focused", "communication", "caregiving", "physical", "creative"] },
  { name: "Massage Therapist", sub: "healthcare", desc: "A therapist who manipulates muscles to relieve pain and stress.", pop: 50, diff: 1, industry: ["healthcare", "hospitality"], workEnv: ["indoor", "office", "studio"], education: ["certificate"], salary: ["low", "medium"], experience: ["entry", "mid"], physical: ["heavy"], tools: ["instruments"], skills: ["people-focused", "caregiving", "manual-dexterity", "communication", "physical"] },
  { name: "Acupuncturist", sub: "healthcare", desc: "A practitioner who inserts thin needles to treat pain and illness.", pop: 42, diff: 3, industry: ["healthcare"], workEnv: ["indoor", "office", "studio"], education: ["certificate", "master"], salary: ["medium"], experience: ["mid"], physical: ["light"], tools: ["instruments"], skills: ["people-focused", "caregiving", "manual-dexterity", "precise", "license-required"] },
  { name: "Dental Hygienist", sub: "healthcare", desc: "A professional who cleans teeth and educates patients on oral health.", pop: 55, diff: 2, industry: ["healthcare"], workEnv: ["indoor", "office"], education: ["associate", "degree"], salary: ["medium", "high"], experience: ["mid"], physical: ["moderate"], tools: ["instruments", "computer"], skills: ["people-focused", "caregiving", "precise", "manual-dexterity", "license-required"] },

  // ================================================================
  // BUSINESS & FINANCE (~44 new jobs)
  // Existing: Accountant, Actuary, Financial Advisor, Investment Banker,
  //           Loan Officer, HR Manager, Entrepreneur, Management Consultant,
  //           Real Estate Agent
  // ================================================================
  { name: "Financial Analyst", sub: "finance", desc: "An analyst who evaluates financial data to guide investment decisions.", pop: 58, diff: 2, industry: ["finance", "business"], workEnv: ["indoor", "office"], education: ["bachelor", "degree"], salary: ["high"], experience: ["mid"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["analytical", "problem-solving", "research", "math", "team-work"] },
  { name: "Wealth Manager", sub: "finance", desc: "A professional who manages portfolios for high-net-worth clients.", pop: 52, diff: 3, industry: ["finance", "business"], workEnv: ["indoor", "office"], education: ["bachelor", "degree"], salary: ["high", "very-high"], experience: ["senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["analytical", "people-focused", "client-facing", "communication", "problem-solving"] },
  { name: "Financial Planner", sub: "finance", desc: "A professional who creates personalized financial plans for clients.", pop: 55, diff: 2, industry: ["finance", "business"], workEnv: ["indoor", "office"], education: ["bachelor", "degree"], salary: ["high"], experience: ["mid", "senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["analytical", "people-focused", "client-facing", "communication", "problem-solving", "license-required"] },
  { name: "Auditor", sub: "finance", desc: "A professional who examines financial records for accuracy and compliance.", pop: 55, diff: 2, industry: ["finance", "business"], workEnv: ["indoor", "office"], education: ["bachelor", "degree"], salary: ["medium", "high"], experience: ["mid"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["analytical", "precise", "problem-solving", "team-work", "organization"] },
  { name: "Tax Consultant", sub: "finance", desc: "A professional who advises on tax planning and compliance.", pop: 52, diff: 2, industry: ["finance", "business"], workEnv: ["indoor", "office"], education: ["bachelor", "degree"], salary: ["high"], experience: ["mid", "senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["analytical", "precise", "problem-solving", "client-facing", "communication", "license-required"] },
  { name: "Bookkeeper", sub: "finance", desc: "A professional who records financial transactions for businesses.", pop: 50, diff: 1, industry: ["finance", "business"], workEnv: ["indoor", "office", "remote"], education: ["associate", "certificate"], salary: ["low", "medium"], experience: ["entry", "mid"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["analytical", "precise", "organization", "problem-solving"] },
  { name: "Payroll Specialist", sub: "finance", desc: "A specialist who processes employee pay and deductions.", pop: 45, diff: 1, industry: ["finance", "business"], workEnv: ["indoor", "office"], education: ["associate", "certificate"], salary: ["medium"], experience: ["entry", "mid"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["analytical", "precise", "organization", "team-work"] },
  { name: "Credit Analyst", sub: "finance", desc: "An analyst who evaluates the creditworthiness of loan applicants.", pop: 45, diff: 3, industry: ["finance", "business"], workEnv: ["indoor", "office"], education: ["bachelor", "degree"], salary: ["medium", "high"], experience: ["mid"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["analytical", "problem-solving", "research", "precise"] },
  { name: "Risk Manager", sub: "finance", desc: "A manager who identifies and mitigates financial risks.", pop: 48, diff: 3, industry: ["finance", "business"], workEnv: ["indoor", "office"], education: ["bachelor", "master", "degree"], salary: ["high", "very-high"], experience: ["senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["analytical", "problem-solving", "leadership", "communication", "team-work"] },
  { name: "Compliance Officer", sub: "finance", desc: "An officer who ensures a company follows laws and regulations.", pop: 48, diff: 3, industry: ["finance", "business", "legal"], workEnv: ["indoor", "office"], education: ["bachelor", "degree"], salary: ["high"], experience: ["mid", "senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["analytical", "precise", "problem-solving", "communication", "organization"] },
  { name: "Economist", sub: "finance", desc: "A professional who studies production, distribution, and consumption of goods.", pop: 52, diff: 4, industry: ["finance", "science", "government"], workEnv: ["indoor", "office"], education: ["master", "doctorate", "degree"], salary: ["high"], experience: ["senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["analytical", "research", "math", "problem-solving", "public-speaking"] },
  { name: "Statistician", sub: "finance", desc: "A professional who collects and interprets numerical data.", pop: 50, diff: 3, industry: ["finance", "science", "business"], workEnv: ["indoor", "office"], education: ["master", "degree"], salary: ["high"], experience: ["mid", "senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["analytical", "research", "math", "problem-solving", "precise"] },
  { name: "Marketing Manager", sub: "business", desc: "A manager who oversees marketing campaigns and strategies.", pop: 60, diff: 2, industry: ["business", "arts"], workEnv: ["indoor", "office"], education: ["bachelor", "degree"], salary: ["high", "very-high"], experience: ["senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["leadership", "creative", "analytical", "communication", "team-work", "public-speaking"] },
  { name: "Brand Manager", sub: "business", desc: "A manager who develops and maintains a brand's image.", pop: 52, diff: 3, industry: ["business", "arts"], workEnv: ["indoor", "office"], education: ["bachelor", "degree"], salary: ["high"], experience: ["senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["analytical", "creative", "communication", "leadership", "team-work"] },
  { name: "Content Strategist", sub: "business", desc: "A strategist who plans and oversees content creation.", pop: 50, diff: 2, industry: ["business", "arts"], workEnv: ["indoor", "office", "remote"], education: ["bachelor", "degree"], salary: ["medium", "high"], experience: ["mid"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["creative", "analytical", "writing", "communication", "problem-solving"] },
  { name: "SEO Specialist", sub: "business", desc: "A specialist who optimizes websites to rank higher in search results.", pop: 50, diff: 2, industry: ["business", "technology"], workEnv: ["indoor", "office", "remote"], education: ["bachelor", "certificate"], salary: ["medium", "high"], experience: ["mid"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["analytical", "creative", "problem-solving", "research", "coding"] },
  { name: "SEM Specialist", sub: "business", desc: "A specialist who manages paid search advertising campaigns.", pop: 45, diff: 2, industry: ["business", "technology"], workEnv: ["indoor", "office", "remote"], education: ["bachelor", "certificate"], salary: ["medium", "high"], experience: ["mid"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["analytical", "problem-solving", "research", "creative"] },
  { name: "Social Media Manager", sub: "business", desc: "A manager who runs a brand's social media presence.", pop: 55, diff: 2, industry: ["business", "arts"], workEnv: ["indoor", "office", "remote"], education: ["bachelor", "degree"], salary: ["medium", "high"], experience: ["mid"], physical: ["sedentary"], tools: ["computer", "software", "phone"], skills: ["creative", "communication", "analytical", "problem-solving", "team-work"] },
  { name: "Digital Marketing Specialist", sub: "business", desc: "A specialist who runs online marketing campaigns.", pop: 55, diff: 2, industry: ["business", "technology"], workEnv: ["indoor", "office", "remote"], education: ["bachelor", "degree"], salary: ["medium", "high"], experience: ["mid"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["analytical", "creative", "problem-solving", "communication", "research"] },
  { name: "Email Marketing Specialist", sub: "business", desc: "A specialist who creates and manages email campaigns.", pop: 45, diff: 2, industry: ["business"], workEnv: ["indoor", "office", "remote"], education: ["bachelor", "certificate"], salary: ["medium"], experience: ["mid"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["analytical", "creative", "writing", "problem-solving"] },
  { name: "Copywriter", sub: "business", desc: "A writer who creates persuasive text for advertising.", pop: 52, diff: 2, industry: ["business", "arts"], workEnv: ["indoor", "office", "remote"], education: ["bachelor", "degree"], salary: ["medium"], experience: ["mid"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["writing", "creative", "communication", "problem-solving", "analytical"] },
  { name: "PR Specialist", sub: "business", desc: "A specialist who manages public relations and media coverage.", pop: 50, diff: 2, industry: ["business", "arts"], workEnv: ["indoor", "office"], education: ["bachelor", "degree"], salary: ["medium", "high"], experience: ["mid"], physical: ["sedentary"], tools: ["computer", "software", "phone"], skills: ["communication", "public-speaking", "creative", "people-focused", "problem-solving"] },
  { name: "Communications Manager", sub: "business", desc: "A manager who oversees internal and external communications.", pop: 50, diff: 2, industry: ["business"], workEnv: ["indoor", "office"], education: ["bachelor", "degree"], salary: ["high"], experience: ["senior"], physical: ["sedentary"], tools: ["computer", "software", "phone"], skills: ["communication", "public-speaking", "leadership", "creative", "team-work"] },
  { name: "Sales Manager", sub: "business", desc: "A manager who leads a sales team and sets targets.", pop: 58, diff: 2, industry: ["business"], workEnv: ["indoor", "office"], education: ["bachelor", "degree"], salary: ["high", "very-high"], experience: ["senior"], physical: ["sedentary"], tools: ["computer", "software", "phone"], skills: ["leadership", "communication", "sales", "people-focused", "analytical", "team-work"] },
  { name: "Sales Representative", sub: "business", desc: "A representative who sells products or services to customers.", pop: 55, diff: 1, industry: ["business"], workEnv: ["indoor", "outdoor", "office"], education: ["highschool", "bachelor"], salary: ["medium", "high"], experience: ["entry", "mid"], physical: ["light"], tools: ["computer", "phone"], skills: ["sales", "communication", "people-focused", "persuasive", "problem-solving"] },
  { name: "Account Executive", sub: "business", desc: "An executive who manages client accounts and drives sales.", pop: 52, diff: 2, industry: ["business"], workEnv: ["indoor", "office"], education: ["bachelor", "degree"], salary: ["high"], experience: ["mid", "senior"], physical: ["sedentary"], tools: ["computer", "software", "phone"], skills: ["sales", "communication", "client-facing", "people-focused", "problem-solving"] },
  { name: "Business Development Manager", sub: "business", desc: "A manager who identifies growth opportunities and partnerships.", pop: 55, diff: 2, industry: ["business"], workEnv: ["indoor", "office"], education: ["bachelor", "degree"], salary: ["high", "very-high"], experience: ["senior"], physical: ["sedentary"], tools: ["computer", "software", "phone"], skills: ["sales", "leadership", "communication", "analytical", "problem-solving", "team-work"] },
  { name: "Client Relationship Manager", sub: "business", desc: "A manager who maintains and grows client relationships.", pop: 50, diff: 2, industry: ["business"], workEnv: ["indoor", "office"], education: ["bachelor", "degree"], salary: ["high"], experience: ["mid", "senior"], physical: ["sedentary"], tools: ["computer", "software", "phone"], skills: ["people-focused", "client-facing", "communication", "problem-solving", "team-work"] },
  { name: "Customer Success Manager", sub: "business", desc: "A manager who ensures clients get value from a product or service.", pop: 52, diff: 2, industry: ["business", "technology"], workEnv: ["indoor", "office", "remote"], education: ["bachelor", "degree"], salary: ["medium", "high"], experience: ["mid"], physical: ["sedentary"], tools: ["computer", "software", "phone"], skills: ["people-focused", "communication", "problem-solving", "client-facing", "team-work"] },
  { name: "Supply Chain Manager", sub: "business", desc: "A manager who oversees the flow of goods from suppliers to customers.", pop: 55, diff: 3, industry: ["business", "manufacturing", "transportation"], workEnv: ["indoor", "office", "warehouse"], education: ["bachelor", "degree"], salary: ["high"], experience: ["senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["analytical", "leadership", "problem-solving", "organization", "team-work"] },
  { name: "Logistics Coordinator", sub: "business", desc: "A coordinator who manages the movement of goods and materials.", pop: 50, diff: 2, industry: ["business", "transportation"], workEnv: ["indoor", "office", "warehouse"], education: ["associate", "bachelor", "degree"], salary: ["medium"], experience: ["entry", "mid"], physical: ["light"], tools: ["computer", "software"], skills: ["analytical", "organization", "problem-solving", "team-work", "communication"] },
  { name: "Operations Manager", sub: "business", desc: "A manager who oversees day-to-day business operations.", pop: 58, diff: 2, industry: ["business", "manufacturing"], workEnv: ["indoor", "office", "factory"], education: ["bachelor", "degree"], salary: ["high", "very-high"], experience: ["senior"], physical: ["light"], tools: ["computer", "software"], skills: ["leadership", "analytical", "problem-solving", "organization", "team-work", "communication"] },
  { name: "Project Manager", sub: "business", desc: "A manager who plans and executes projects from start to finish.", pop: 62, diff: 2, industry: ["business", "technology", "construction"], workEnv: ["indoor", "office"], education: ["bachelor", "degree"], salary: ["high"], experience: ["mid", "senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["leadership", "organization", "analytical", "problem-solving", "communication", "team-work"] },
  { name: "Program Manager", sub: "business", desc: "A manager who oversees multiple related projects.", pop: 55, diff: 3, industry: ["business", "technology"], workEnv: ["indoor", "office"], education: ["bachelor", "degree"], salary: ["high", "very-high"], experience: ["senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["leadership", "organization", "analytical", "problem-solving", "communication", "team-work"] },
  { name: "Portfolio Manager", sub: "finance", desc: "A manager who oversees investment portfolios for clients.", pop: 52, diff: 4, industry: ["finance", "business"], workEnv: ["indoor", "office"], education: ["bachelor", "master", "degree"], salary: ["very-high"], experience: ["senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["analytical", "problem-solving", "client-facing", "communication", "license-required", "high-stress"] },
  { name: "Procurement Specialist", sub: "business", desc: "A specialist who purchases goods and services for an organization.", pop: 48, diff: 2, industry: ["business", "manufacturing"], workEnv: ["indoor", "office"], education: ["bachelor", "degree"], salary: ["medium", "high"], experience: ["mid"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["analytical", "negotiating", "problem-solving", "organization", "team-work"] },
  { name: "Recruiter", sub: "business", desc: "A professional who finds and hires candidates for job openings.", pop: 55, diff: 2, industry: ["business"], workEnv: ["indoor", "office", "remote"], education: ["bachelor", "degree"], salary: ["medium", "high"], experience: ["mid"], physical: ["sedentary"], tools: ["computer", "software", "phone"], skills: ["people-focused", "communication", "sales", "analytical", "problem-solving"] },
  { name: "Talent Acquisition Specialist", sub: "business", desc: "A specialist who sources and recruits top talent.", pop: 50, diff: 2, industry: ["business"], workEnv: ["indoor", "office", "remote"], education: ["bachelor", "degree"], salary: ["medium", "high"], experience: ["mid"], physical: ["sedentary"], tools: ["computer", "software", "phone"], skills: ["people-focused", "communication", "sales", "analytical", "problem-solving"] },
  { name: "Training Manager", sub: "business", desc: "A manager who develops and oversees employee training programs.", pop: 48, diff: 2, industry: ["business", "education"], workEnv: ["indoor", "office"], education: ["bachelor", "degree"], salary: ["high"], experience: ["senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["leadership", "communication", "people-focused", "problem-solving", "team-work"] },
  { name: "Compensation Analyst", sub: "business", desc: "An analyst who designs and evaluates employee pay structures.", pop: 42, diff: 3, industry: ["business", "finance"], workEnv: ["indoor", "office"], education: ["bachelor", "degree"], salary: ["medium", "high"], experience: ["mid"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["analytical", "precise", "problem-solving", "organization", "team-work"] },
  { name: "Benefits Specialist", sub: "business", desc: "A specialist who manages employee benefits programs.", pop: 42, diff: 2, industry: ["business"], workEnv: ["indoor", "office"], education: ["bachelor", "degree"], salary: ["medium"], experience: ["mid"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["analytical", "people-focused", "organization", "problem-solving", "communication"] },
  { name: "Employee Relations Manager", sub: "business", desc: "A manager who handles workplace conflicts and employee issues.", pop: 45, diff: 3, industry: ["business", "legal"], workEnv: ["indoor", "office"], education: ["bachelor", "degree"], salary: ["high"], experience: ["senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["people-focused", "communication", "problem-solving", "leadership", "team-work"] },
  { name: "Diversity Officer", sub: "business", desc: "An officer who promotes diversity and inclusion in the workplace.", pop: 42, diff: 3, industry: ["business", "government"], workEnv: ["indoor", "office"], education: ["bachelor", "master", "degree"], salary: ["high"], experience: ["senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["people-focused", "communication", "leadership", "analytical", "problem-solving", "public-speaking"] },
  { name: "Executive Assistant", sub: "business", desc: "An assistant who supports high-level executives.", pop: 52, diff: 2, industry: ["business"], workEnv: ["indoor", "office"], education: ["associate", "bachelor", "degree"], salary: ["medium", "high"], experience: ["mid", "senior"], physical: ["sedentary"], tools: ["computer", "software", "phone"], skills: ["organization", "communication", "people-focused", "problem-solving", "team-work"] },
  { name: "Administrative Assistant", sub: "business", desc: "An assistant who handles clerical and administrative tasks.", pop: 55, diff: 1, industry: ["business"], workEnv: ["indoor", "office"], education: ["highschool", "associate"], salary: ["low", "medium"], experience: ["entry", "mid"], physical: ["sedentary"], tools: ["computer", "software", "phone"], skills: ["organization", "communication", "people-focused", "problem-solving"] },

  // ================================================================
  // ENGINEERING & MANUFACTURING (~37 new jobs)
  // Existing: Civil Engineer, Industrial Engineer, Architect, Welder,
  //           Mechanic, Crane Operator, Factory Worker, Quality Inspector
  // ================================================================
  { name: "Mechanical Engineer", sub: "construction", desc: "An engineer who designs machines and mechanical systems.", pop: 58, diff: 3, industry: ["manufacturing", "construction", "science"], workEnv: ["indoor", "office", "factory"], education: ["bachelor", "degree"], salary: ["high"], experience: ["mid", "senior"], physical: ["sedentary"], tools: ["computer", "software", "instruments"], skills: ["analytical", "problem-solving", "machine-focused", "creative", "team-work", "license-required"] },
  { name: "Electrical Engineer", sub: "construction", desc: "An engineer who designs electrical systems and equipment.", pop: 55, diff: 3, industry: ["manufacturing", "construction", "technology"], workEnv: ["indoor", "office", "factory"], education: ["bachelor", "degree"], salary: ["high"], experience: ["mid", "senior"], physical: ["sedentary"], tools: ["computer", "software", "instruments"], skills: ["analytical", "problem-solving", "machine-focused", "creative", "team-work", "license-required"] },
  { name: "Chemical Engineer", sub: "construction", desc: "An engineer who designs processes for producing chemicals and materials.", pop: 50, diff: 4, industry: ["manufacturing", "science"], workEnv: ["indoor", "factory", "lab"], education: ["bachelor", "degree"], salary: ["high"], experience: ["mid", "senior"], physical: ["sedentary"], tools: ["computer", "software", "instruments"], skills: ["analytical", "problem-solving", "research", "science", "dangerous", "team-work"] },
  { name: "Aerospace Engineer", sub: "construction", desc: "An engineer who designs aircraft and spacecraft.", pop: 52, diff: 4, industry: ["manufacturing", "transportation", "science"], workEnv: ["indoor", "office", "factory"], education: ["bachelor", "degree"], salary: ["high", "very-high"], experience: ["senior"], physical: ["sedentary"], tools: ["computer", "software", "instruments"], skills: ["analytical", "problem-solving", "research", "machine-focused", "team-work", "license-required"] },
  { name: "Biomedical Engineer", sub: "construction", desc: "An engineer who designs medical equipment and devices.", pop: 48, diff: 4, industry: ["manufacturing", "healthcare", "science"], workEnv: ["indoor", "lab", "office"], education: ["bachelor", "degree"], salary: ["high"], experience: ["mid", "senior"], physical: ["sedentary"], tools: ["computer", "software", "instruments"], skills: ["analytical", "problem-solving", "research", "machine-focused", "team-work"] },
  { name: "Environmental Engineer", sub: "construction", desc: "An engineer who designs solutions to environmental problems.", pop: 50, diff: 3, industry: ["manufacturing", "science", "government"], workEnv: ["indoor", "outdoor", "office"], education: ["bachelor", "degree"], salary: ["high"], experience: ["mid", "senior"], physical: ["light"], tools: ["computer", "software", "instruments"], skills: ["analytical", "problem-solving", "research", "science", "team-work"] },
  { name: "Materials Engineer", sub: "construction", desc: "An engineer who develops and tests new materials.", pop: 45, diff: 4, industry: ["manufacturing", "science"], workEnv: ["indoor", "lab", "factory"], education: ["bachelor", "degree"], salary: ["high"], experience: ["mid", "senior"], physical: ["sedentary"], tools: ["computer", "software", "microscope", "instruments"], skills: ["analytical", "research", "problem-solving", "science", "precise"] },
  { name: "Structural Engineer", sub: "construction", desc: "An engineer who designs buildings and structures to withstand forces.", pop: 50, diff: 3, industry: ["construction"], workEnv: ["indoor", "outdoor", "office"], education: ["bachelor", "degree"], salary: ["high"], experience: ["mid", "senior"], physical: ["light"], tools: ["computer", "software", "instruments"], skills: ["analytical", "problem-solving", "machine-focused", "team-work", "license-required"] },
  { name: "Geotechnical Engineer", sub: "construction", desc: "An engineer who studies soil and rock for construction projects.", pop: 42, diff: 4, industry: ["construction", "science"], workEnv: ["indoor", "outdoor", "office"], education: ["bachelor", "master", "degree"], salary: ["high"], experience: ["mid", "senior"], physical: ["light"], tools: ["computer", "software", "instruments"], skills: ["analytical", "research", "problem-solving", "science", "team-work"] },
  { name: "Mining Engineer", sub: "construction", desc: "An engineer who designs mines and extraction operations.", pop: 40, diff: 4, industry: ["manufacturing", "construction"], workEnv: ["outdoor", "indoor", "office"], education: ["bachelor", "degree"], salary: ["high", "very-high"], experience: ["senior"], physical: ["moderate"], tools: ["computer", "software", "machinery"], skills: ["analytical", "problem-solving", "machine-focused", "dangerous", "team-work", "license-required"] },
  { name: "Petroleum Engineer", sub: "construction", desc: "An engineer who designs methods for extracting oil and gas.", pop: 45, diff: 4, industry: ["manufacturing", "science"], workEnv: ["outdoor", "indoor", "office"], education: ["bachelor", "degree"], salary: ["very-high"], experience: ["senior"], physical: ["moderate"], tools: ["computer", "software", "machinery"], skills: ["analytical", "problem-solving", "machine-focused", "dangerous", "team-work"] },
  { name: "Nuclear Engineer", sub: "construction", desc: "An engineer who designs nuclear power systems and equipment.", pop: 38, diff: 5, industry: ["manufacturing", "science"], workEnv: ["indoor", "factory", "office"], education: ["bachelor", "master", "degree"], salary: ["very-high"], experience: ["senior"], physical: ["sedentary"], tools: ["computer", "software", "instruments"], skills: ["analytical", "problem-solving", "research", "science", "precise", "dangerous"] },
  { name: "Marine Engineer", sub: "construction", desc: "An engineer who designs ships and offshore structures.", pop: 42, diff: 4, industry: ["manufacturing", "transportation"], workEnv: ["indoor", "outdoor", "office"], education: ["bachelor", "degree"], salary: ["high"], experience: ["senior"], physical: ["light"], tools: ["computer", "software", "instruments"], skills: ["analytical", "problem-solving", "machine-focused", "team-work", "license-required"] },
  { name: "Automotive Engineer", sub: "construction", desc: "An engineer who designs vehicles and automotive systems.", pop: 50, diff: 3, industry: ["manufacturing"], workEnv: ["indoor", "factory", "office"], education: ["bachelor", "degree"], salary: ["high"], experience: ["mid", "senior"], physical: ["sedentary"], tools: ["computer", "software", "instruments"], skills: ["analytical", "problem-solving", "machine-focused", "creative", "team-work"] },
  { name: "Robotics Engineer", sub: "construction", desc: "An engineer who designs and builds robots.", pop: 50, diff: 4, industry: ["manufacturing", "technology"], workEnv: ["indoor", "factory", "lab"], education: ["bachelor", "master", "degree"], salary: ["high"], experience: ["mid", "senior"], physical: ["sedentary"], tools: ["computer", "software", "instruments"], skills: ["coding", "analytical", "problem-solving", "machine-focused", "creative", "research"] },
  { name: "Mechatronics Engineer", sub: "construction", desc: "An engineer who combines mechanical, electrical, and software engineering.", pop: 40, diff: 5, industry: ["manufacturing", "technology"], workEnv: ["indoor", "factory", "lab"], education: ["bachelor", "master", "degree"], salary: ["high"], experience: ["mid", "senior"], physical: ["sedentary"], tools: ["computer", "software", "instruments"], skills: ["coding", "analytical", "problem-solving", "machine-focused", "creative"] },
  { name: "Process Engineer", sub: "manufacturing", desc: "An engineer who optimizes industrial manufacturing processes.", pop: 48, diff: 3, industry: ["manufacturing"], workEnv: ["indoor", "factory", "office"], education: ["bachelor", "degree"], salary: ["high"], experience: ["mid", "senior"], physical: ["light"], tools: ["computer", "software", "instruments"], skills: ["analytical", "problem-solving", "machine-focused", "team-work", "research"] },
  { name: "Quality Engineer", sub: "manufacturing", desc: "An engineer who ensures products meet quality standards.", pop: 48, diff: 3, industry: ["manufacturing"], workEnv: ["indoor", "factory"], education: ["bachelor", "degree"], salary: ["medium", "high"], experience: ["mid"], physical: ["light"], tools: ["computer", "software", "instruments"], skills: ["analytical", "precise", "problem-solving", "team-work", "organization"] },
  { name: "Manufacturing Engineer", sub: "manufacturing", desc: "An engineer who designs and improves manufacturing systems.", pop: 50, diff: 3, industry: ["manufacturing"], workEnv: ["indoor", "factory"], education: ["bachelor", "degree"], salary: ["high"], experience: ["mid", "senior"], physical: ["light"], tools: ["computer", "software", "machinery"], skills: ["analytical", "problem-solving", "machine-focused", "team-work", "creative"] },
  { name: "Production Manager", sub: "manufacturing", desc: "A manager who oversees manufacturing production operations.", pop: 52, diff: 3, industry: ["manufacturing"], workEnv: ["indoor", "factory"], education: ["bachelor", "degree"], salary: ["high", "very-high"], experience: ["senior"], physical: ["light"], tools: ["computer", "software"], skills: ["leadership", "analytical", "problem-solving", "organization", "team-work"] },
  { name: "Plant Manager", sub: "manufacturing", desc: "A manager who runs a manufacturing facility.", pop: 50, diff: 3, industry: ["manufacturing"], workEnv: ["indoor", "factory"], education: ["bachelor", "degree"], salary: ["very-high"], experience: ["executive"], physical: ["light"], tools: ["computer", "software"], skills: ["leadership", "analytical", "problem-solving", "organization", "team-work", "communication"] },
  { name: "Warehouse Manager", sub: "manufacturing", desc: "A manager who oversees warehouse operations and inventory.", pop: 50, diff: 2, industry: ["manufacturing", "transportation"], workEnv: ["indoor", "warehouse"], education: ["associate", "bachelor", "degree"], salary: ["medium", "high"], experience: ["senior"], physical: ["moderate"], tools: ["computer", "software"], skills: ["leadership", "organization", "problem-solving", "team-work", "analytical"] },
  { name: "Supply Chain Analyst", sub: "manufacturing", desc: "An analyst who optimizes supply chain operations.", pop: 48, diff: 3, industry: ["manufacturing", "business"], workEnv: ["indoor", "office", "warehouse"], education: ["bachelor", "degree"], salary: ["medium", "high"], experience: ["mid"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["analytical", "problem-solving", "research", "organization", "team-work"] },
  { name: "Logistics Manager", sub: "transportation", desc: "A manager who coordinates transportation and distribution.", pop: 52, diff: 2, industry: ["transportation", "business"], workEnv: ["indoor", "office", "warehouse"], education: ["bachelor", "degree"], salary: ["high"], experience: ["senior"], physical: ["light"], tools: ["computer", "software"], skills: ["leadership", "analytical", "problem-solving", "organization", "team-work"] },
  { name: "Purchasing Manager", sub: "manufacturing", desc: "A manager who oversees buying of goods and services.", pop: 48, diff: 3, industry: ["manufacturing", "business"], workEnv: ["indoor", "office"], education: ["bachelor", "degree"], salary: ["high"], experience: ["senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["analytical", "negotiating", "leadership", "problem-solving", "team-work"] },
  { name: "Inventory Specialist", sub: "manufacturing", desc: "A specialist who tracks and manages inventory levels.", pop: 45, diff: 2, industry: ["manufacturing", "business"], workEnv: ["indoor", "warehouse"], education: ["highschool", "associate"], salary: ["low", "medium"], experience: ["entry", "mid"], physical: ["moderate"], tools: ["computer", "software"], skills: ["organization", "analytical", "precise", "problem-solving"] },
  { name: "Operations Analyst", sub: "manufacturing", desc: "An analyst who improves business operations efficiency.", pop: 48, diff: 3, industry: ["manufacturing", "business"], workEnv: ["indoor", "office"], education: ["bachelor", "degree"], salary: ["medium", "high"], experience: ["mid"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["analytical", "problem-solving", "research", "team-work", "communication"] },
  { name: "Maintenance Manager", sub: "manufacturing", desc: "A manager who oversees equipment maintenance and repairs.", pop: 48, diff: 2, industry: ["manufacturing", "construction"], workEnv: ["indoor", "factory", "outdoor"], education: ["associate", "bachelor", "degree"], salary: ["high"], experience: ["senior"], physical: ["moderate"], tools: ["tools", "machinery", "computer"], skills: ["leadership", "problem-solving", "machine-focused", "troubleshooting", "team-work"] },
  { name: "Facilities Manager", sub: "manufacturing", desc: "A manager who oversees building maintenance and operations.", pop: 48, diff: 2, industry: ["manufacturing", "business"], workEnv: ["indoor", "outdoor", "office"], education: ["bachelor", "degree"], salary: ["high"], experience: ["senior"], physical: ["light"], tools: ["computer", "software", "tools"], skills: ["leadership", "problem-solving", "organization", "team-work", "communication"] },
  { name: "Construction Manager", sub: "construction", desc: "A manager who oversees construction projects.", pop: 55, diff: 2, industry: ["construction"], workEnv: ["outdoor", "indoor", "office"], education: ["bachelor", "degree"], salary: ["high", "very-high"], experience: ["senior"], physical: ["moderate"], tools: ["computer", "software", "tools"], skills: ["leadership", "analytical", "problem-solving", "team-work", "communication", "license-required"] },
  { name: "Site Supervisor", sub: "construction", desc: "A supervisor who manages day-to-day construction site operations.", pop: 48, diff: 2, industry: ["construction"], workEnv: ["outdoor", "indoor"], education: ["highschool", "associate", "bachelor"], salary: ["medium", "high"], experience: ["mid", "senior"], physical: ["moderate"], tools: ["tools", "computer"], skills: ["leadership", "problem-solving", "team-work", "organization", "communication"] },
  { name: "Safety Officer", sub: "construction", desc: "An officer who ensures workplace safety compliance.", pop: 48, diff: 2, industry: ["construction", "manufacturing", "government"], workEnv: ["indoor", "outdoor", "factory"], education: ["bachelor", "certificate", "degree"], salary: ["medium", "high"], experience: ["mid", "senior"], physical: ["light"], tools: ["computer", "instruments"], skills: ["analytical", "precise", "problem-solving", "communication", "leadership", "team-work"] },
  { name: "Quality Control Inspector", sub: "manufacturing", desc: "An inspector who checks products for defects and compliance.", pop: 45, diff: 2, industry: ["manufacturing"], workEnv: ["indoor", "factory"], education: ["highschool", "certificate", "associate"], salary: ["medium"], experience: ["mid"], physical: ["light"], tools: ["instruments", "computer"], skills: ["analytical", "precise", "problem-solving", "organization", "team-work"] },
  { name: "CAD Designer", sub: "construction", desc: "A designer who creates technical drawings using CAD software.", pop: 48, diff: 2, industry: ["construction", "manufacturing", "arts"], workEnv: ["indoor", "office"], education: ["associate", "bachelor", "degree"], salary: ["medium", "high"], experience: ["mid"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["analytical", "creative", "precise", "problem-solving", "machine-focused"] },
  { name: "Drafter", sub: "construction", desc: "A professional who creates technical drawings and plans.", pop: 45, diff: 2, industry: ["construction", "manufacturing"], workEnv: ["indoor", "office"], education: ["associate", "degree"], salary: ["medium"], experience: ["mid"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["analytical", "precise", "creative", "problem-solving", "organization"] },
  { name: "Surveyor", sub: "construction", desc: "A professional who measures land and determines boundaries.", pop: 48, diff: 2, industry: ["construction", "government"], workEnv: ["outdoor", "indoor", "office"], education: ["bachelor", "degree"], salary: ["medium", "high"], experience: ["mid", "senior"], physical: ["moderate"], tools: ["instruments", "computer"], skills: ["analytical", "precise", "problem-solving", "team-work", "license-required"] },
  { name: "Estimator", sub: "construction", desc: "A professional who calculates the cost of construction projects.", pop: 45, diff: 3, industry: ["construction", "business"], workEnv: ["indoor", "office"], education: ["bachelor", "degree"], salary: ["medium", "high"], experience: ["mid", "senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["analytical", "precise", "problem-solving", "organization", "team-work"] },
  { name: "Project Engineer", sub: "construction", desc: "An engineer who manages technical aspects of engineering projects.", pop: 50, diff: 3, industry: ["construction", "manufacturing"], workEnv: ["indoor", "outdoor", "office"], education: ["bachelor", "degree"], salary: ["high"], experience: ["mid", "senior"], physical: ["light"], tools: ["computer", "software", "instruments"], skills: ["analytical", "leadership", "problem-solving", "team-work", "communication", "license-required"] },

  // ================================================================
  // EDUCATION & ACADEMIA (~25 new jobs)
  // Existing: Teacher, Professor, Tutor, Librarian, School Counselor
  // ================================================================
  { name: "Lecturer", sub: "education", desc: "An academic who teaches at a university.", pop: 52, diff: 2, industry: ["education"], workEnv: ["indoor", "school"], education: ["master", "doctorate", "degree"], salary: ["medium", "high"], experience: ["mid", "senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["public-speaking", "communication", "analytical", "research", "people-focused", "works-with-children"] },
  { name: "Instructor", sub: "education", desc: "A teacher who provides specialized instruction.", pop: 50, diff: 2, industry: ["education"], workEnv: ["indoor", "school"], education: ["bachelor", "degree"], salary: ["medium"], experience: ["mid"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["public-speaking", "communication", "people-focused", "problem-solving", "creative"] },
  { name: "Principal", sub: "education", desc: "A senior administrator who leads a school.", pop: 55, diff: 3, industry: ["education", "government"], workEnv: ["indoor", "school"], education: ["master", "degree"], salary: ["high", "very-high"], experience: ["executive"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["leadership", "communication", "public-speaking", "people-focused", "problem-solving", "team-work"] },
  { name: "Vice Principal", sub: "education", desc: "An administrator who assists in running a school.", pop: 45, diff: 2, industry: ["education", "government"], workEnv: ["indoor", "school"], education: ["master", "degree"], salary: ["high"], experience: ["senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["leadership", "communication", "people-focused", "problem-solving", "team-work"] },
  { name: "Educational Consultant", sub: "education", desc: "A consultant who advises on educational strategies and policies.", pop: 45, diff: 3, industry: ["education", "business"], workEnv: ["indoor", "office", "remote"], education: ["master", "degree"], salary: ["high"], experience: ["senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["analytical", "communication", "problem-solving", "public-speaking", "people-focused"] },
  { name: "Curriculum Developer", sub: "education", desc: "A professional who designs educational curricula and materials.", pop: 48, diff: 2, industry: ["education"], workEnv: ["indoor", "office", "remote"], education: ["master", "degree"], salary: ["medium", "high"], experience: ["mid", "senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["creative", "analytical", "writing", "problem-solving", "research"] },
  { name: "Instructional Designer", sub: "education", desc: "A designer who creates effective learning experiences.", pop: 48, diff: 2, industry: ["education", "technology"], workEnv: ["indoor", "office", "remote"], education: ["master", "degree"], salary: ["medium", "high"], experience: ["mid"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["creative", "analytical", "writing", "problem-solving", "communication"] },
  { name: "Archivist", sub: "education", desc: "A professional who preserves and organizes historical records.", pop: 42, diff: 3, industry: ["education", "government"], workEnv: ["indoor", "office"], education: ["master", "degree"], salary: ["medium"], experience: ["mid"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["analytical", "organization", "research", "precise", "problem-solving"] },
  { name: "Museum Curator", sub: "education", desc: "A curator who manages museum collections and exhibitions.", pop: 45, diff: 3, industry: ["education", "arts"], workEnv: ["indoor", "office"], education: ["master", "doctorate", "degree"], salary: ["medium", "high"], experience: ["senior"], physical: ["light"], tools: ["computer", "software", "instruments"], skills: ["analytical", "creative", "research", "communication", "public-speaking", "organization"] },
  { name: "Research Scientist", sub: "education", desc: "A scientist who conducts research in a specialized field.", pop: 55, diff: 4, industry: ["science", "education"], workEnv: ["indoor", "lab", "office"], education: ["doctorate", "degree"], salary: ["high"], experience: ["senior"], physical: ["sedentary"], tools: ["computer", "microscope", "instruments", "software"], skills: ["analytical", "research", "problem-solving", "science", "precise", "writing"] },
  { name: "Research Assistant", sub: "education", desc: "An assistant who supports scientific research projects.", pop: 48, diff: 2, industry: ["science", "education"], workEnv: ["indoor", "lab"], education: ["bachelor", "master", "degree"], salary: ["low", "medium"], experience: ["entry", "mid"], physical: ["sedentary"], tools: ["computer", "instruments", "software"], skills: ["analytical", "research", "precise", "problem-solving", "team-work"] },
  { name: "Lab Assistant", sub: "education", desc: "An assistant who helps with laboratory tasks and experiments.", pop: 45, diff: 1, industry: ["science", "education"], workEnv: ["indoor", "lab"], education: ["associate", "bachelor", "degree"], salary: ["low", "medium"], experience: ["entry"], physical: ["light"], tools: ["instruments", "computer", "microscope"], skills: ["analytical", "precise", "problem-solving", "team-work", "organization"] },
  { name: "Academic Advisor", sub: "education", desc: "An advisor who guides students on academic decisions.", pop: 48, diff: 2, industry: ["education"], workEnv: ["indoor", "school"], education: ["bachelor", "master", "degree"], salary: ["medium"], experience: ["mid"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["people-focused", "communication", "problem-solving", "works-with-children", "organization"] },
  { name: "Dean", sub: "education", desc: "A senior academic who leads a university faculty or division.", pop: 45, diff: 4, industry: ["education", "government"], workEnv: ["indoor", "school", "office"], education: ["doctorate", "degree"], salary: ["very-high"], experience: ["executive"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["leadership", "public-speaking", "analytical", "communication", "people-focused", "team-work"] },
  { name: "Registrar", sub: "education", desc: "An administrator who manages student records and enrollment.", pop: 42, diff: 2, industry: ["education"], workEnv: ["indoor", "school", "office"], education: ["bachelor", "master", "degree"], salary: ["medium", "high"], experience: ["mid", "senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["organization", "analytical", "precise", "people-focused", "problem-solving"] },
  { name: "Admissions Officer", sub: "education", desc: "An officer who evaluates and selects applicants for schools.", pop: 42, diff: 2, industry: ["education"], workEnv: ["indoor", "school", "office"], education: ["bachelor", "degree"], salary: ["medium"], experience: ["mid"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["analytical", "people-focused", "communication", "problem-solving", "organization"] },
  { name: "Financial Aid Officer", sub: "education", desc: "An officer who administers financial aid programs.", pop: 40, diff: 2, industry: ["education", "finance"], workEnv: ["indoor", "school", "office"], education: ["bachelor", "degree"], salary: ["medium"], experience: ["mid"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["analytical", "people-focused", "communication", "problem-solving", "organization"] },
  { name: "Sports Coach", sub: "education", desc: "A coach who trains athletes and teams.", pop: 55, diff: 2, industry: ["education", "arts"], workEnv: ["indoor", "outdoor", "school"], education: ["bachelor", "degree"], salary: ["medium", "high"], experience: ["mid", "senior"], physical: ["heavy"], tools: ["instruments", "computer"], skills: ["leadership", "communication", "people-focused", "physical", "problem-solving", "team-work"] },
  { name: "Music Teacher", sub: "education", desc: "A teacher who instructs students in music.", pop: 50, diff: 2, industry: ["education", "arts"], workEnv: ["indoor", "school"], education: ["bachelor", "degree"], salary: ["medium"], experience: ["mid"], physical: ["light"], tools: ["instruments", "computer"], skills: ["creative", "communication", "people-focused", "works-with-children", "public-speaking"] },
  { name: "Art Teacher", sub: "education", desc: "A teacher who instructs students in visual arts.", pop: 50, diff: 2, industry: ["education", "arts"], workEnv: ["indoor", "school"], education: ["bachelor", "degree"], salary: ["medium"], experience: ["mid"], physical: ["light"], tools: ["instruments", "computer"], skills: ["creative", "communication", "people-focused", "works-with-children", "problem-solving"] },
  { name: "Language Teacher", sub: "education", desc: "A teacher who instructs students in foreign languages.", pop: 50, diff: 2, industry: ["education"], workEnv: ["indoor", "school"], education: ["bachelor", "degree"], salary: ["medium"], experience: ["mid"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["communication", "people-focused", "public-speaking", "works-with-children", "creative"] },
  { name: "ESL Teacher", sub: "education", desc: "A teacher who instructs non-native speakers in English.", pop: 52, diff: 2, industry: ["education"], workEnv: ["indoor", "school"], education: ["bachelor", "degree"], salary: ["medium"], experience: ["mid"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["communication", "people-focused", "public-speaking", "creative", "problem-solving"] },
  { name: "Special Education Teacher", sub: "education", desc: "A teacher who works with students with special needs.", pop: 52, diff: 3, industry: ["education", "healthcare"], workEnv: ["indoor", "school"], education: ["bachelor", "degree"], salary: ["medium", "high"], experience: ["mid"], physical: ["moderate"], tools: ["computer", "software"], skills: ["people-focused", "caregiving", "communication", "problem-solving", "works-with-children", "empathy"] },
  { name: "Early Childhood Educator", sub: "education", desc: "A teacher who works with young children.", pop: 52, diff: 2, industry: ["education"], workEnv: ["indoor", "school"], education: ["associate", "bachelor", "degree"], salary: ["low", "medium"], experience: ["mid"], physical: ["moderate"], tools: ["computer", "instruments"], skills: ["people-focused", "caregiving", "communication", "works-with-children", "creative", "empathy"] },
  { name: "Daycare Provider", sub: "education", desc: "A provider who cares for children in a daycare setting.", pop: 48, diff: 1, industry: ["education", "healthcare"], workEnv: ["indoor", "school"], education: ["certificate", "associate"], salary: ["low", "medium"], experience: ["entry", "mid"], physical: ["moderate"], tools: ["instruments"], skills: ["people-focused", "caregiving", "communication", "works-with-children", "empathy"] },

  // ================================================================
  // CREATIVE & ARTS (~24 new jobs)
  // Existing: Graphic Designer, Animator, Photographer, Fashion Designer,
  //           Musician, Actor, Writer, Chef, Bartender, Stunt Double,
  //           Sommelier, Painter
  // ================================================================
  { name: "Illustrator", sub: "arts-media", desc: "An artist who creates drawings for books, media, and products.", pop: 50, diff: 2, industry: ["arts"], workEnv: ["indoor", "studio", "office", "remote"], education: ["bachelor", "degree"], salary: ["medium"], experience: ["mid"], physical: ["sedentary"], tools: ["computer", "software", "instruments"], skills: ["creative", "analytical", "problem-solving", "team-work", "manual-dexterity"] },
  { name: "3D Artist", sub: "arts-media", desc: "An artist who creates three-dimensional models and animations.", pop: 48, diff: 3, industry: ["arts", "technology"], workEnv: ["indoor", "studio", "office", "remote"], education: ["bachelor", "degree"], salary: ["medium", "high"], experience: ["mid"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["creative", "analytical", "problem-solving", "team-work"] },
  { name: "Motion Graphics Designer", sub: "arts-media", desc: "A designer who creates animated graphics for media.", pop: 48, diff: 3, industry: ["arts", "technology"], workEnv: ["indoor", "studio", "office", "remote"], education: ["bachelor", "degree"], salary: ["medium", "high"], experience: ["mid"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["creative", "analytical", "problem-solving", "team-work"] },
  { name: "Video Editor", sub: "arts-media", desc: "An editor who assembles raw footage into finished videos.", pop: 55, diff: 2, industry: ["arts", "technology"], workEnv: ["indoor", "studio", "office", "remote"], education: ["bachelor", "certificate", "degree"], salary: ["medium", "high"], experience: ["mid"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["creative", "analytical", "problem-solving", "team-work", "precise"] },
  { name: "Film Director", sub: "arts-media", desc: "A director who oversees the creative vision of a film.", pop: 60, diff: 3, industry: ["arts"], workEnv: ["indoor", "outdoor", "studio"], education: ["bachelor", "degree"], salary: ["high", "very-high"], experience: ["senior", "executive"], physical: ["light"], tools: ["computer", "software", "instruments"], skills: ["leadership", "creative", "communication", "public-speaking", "problem-solving", "team-work"] },
  { name: "Producer", sub: "arts-media", desc: "A producer who oversees the production of films, shows, or music.", pop: 55, diff: 3, industry: ["arts", "business"], workEnv: ["indoor", "outdoor", "studio", "office"], education: ["bachelor", "degree"], salary: ["high", "very-high"], experience: ["senior"], physical: ["light"], tools: ["computer", "software", "phone"], skills: ["leadership", "analytical", "communication", "problem-solving", "team-work", "creative"] },
  { name: "Screenwriter", sub: "arts-media", desc: "A writer who creates scripts for films and TV shows.", pop: 50, diff: 3, industry: ["arts"], workEnv: ["indoor", "office", "remote"], education: ["bachelor", "degree"], salary: ["medium", "high"], experience: ["mid", "senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["writing", "creative", "analytical", "problem-solving", "communication"] },
  { name: "Videographer", sub: "arts-media", desc: "A professional who records video for events and productions.", pop: 50, diff: 2, industry: ["arts"], workEnv: ["indoor", "outdoor", "studio"], education: ["associate", "bachelor", "degree"], salary: ["medium"], experience: ["mid"], physical: ["moderate"], tools: ["instruments", "computer", "software"], skills: ["creative", "analytical", "problem-solving", "team-work", "manual-dexterity"] },
  { name: "Audio Engineer", sub: "arts-media", desc: "An engineer who records and mixes sound for music and media.", pop: 48, diff: 3, industry: ["arts", "technology"], workEnv: ["indoor", "studio"], education: ["certificate", "associate", "bachelor", "degree"], salary: ["medium", "high"], experience: ["mid"], physical: ["sedentary"], tools: ["computer", "software", "instruments"], skills: ["analytical", "creative", "problem-solving", "precise", "team-work"] },
  { name: "Sound Designer", sub: "arts-media", desc: "A designer who creates audio elements for media productions.", pop: 45, diff: 3, industry: ["arts", "technology"], workEnv: ["indoor", "studio"], education: ["bachelor", "degree"], salary: ["medium", "high"], experience: ["mid", "senior"], physical: ["sedentary"], tools: ["computer", "software", "instruments"], skills: ["creative", "analytical", "problem-solving", "precise", "team-work"] },
  { name: "Music Producer", sub: "arts-media", desc: "A producer who oversees the recording and production of music.", pop: 55, diff: 3, industry: ["arts"], workEnv: ["indoor", "studio"], education: ["certificate", "bachelor", "degree"], salary: ["high"], experience: ["senior"], physical: ["sedentary"], tools: ["computer", "software", "instruments"], skills: ["creative", "analytical", "leadership", "communication", "problem-solving", "team-work"] },
  { name: "Singer", sub: "arts-media", desc: "A vocalist who performs music for audiences.", pop: 60, diff: 2, industry: ["arts"], workEnv: ["indoor", "outdoor", "studio"], education: ["no-degree", "certificate", "degree"], salary: ["variable"], experience: ["mid"], physical: ["moderate"], tools: ["instruments", "microphone"], skills: ["creative", "communication", "public-speaking", "performance", "team-work"] },
  { name: "Dancer", sub: "arts-media", desc: "A performer who uses movement to express art.", pop: 50, diff: 2, industry: ["arts"], workEnv: ["indoor", "outdoor", "studio"], education: ["no-degree", "certificate"], salary: ["low", "medium"], experience: ["mid"], physical: ["extreme"], tools: ["instruments"], skills: ["creative", "performance", "communication", "team-work", "physical"] },
  { name: "Choreographer", sub: "arts-media", desc: "A professional who creates and arranges dance routines.", pop: 45, diff: 3, industry: ["arts"], workEnv: ["indoor", "studio"], education: ["bachelor", "certificate", "degree"], salary: ["medium", "high"], experience: ["senior"], physical: ["heavy"], tools: ["computer", "instruments"], skills: ["creative", "leadership", "communication", "physical", "team-work", "performance"] },
  { name: "Art Director", sub: "arts-media", desc: "A director who oversees the visual style of a production.", pop: 50, diff: 3, industry: ["arts", "business"], workEnv: ["indoor", "studio", "office"], education: ["bachelor", "degree"], salary: ["high"], experience: ["senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["creative", "leadership", "analytical", "communication", "team-work", "problem-solving"] },
  { name: "Creative Director", sub: "arts-media", desc: "A director who leads the creative vision of a project or brand.", pop: 55, diff: 3, industry: ["arts", "business"], workEnv: ["indoor", "office", "studio"], education: ["bachelor", "degree"], salary: ["high", "very-high"], experience: ["senior", "executive"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["leadership", "creative", "analytical", "communication", "public-speaking", "team-work"] },
  { name: "Content Creator", sub: "arts-media", desc: "A creator who produces digital content for online platforms.", pop: 55, diff: 2, industry: ["arts", "technology"], workEnv: ["indoor", "outdoor", "remote"], education: ["highschool", "bachelor", "degree"], salary: ["variable"], experience: ["mid"], physical: ["light"], tools: ["computer", "software", "phone", "instruments"], skills: ["creative", "communication", "analytical", "problem-solving", "public-speaking"] },
  { name: "Social Media Influencer", sub: "arts-media", desc: "A personality who builds an audience on social media platforms.", pop: 55, diff: 2, industry: ["arts", "business"], workEnv: ["indoor", "outdoor", "remote"], education: ["highschool", "bachelor"], salary: ["variable"], experience: ["mid"], physical: ["light"], tools: ["computer", "phone", "software"], skills: ["creative", "communication", "people-focused", "public-speaking", "persuasive"] },
  { name: "Blogger", sub: "arts-media", desc: "A writer who publishes content on a blog.", pop: 48, diff: 1, industry: ["arts", "business"], workEnv: ["indoor", "remote"], education: ["highschool", "bachelor", "degree"], salary: ["variable"], experience: ["mid"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["writing", "creative", "communication", "analytical", "problem-solving"] },
  { name: "Podcaster", sub: "arts-media", desc: "A host who produces audio content for podcasts.", pop: 50, diff: 2, industry: ["arts", "technology"], workEnv: ["indoor", "studio", "remote"], education: ["highschool", "bachelor", "degree"], salary: ["variable"], experience: ["mid"], physical: ["sedentary"], tools: ["computer", "software", "microphone", "instruments"], skills: ["communication", "public-speaking", "creative", "analytical", "people-focused"] },
  { name: "YouTuber", sub: "arts-media", desc: "A creator who produces video content for YouTube.", pop: 58, diff: 2, industry: ["arts", "technology"], workEnv: ["indoor", "outdoor", "remote"], education: ["highschool", "bachelor"], salary: ["variable"], experience: ["mid"], physical: ["light"], tools: ["computer", "software", "phone", "instruments"], skills: ["creative", "communication", "public-speaking", "analytical", "problem-solving"] },
  { name: "Game Designer", sub: "arts-media", desc: "A designer who creates the rules and mechanics of games.", pop: 52, diff: 3, industry: ["arts", "technology"], workEnv: ["indoor", "office", "remote"], education: ["bachelor", "degree"], salary: ["medium", "high"], experience: ["mid", "senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["creative", "analytical", "problem-solving", "team-work", "writing"] },
  { name: "Level Designer", sub: "arts-media", desc: "A designer who creates the levels and environments of games.", pop: 42, diff: 3, industry: ["arts", "technology"], workEnv: ["indoor", "office", "remote"], education: ["bachelor", "degree"], salary: ["medium", "high"], experience: ["mid"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["creative", "analytical", "problem-solving", "team-work"] },
  { name: "Concept Artist", sub: "arts-media", desc: "An artist who creates visual designs for games and films.", pop: 45, diff: 3, industry: ["arts", "technology"], workEnv: ["indoor", "studio", "remote"], education: ["bachelor", "certificate", "degree"], salary: ["medium", "high"], experience: ["mid"], physical: ["sedentary"], tools: ["computer", "software", "instruments"], skills: ["creative", "analytical", "problem-solving", "team-work"] },

  // ================================================================
  // TRADES & SKILLED LABOR (~20 new jobs)
  // Existing: Electrician, Plumber, Carpenter, Welder, Mechanic,
  //           Landscaper, Farmer, Truck Driver, Pilot, Crane Operator,
  //           Underwater Welder, Beekeeper
  // ================================================================
  { name: "HVAC Technician", sub: "trades", desc: "A technician who installs and repairs heating and cooling systems.", pop: 52, diff: 2, industry: ["construction"], workEnv: ["indoor", "outdoor"], education: ["certificate", "associate", "tradeschool"], salary: ["medium", "high"], experience: ["mid"], physical: ["heavy"], tools: ["tools", "machinery"], skills: ["problem-solving", "manual-dexterity", "machine-focused", "troubleshooting", "physical"] },
  { name: "Auto Mechanic", sub: "trades", desc: "A mechanic who repairs and maintains cars and trucks.", pop: 55, diff: 2, industry: ["manufacturing", "transportation"], workEnv: ["indoor", "factory"], education: ["certificate", "tradeschool"], salary: ["medium"], experience: ["mid"], physical: ["heavy"], tools: ["tools", "machinery", "computer"], skills: ["problem-solving", "manual-dexterity", "machine-focused", "troubleshooting", "physical"] },
  { name: "Diesel Mechanic", sub: "trades", desc: "A mechanic who specializes in diesel engines.", pop: 48, diff: 2, industry: ["manufacturing", "transportation"], workEnv: ["indoor", "factory"], education: ["certificate", "tradeschool"], salary: ["medium", "high"], experience: ["mid"], physical: ["heavy"], tools: ["tools", "machinery", "computer"], skills: ["problem-solving", "manual-dexterity", "machine-focused", "troubleshooting", "physical"] },
  { name: "Aircraft Mechanic", sub: "trades", desc: "A mechanic who maintains and repairs aircraft.", pop: 48, diff: 3, industry: ["transportation", "manufacturing"], workEnv: ["indoor", "outdoor", "aircraft"], education: ["certificate", "associate", "tradeschool"], salary: ["medium", "high"], experience: ["mid"], physical: ["heavy"], tools: ["tools", "machinery", "instruments"], skills: ["problem-solving", "manual-dexterity", "machine-focused", "precise", "license-required", "dangerous"] },
  { name: "Mason", sub: "trades", desc: "A tradesperson who builds with brick, stone, and concrete.", pop: 45, diff: 2, industry: ["construction"], workEnv: ["outdoor", "indoor"], education: ["certificate", "tradeschool"], salary: ["medium"], experience: ["mid"], physical: ["extreme"], tools: ["tools", "machinery"], skills: ["manual-dexterity", "physical", "problem-solving", "creative", "precise"] },
  { name: "Roofer", sub: "trades", desc: "A tradesperson who installs and repairs roofs.", pop: 42, diff: 2, industry: ["construction"], workEnv: ["outdoor"], education: ["no-degree", "certificate"], salary: ["medium"], experience: ["mid"], physical: ["extreme"], tools: ["tools", "machinery"], skills: ["manual-dexterity", "physical", "problem-solving", "dangerous", "team-work"] },
  { name: "Drywall Installer", sub: "trades", desc: "A tradesperson who installs wallboard in buildings.", pop: 40, diff: 1, industry: ["construction"], workEnv: ["indoor", "outdoor"], education: ["no-degree", "certificate"], salary: ["medium"], experience: ["mid"], physical: ["heavy"], tools: ["tools"], skills: ["manual-dexterity", "physical", "problem-solving", "team-work"] },
  { name: "Flooring Installer", sub: "trades", desc: "A tradesperson who installs flooring materials.", pop: 40, diff: 1, industry: ["construction"], workEnv: ["indoor"], education: ["no-degree", "certificate"], salary: ["medium"], experience: ["mid"], physical: ["heavy"], tools: ["tools"], skills: ["manual-dexterity", "physical", "problem-solving", "precise"] },
  { name: "Glass Installer", sub: "trades", desc: "A tradesperson who installs glass in windows and buildings.", pop: 38, diff: 2, industry: ["construction"], workEnv: ["indoor", "outdoor"], education: ["certificate", "tradeschool"], salary: ["medium"], experience: ["mid"], physical: ["heavy"], tools: ["tools", "instruments"], skills: ["manual-dexterity", "physical", "precise", "problem-solving", "dangerous"] },
  { name: "Arborist", sub: "trades", desc: "A professional who cares for and maintains trees.", pop: 42, diff: 3, industry: ["agriculture", "construction"], workEnv: ["outdoor"], education: ["certificate", "degree"], salary: ["medium"], experience: ["mid"], physical: ["extreme"], tools: ["tools", "machinery", "instruments"], skills: ["manual-dexterity", "physical", "problem-solving", "dangerous", "creative"] },
  { name: "Fisherman", sub: "trades", desc: "A worker who catches fish for food or sport.", pop: 45, diff: 2, industry: ["agriculture", "transportation"], workEnv: ["outdoor", "ship"], education: ["no-degree", "certificate"], salary: ["medium", "variable"], experience: ["mid"], physical: ["extreme"], tools: ["tools", "machinery", "ship"], skills: ["physical", "problem-solving", "manual-dexterity", "dangerous", "team-work"] },
  { name: "Bus Driver", sub: "trades", desc: "A driver who transports passengers on a bus.", pop: 48, diff: 1, industry: ["transportation"], workEnv: ["vehicle", "outdoor"], education: ["highschool", "certificate"], salary: ["medium"], experience: ["mid"], physical: ["sedentary"], tools: ["vehicle"], skills: ["people-focused", "communication", "problem-solving", "license-required", "team-work"] },
  { name: "Taxi Driver", sub: "trades", desc: "A driver who transports passengers in a taxi.", pop: 45, diff: 1, industry: ["transportation"], workEnv: ["vehicle", "outdoor"], education: ["highschool", "no-degree"], salary: ["low", "medium"], experience: ["entry", "mid"], physical: ["sedentary"], tools: ["vehicle", "phone"], skills: ["people-focused", "communication", "problem-solving", "license-required"] },
  { name: "Forklift Operator", sub: "trades", desc: "An operator who drives forklifts to move materials.", pop: 45, diff: 1, industry: ["manufacturing", "transportation"], workEnv: ["indoor", "warehouse"], education: ["highschool", "certificate"], salary: ["medium"], experience: ["entry", "mid"], physical: ["moderate"], tools: ["machinery"], skills: ["machine-focused", "problem-solving", "precise", "team-work", "license-required"] },
  { name: "Heavy Equipment Operator", sub: "trades", desc: "An operator who drives bulldozers, excavators, and cranes.", pop: 48, diff: 2, industry: ["construction", "manufacturing"], workEnv: ["outdoor"], education: ["highschool", "certificate"], salary: ["medium", "high"], experience: ["mid"], physical: ["moderate"], tools: ["machinery"], skills: ["machine-focused", "problem-solving", "precise", "dangerous", "license-required", "team-work"] },
  { name: "Construction Worker", sub: "trades", desc: "A worker who performs physical labor on construction sites.", pop: 52, diff: 1, industry: ["construction"], workEnv: ["outdoor", "indoor"], education: ["highschool", "no-degree", "certificate"], salary: ["medium"], experience: ["entry", "mid"], physical: ["extreme"], tools: ["tools", "machinery"], skills: ["physical", "manual-dexterity", "problem-solving", "team-work", "dangerous"] },

  // ================================================================
  // HOSPITALITY & SERVICE (~15 new jobs)
  // Existing: Chef, Bartender, Hotel Manager, Tour Guide, Flight Attendant, Sommelier
  // ================================================================
  { name: "Cook", sub: "hospitality", desc: "A professional who prepares food in a kitchen.", pop: 50, diff: 1, industry: ["hospitality"], workEnv: ["indoor", "kitchen", "restaurant"], education: ["highschool", "certificate"], salary: ["low", "medium"], experience: ["entry", "mid"], physical: ["heavy"], tools: ["tools", "instruments"], skills: ["manual-dexterity", "physical", "problem-solving", "team-work", "creative"] },
  { name: "Baker", sub: "hospitality", desc: "A professional who bakes bread, pastries, and desserts.", pop: 50, diff: 1, industry: ["hospitality"], workEnv: ["indoor", "kitchen"], education: ["highschool", "certificate"], salary: ["low", "medium"], experience: ["mid"], physical: ["heavy"], tools: ["tools", "machinery", "instruments"], skills: ["manual-dexterity", "creative", "precise", "physical", "early-riser"] },
  { name: "Pastry Chef", sub: "hospitality", desc: "A chef who specializes in desserts and pastries.", pop: 48, diff: 2, industry: ["hospitality", "arts"], workEnv: ["indoor", "kitchen"], education: ["certificate", "bachelor", "degree"], salary: ["medium"], experience: ["mid"], physical: ["heavy"], tools: ["tools", "instruments"], skills: ["creative", "manual-dexterity", "precise", "problem-solving", "physical"] },
  { name: "Restaurant Manager", sub: "hospitality", desc: "A manager who oversees restaurant operations.", pop: 52, diff: 2, industry: ["hospitality", "business"], workEnv: ["indoor", "restaurant", "kitchen"], education: ["associate", "bachelor", "degree"], salary: ["medium", "high"], experience: ["senior"], physical: ["light"], tools: ["computer", "software"], skills: ["leadership", "people-focused", "communication", "problem-solving", "team-work", "organization"] },
  { name: "Server", sub: "hospitality", desc: "A professional who takes orders and serves food.", pop: 48, diff: 1, industry: ["hospitality"], workEnv: ["indoor", "restaurant"], education: ["highschool", "no-degree"], salary: ["low", "variable"], experience: ["entry", "mid"], physical: ["heavy"], tools: ["instruments"], skills: ["people-focused", "communication", "physical", "problem-solving", "team-work"] },
  { name: "Barista", sub: "hospitality", desc: "A professional who prepares and serves coffee drinks.", pop: 50, diff: 1, industry: ["hospitality"], workEnv: ["indoor", "restaurant", "store"], education: ["highschool", "no-degree"], salary: ["low", "medium"], experience: ["entry", "mid"], physical: ["light"], tools: ["instruments", "machinery"], skills: ["people-focused", "communication", "creative", "manual-dexterity", "problem-solving"] },
  { name: "Front Desk Agent", sub: "hospitality", desc: "An agent who greets guests and manages hotel check-ins.", pop: 45, diff: 1, industry: ["hospitality"], workEnv: ["indoor", "office"], education: ["highschool", "associate"], salary: ["low", "medium"], experience: ["entry", "mid"], physical: ["sedentary"], tools: ["computer", "software", "phone"], skills: ["people-focused", "communication", "problem-solving", "organization"] },
  { name: "Housekeeper", sub: "hospitality", desc: "A worker who cleans and maintains rooms.", pop: 45, diff: 1, industry: ["hospitality"], workEnv: ["indoor"], education: ["no-degree", "highschool"], salary: ["low"], experience: ["entry", "mid"], physical: ["heavy"], tools: ["tools", "instruments"], skills: ["physical", "organization", "precise", "team-work", "problem-solving"] },
  { name: "Concierge", sub: "hospitality", desc: "A professional who assists guests with requests and information.", pop: 42, diff: 2, industry: ["hospitality"], workEnv: ["indoor", "office"], education: ["highschool", "associate", "bachelor"], salary: ["medium"], experience: ["mid"], physical: ["light"], tools: ["computer", "phone"], skills: ["people-focused", "communication", "problem-solving", "local-travel", "organization"] },
  { name: "Travel Agent", sub: "hospitality", desc: "An agent who plans and books travel for clients.", pop: 45, diff: 2, industry: ["hospitality", "business"], workEnv: ["indoor", "office", "remote"], education: ["highschool", "associate", "bachelor"], salary: ["medium"], experience: ["mid"], physical: ["sedentary"], tools: ["computer", "software", "phone"], skills: ["people-focused", "communication", "problem-solving", "organization", "research"] },
  { name: "Event Planner", sub: "hospitality", desc: "A planner who organizes events and conferences.", pop: 52, diff: 2, industry: ["hospitality", "business"], workEnv: ["indoor", "outdoor", "office"], education: ["bachelor", "degree"], salary: ["medium", "high"], experience: ["mid", "senior"], physical: ["light"], tools: ["computer", "software", "phone"], skills: ["organization", "communication", "people-focused", "problem-solving", "team-work", "leadership"] },
  { name: "Wedding Planner", sub: "hospitality", desc: "A planner who organizes weddings.", pop: 48, diff: 2, industry: ["hospitality", "business"], workEnv: ["indoor", "outdoor", "office"], education: ["bachelor", "certificate", "degree"], salary: ["medium", "high"], experience: ["mid", "senior"], physical: ["light"], tools: ["computer", "software", "phone"], skills: ["organization", "communication", "people-focused", "problem-solving", "team-work", "creative"] },
  { name: "Catering Manager", sub: "hospitality", desc: "A manager who oversees catering operations.", pop: 45, diff: 2, industry: ["hospitality", "business"], workEnv: ["indoor", "outdoor", "kitchen"], education: ["associate", "bachelor", "degree"], salary: ["medium", "high"], experience: ["senior"], physical: ["moderate"], tools: ["computer", "software"], skills: ["leadership", "organization", "people-focused", "problem-solving", "team-work", "communication"] },
  { name: "Cruise Director", sub: "hospitality", desc: "A director who oversees entertainment and activities on a cruise.", pop: 42, diff: 3, industry: ["hospitality", "arts", "transportation"], workEnv: ["indoor", "outdoor", "ship"], education: ["bachelor", "degree"], salary: ["high"], experience: ["senior"], physical: ["light"], tools: ["computer", "software", "phone"], skills: ["leadership", "communication", "public-speaking", "people-focused", "problem-solving", "team-work", "frequent-travel"] },
  { name: "Theme Park Attendant", sub: "hospitality", desc: "An attendant who assists guests at a theme park.", pop: 40, diff: 1, industry: ["hospitality", "arts"], workEnv: ["outdoor", "indoor"], education: ["highschool", "no-degree"], salary: ["low"], experience: ["entry"], physical: ["moderate"], tools: ["instruments"], skills: ["people-focused", "communication", "problem-solving", "team-work"] },

  // ================================================================
  // LEGAL & GOVERNMENT (~10 new jobs)
  // Existing: Lawyer, Judge, Paralegal, Politician, Diplomat, Social Worker,
  //           Postal Worker, Police Officer, Firefighter, Court Reporter
  // ================================================================
  { name: "Legal Assistant", sub: "legal", desc: "An assistant who supports lawyers with administrative tasks.", pop: 48, diff: 2, industry: ["legal"], workEnv: ["indoor", "office"], education: ["associate", "certificate"], salary: ["medium"], experience: ["entry", "mid"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["organization", "analytical", "precise", "communication", "problem-solving"] },
  { name: "Corporate Counsel", sub: "legal", desc: "A lawyer who works in-house for a corporation.", pop: 50, diff: 3, industry: ["legal", "business"], workEnv: ["indoor", "office"], education: ["doctorate", "degree"], salary: ["very-high"], experience: ["senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["analytical", "problem-solving", "communication", "license-required", "client-facing", "team-work"] },
  { name: "Prosecutor", sub: "legal", desc: "A lawyer who represents the government in criminal cases.", pop: 52, diff: 3, industry: ["legal", "government"], workEnv: ["indoor", "courtroom", "office"], education: ["doctorate", "degree"], salary: ["high"], experience: ["senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["analytical", "public-speaking", "communication", "problem-solving", "license-required", "high-stress"] },
  { name: "Defense Attorney", sub: "legal", desc: "A lawyer who defends individuals against criminal charges.", pop: 52, diff: 3, industry: ["legal"], workEnv: ["indoor", "courtroom", "office"], education: ["doctorate", "degree"], salary: ["high", "very-high"], experience: ["senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["analytical", "public-speaking", "communication", "problem-solving", "license-required", "persuasive"] },
  { name: "Legal Consultant", sub: "legal", desc: "A consultant who provides expert legal advice.", pop: 45, diff: 3, industry: ["legal", "business"], workEnv: ["indoor", "office"], education: ["doctorate", "degree"], salary: ["very-high"], experience: ["senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["analytical", "communication", "problem-solving", "license-required", "client-facing", "research"] },
  { name: "Government Administrator", sub: "government", desc: "An administrator who manages government programs.", pop: 45, diff: 3, industry: ["government", "business"], workEnv: ["indoor", "office"], education: ["bachelor", "master", "degree"], salary: ["high"], experience: ["senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["leadership", "analytical", "problem-solving", "communication", "team-work", "organization"] },
  { name: "Policy Analyst", sub: "government", desc: "An analyst who researches and develops public policy.", pop: 45, diff: 3, industry: ["government", "science"], workEnv: ["indoor", "office"], education: ["master", "degree"], salary: ["high"], experience: ["mid", "senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["analytical", "research", "writing", "communication", "problem-solving", "public-speaking"] },
  { name: "Lobbyist", sub: "government", desc: "A professional who advocates for policy positions.", pop: 42, diff: 3, industry: ["government", "business", "legal"], workEnv: ["indoor", "office"], education: ["bachelor", "degree"], salary: ["high"], experience: ["senior"], physical: ["sedentary"], tools: ["computer", "software", "phone"], skills: ["communication", "persuasive", "people-focused", "analytical", "public-speaking", "problem-solving"] },
  { name: "Public Administrator", sub: "government", desc: "An administrator who manages public sector operations.", pop: 42, diff: 3, industry: ["government", "business"], workEnv: ["indoor", "office"], education: ["master", "degree"], salary: ["high"], experience: ["senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["leadership", "analytical", "problem-solving", "communication", "team-work", "organization"] },

  // ================================================================
  // BONUS 13 (Architecture & Design — Fashion Designer & Architect exist)
  // ================================================================
  { name: "Urban Planner", sub: "construction", desc: "A planner who designs cities and communities.", pop: 48, diff: 3, industry: ["construction", "government"], workEnv: ["indoor", "outdoor", "office"], education: ["master", "degree"], salary: ["high"], experience: ["senior"], physical: ["sedentary"], tools: ["computer", "software"], skills: ["analytical", "creative", "problem-solving", "communication", "public-speaking", "team-work"] },
  { name: "Interior Designer", sub: "arts-media", desc: "A designer who creates functional and beautiful interior spaces.", pop: 55, diff: 2, industry: ["arts", "construction"], workEnv: ["indoor", "office", "studio"], education: ["bachelor", "degree"], salary: ["medium", "high"], experience: ["mid", "senior"], physical: ["light"], tools: ["computer", "software", "instruments"], skills: ["creative", "analytical", "problem-solving", "client-facing", "communication", "team-work"] },
  { name: "Jeweler", sub: "arts-media", desc: "A craftsperson who designs and makes jewelry.", pop: 42, diff: 3, industry: ["arts", "manufacturing"], workEnv: ["indoor", "studio", "store"], education: ["certificate", "associate", "tradeschool"], salary: ["medium"], experience: ["mid"], physical: ["sedentary"], tools: ["tools", "instruments"], skills: ["creative", "manual-dexterity", "precise", "problem-solving", "analytical"] },
  { name: "Watchmaker", sub: "arts-media", desc: "A craftsperson who builds and repairs watches.", pop: 35, diff: 5, industry: ["arts", "manufacturing"], workEnv: ["indoor", "studio"], education: ["certificate", "tradeschool"], salary: ["medium", "high"], experience: ["senior"], physical: ["sedentary"], tools: ["tools", "instruments", "microscope"], skills: ["manual-dexterity", "precise", "problem-solving", "analytical", "patient"] },
  { name: "Tailor", sub: "arts-media", desc: "A craftsperson who makes and alters clothing.", pop: 45, diff: 2, industry: ["arts", "hospitality"], workEnv: ["indoor", "studio", "store"], education: ["certificate", "tradeschool"], salary: ["low", "medium"], experience: ["mid"], physical: ["sedentary"], tools: ["tools", "instruments"], skills: ["manual-dexterity", "creative", "precise", "problem-solving", "people-focused"] },
  { name: "Shoe Designer", sub: "arts-media", desc: "A designer who creates footwear.", pop: 40, diff: 3, industry: ["arts", "manufacturing"], workEnv: ["indoor", "studio", "office"], education: ["bachelor", "degree"], salary: ["medium", "high"], experience: ["mid", "senior"], physical: ["sedentary"], tools: ["computer", "software", "instruments"], skills: ["creative", "analytical", "problem-solving", "manual-dexterity", "team-work"] },
  { name: "Textile Designer", sub: "arts-media", desc: "A designer who creates patterns and fabrics.", pop: 38, diff: 3, industry: ["arts", "manufacturing"], workEnv: ["indoor", "studio", "office"], education: ["bachelor", "degree"], salary: ["medium"], experience: ["mid"], physical: ["sedentary"], tools: ["computer", "software", "instruments"], skills: ["creative", "analytical", "problem-solving", "team-work"] },
  { name: "Product Designer", sub: "arts-media", desc: "A designer who creates physical products.", pop: 50, diff: 3, industry: ["arts", "manufacturing", "technology"], workEnv: ["indoor", "office", "studio"], education: ["bachelor", "degree"], salary: ["high"], experience: ["mid", "senior"], physical: ["sedentary"], tools: ["computer", "software", "instruments"], skills: ["creative", "analytical", "problem-solving", "team-work", "communication"] },
  { name: "Industrial Designer", sub: "arts-media", desc: "A designer who creates manufactured products.", pop: 48, diff: 3, industry: ["arts", "manufacturing"], workEnv: ["indoor", "office", "factory"], education: ["bachelor", "degree"], salary: ["high"], experience: ["mid", "senior"], physical: ["sedentary"], tools: ["computer", "software", "instruments"], skills: ["creative", "analytical", "problem-solving", "machine-focused", "team-work"] },
  { name: "Furniture Maker", sub: "trades", desc: "A craftsperson who builds furniture.", pop: 42, diff: 2, industry: ["arts", "manufacturing", "construction"], workEnv: ["indoor", "studio", "factory"], education: ["certificate", "tradeschool"], salary: ["medium"], experience: ["mid"], physical: ["heavy"], tools: ["tools", "machinery"], skills: ["manual-dexterity", "creative", "problem-solving", "physical", "precise"] },
  { name: "Glass Blower", sub: "arts-media", desc: "An artist who shapes molten glass into objects.", pop: 30, diff: 5, industry: ["arts", "manufacturing"], workEnv: ["indoor", "studio", "factory"], education: ["certificate", "tradeschool"], salary: ["low", "medium"], experience: ["mid", "senior"], physical: ["extreme"], tools: ["tools", "instruments", "machinery"], skills: ["manual-dexterity", "creative", "physical", "precise", "dangerous", "problem-solving"] },
  { name: "Potter", sub: "arts-media", desc: "An artist who creates pottery and ceramics.", pop: 38, diff: 3, industry: ["arts", "manufacturing"], workEnv: ["indoor", "studio"], education: ["certificate", "bachelor", "degree"], salary: ["low", "medium"], experience: ["mid"], physical: ["moderate"], tools: ["tools", "machinery", "instruments"], skills: ["creative", "manual-dexterity", "precise", "problem-solving", "patient"] },
  { name: "Calligrapher", sub: "arts-media", desc: "An artist who creates beautiful handwriting.", pop: 30, diff: 4, industry: ["arts"], workEnv: ["indoor", "studio"], education: ["certificate", "bachelor", "degree"], salary: ["low", "variable"], experience: ["mid", "senior"], physical: ["sedentary"], tools: ["tools", "instruments"], skills: ["creative", "manual-dexterity", "precise", "patient", "problem-solving"] },
];

// ------------------------------------------------------------
// NEW QUESTIONS — 25 natural conversational questions
// probing the 8 core attributes. NO duplicates with existing 76.
// Each probes a tag that exists in the vocabulary.
// ------------------------------------------------------------

const NEW_QUESTIONS: { text: string; tag: string }[] = [
  // Industry probes
  { text: "Does this job involve building or making physical things?", tag: "manufacturing" },
  { text: "Is this job in the financial services industry?", tag: "finance" },
  { text: "Does this job involve performing for an audience?", tag: "performance" },

  // Work environment probes
  { text: "Can you do this job entirely from a desk?", tag: "sedentary" },
  { text: "Does this job involve working in a laboratory?", tag: "lab" },
  { text: "Does this job involve working in a studio?", tag: "studio" },
  { text: "Does this job involve working in a warehouse?", tag: "warehouse" },
  { text: "Does this job involve working in a courtroom?", tag: "courtroom" },

  // Education probes
  { text: "Does this job require a doctoral or professional degree?", tag: "doctorate" },
  { text: "Does this job require a master's degree?", tag: "masters" },
  { text: "Can you start this job with just a high school diploma?", tag: "no-degree" },
  { text: "Does this job require trade school or an apprenticeship?", tag: "tradeschool" },

  // Salary probes
  { text: "Does this job typically pay over $150,000 per year?", tag: "very-high" },
  { text: "Is this a modest-paying job (under $70,000)?", tag: "low-income" },

  // Experience probes
  { text: "Is this an entry-level job someone could start right away?", tag: "experience-entry" },
  { text: "Is this a senior or leadership position?", tag: "experience-senior" },

  // Physical demand probes
  { text: "Does this job involve heavy lifting or strenuous physical activity?", tag: "physical" },
  { text: "Does this job require working at heights or in dangerous conditions?", tag: "dangerous" },

  // Tools probes
  { text: "Does this job involve using a microscope or precision instruments?", tag: "instruments" },
  { text: "Does this job require operating heavy machinery?", tag: "machinery" },
  { text: "Does this job primarily involve using hand tools?", tag: "tools" },

  // Skills probes
  { text: "Does this job require strong writing or communication skills?", tag: "communication" },
  { text: "Does this job involve scientific research or experimentation?", tag: "research" },
  { text: "Does this job involve managing or leading a team?", tag: "leadership" },
  { text: "Does this job require precise attention to detail?", tag: "precise" },
];

// ------------------------------------------------------------
// Main
// ------------------------------------------------------------

async function main() {
  console.log("=== GUESS MY JOB — EXPANDED KNOWLEDGE BASE ===\n");

  const jobsCategory = await db.category.findUnique({ where: { slug: "jobs" } });
  if (!jobsCategory) {
    console.error("Jobs category not found! Run prisma/seed.ts first.");
    process.exit(1);
  }

  // --- 1. Ensure subcategories exist ---
  console.log("Ensuring subcategories...");
  const subMap = new Map<string, string>();
  const subDefs: { name: string; slug: string }[] = [
    { name: "Technology", slug: "technology" },
    { name: "Healthcare", slug: "healthcare" },
    { name: "Finance", slug: "finance" },
    { name: "Business", slug: "business" },
    { name: "Business & Law", slug: "business-law" },
    { name: "Education", slug: "education" },
    { name: "Arts & Media", slug: "arts-media" },
    { name: "Trades & Labor", slug: "trades" },
    { name: "Science", slug: "science" },
    { name: "Construction", slug: "construction" },
    { name: "Transportation", slug: "transportation" },
    { name: "Government", slug: "government" },
    { name: "Agriculture", slug: "agriculture" },
    { name: "Hospitality", slug: "hospitality" },
    { name: "Legal", slug: "legal" },
    { name: "Manufacturing", slug: "manufacturing" },
  ];
  for (const s of subDefs) {
    const id = await ensureSubcategory(jobsCategory.id, s.name, s.slug);
    subMap.set(s.slug, id);
  }

  // --- 2. Add jobs (skip existing) ---
  console.log(`\nAdding ${JOBS.length} jobs...`);
  let added = 0;
  let skipped = 0;
  for (const job of JOBS) {
    const slug = slugify(job.name);
    const existing = await db.entity.findUnique({
      where: { categoryId_slug: { categoryId: jobsCategory.id, slug } },
    });
    if (existing) {
      // Add any missing tags to the existing entity.
      const tags = jobDefToTags(job);
      await addTagsToEntity(existing.id, tags);
      skipped++;
      continue;
    }

    const tags = jobDefToTags(job);
    const subId = subMap.get(job.sub) ?? null;
    await createEntity(job.name, jobsCategory.id, subId, job.desc, tags, job.pop, job.diff);
    added++;
  }
  console.log(`Added ${added} new jobs. Updated tags on ${skipped} existing jobs.`);

  // --- 3. Add new questions ---
  console.log(`\nAdding ${NEW_QUESTIONS.length} new questions...`);
  let qAdded = 0;
  let qSkipped = 0;
  for (const q of NEW_QUESTIONS) {
    const existing = await db.question.findFirst({ where: { text: q.text } });
    if (existing) {
      qSkipped++;
      continue;
    }
    await ensureQuestion(q.text, q.tag, jobsCategory.id);
    qAdded++;
  }
  console.log(`Added ${qAdded} new questions. Skipped ${qSkipped} existing.`);

  // --- 4. Report ---
  const totalJobs = await db.entity.count({ where: { categoryId: jobsCategory.id } });
  const totalQuestions = await db.question.count({ where: { categoryId: jobsCategory.id } });
  console.log(`\n=== FINAL JOB CATEGORY STATS ===`);
  console.log(`  Total jobs:       ${totalJobs}`);
  console.log(`  Total questions:  ${totalQuestions}`);

  // Verify no duplicates
  const allJobs = await db.entity.findMany({
    where: { categoryId: jobsCategory.id },
    select: { name: true },
  });
  const nameSet = new Set<string>();
  let dupes = 0;
  for (const j of allJobs) {
    const key = j.name.toLowerCase().trim();
    if (nameSet.has(key)) {
      console.log(`  DUPLICATE: ${j.name}`);
      dupes++;
    }
    nameSet.add(key);
  }
  console.log(`  Duplicate check:  ${dupes === 0 ? "PASS (no duplicates)" : `${dupes} DUPLICATES FOUND`}`);

  console.log("\nDone.");
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
