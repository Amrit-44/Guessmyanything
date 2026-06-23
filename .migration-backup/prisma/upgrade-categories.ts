/**
 * GUESS MY ANYTHING — Category Lock Upgrade
 *
 * Fixes the "off-category question" bug: previously, general questions
 * (categoryId: null) bled into every category mode, so the engine could
 * ask "Is it a large animal?" while playing Countries (because both
 * "large animal" and "large country" probe the same `large` tag).
 *
 * This script assigns EVERY general question to its proper category
 * based on its wording, so the engine can apply a strict category lock.
 *
 *   - Broad splitters ("Is it an animal?", "Is it a movie?", ...) stay
 *     general (categoryId: null) — they are only used in "Anything" mode.
 *   - Section questions (Animals, Countries, Sports, Movies, ...) are
 *     assigned to their category.
 *   - Person questions (male, female, alive, american, ...) are DUPLICATED
 *     into both `celebrities` and `historical`, since both categories
 *     contain real people with those tags.
 *
 * Idempotent: safe to run multiple times.
 *
 * Run: bun run prisma/upgrade-categories.ts
 */

import { db } from "../src/lib/db";

// ------------------------------------------------------------
// Question text -> category slug mapping
// ------------------------------------------------------------
// Broad splitters stay general (null). Everything else maps to a category.
// Person questions map to ["celebrities", "historical"] (duplicated).

const BROAD_SPLITTERS: string[] = [
  "Is it a real, existing person?",
  "Is it a fictional character?",
  "Is it a job or profession?",
  "Is it an animal?",
  "Is it a country or place?",
  "Is it a movie?",
  "Is it a TV show?",
  "Is it a video game?",
  "Is it a brand or company?",
  "Is it a physical object?",
  "Is it a sport?",
  "Is it a famous person from history?",
  "Is it a celebrity?",
];

// text -> category slug (single category)
const SINGLE_CATEGORY: Record<string, string> = {
  // --- Characters ---
  "Is the character from an anime or manga?": "characters",
  "Is the character a superhero?": "characters",
  "Is the character a villain?": "characters",
  "Does the character have superpowers?": "characters",
  "Is the character from comics?": "characters",
  "Is the character from a cartoon?": "characters",
  "Is the character from a book?": "characters",
  "Is the character from a video game?": "characters",
  "Is the character from Disney?": "characters",
  "Is the character associated with Nintendo?": "characters",
  "Does the character use magic?": "characters",
  "Does the character wield a sword?": "characters",
  "Is the character young (a child or teen)?": "characters",
  "Is the character funny?": "characters",
  "Is the character cute?": "characters",
  "Is the character an animal or animal-like?": "characters",

  // --- Jobs ---
  "Does the job require a university degree?": "jobs",
  "Is it a healthcare job?": "jobs",
  "Is it a technology job?": "jobs",
  "Is it in education?": "jobs",
  "Is it a creative or arts job?": "jobs",
  "Is it a trade (manual labor)?": "jobs",
  "Is it a well-paid job?": "jobs",
  "Does the job involve working with people?": "jobs",
  "Does the job involve working with machines or computers?": "jobs",
  "Does the job involve science?": "jobs",
  "Is the job mostly indoors?": "jobs",
  "Is the job mostly outdoors?": "jobs",
  "Does the job involve a uniform?": "jobs",
  "Is the job physically demanding?": "jobs",
  "Is the job dangerous?": "jobs",
  "Is it a law-related job?": "jobs",

  // --- Animals ---
  "Is it a mammal?": "animals",
  "Is it a bird?": "animals",
  "Is it a reptile or amphibian?": "animals",
  "Is it a fish or sea creature?": "animals",
  "Is it an insect or bug?": "animals",
  "Is it a carnivore (meat-eater)?": "animals",
  "Is it a herbivore (plant-eater)?": "animals",
  "Is it a wild animal?": "animals",
  "Is it a domestic or pet animal?": "animals",
  "Can it fly?": "animals",
  "Can it swim?": "animals",
  "Is it a large animal?": "animals",
  "Is it a small animal?": "animals",
  "Is it a predator?": "animals",
  "Is it a fast animal?": "animals",
  "Is it considered smart or intelligent?": "animals",
  "Is it from Africa?": "animals",
  "Is it from Asia?": "animals",

  // --- Countries ---
  "Is it in Asia?": "countries",
  "Is it in Europe?": "countries",
  "Is it in the Americas?": "countries",
  "Is it in Africa?": "countries",
  "Is it an island nation?": "countries",
  "Is it a large country?": "countries",
  "Is it a populous country?": "countries",
  "Is it a developed country?": "countries",
  "Is it a tropical country?": "countries",
  "Is it a cold country?": "countries",
  "Is it a hot country?": "countries",
  "Is it an ancient civilization?": "countries",
  "Is it English-speaking?": "countries",
  "Is it known for technology?": "countries",

  // --- Movies ---
  "Is it an animated movie?": "movies",
  "Is it a Disney movie?": "movies",
  "Is it an action movie?": "movies",
  "Is it a comedy?": "movies",
  "Is it a drama?": "movies",
  "Is it a horror movie?": "movies",
  "Is it a sci-fi movie?": "movies",
  "Is it a fantasy movie?": "movies",
  "Is it a superhero movie?": "movies",
  "Is it a blockbuster?": "movies",
  "Is it a classic (older) movie?": "movies",
  "Is it a modern (recent) movie?": "movies",
  "Is it a family-friendly movie?": "movies",
  "Is it critically acclaimed?": "movies",
  "Is it part of a franchise?": "movies",

  // --- TV shows ---
  "Is it a sitcom (comedy)?": "tv-shows",
  "Is it a crime or thriller drama?": "tv-shows",
  "Is it an animated show?": "tv-shows",
  "Is it a streaming-era show?": "tv-shows",
  "Is it a long-running show?": "tv-shows",
  "Is it a British show?": "tv-shows",
  "Is it an American show?": "tv-shows",
  "Is it dark or violent?": "tv-shows",
  "Is it a reality show?": "tv-shows",

  // --- Video games ---
  "Is it a role-playing game (RPG)?": "video-games",
  "Is it an action-adventure game?": "video-games",
  "Is it a shooter game?": "video-games",
  "Is it a puzzle game?": "video-games",
  "Is it a sports or racing game?": "video-games",
  "Is it an open-world game?": "video-games",
  "Is it a retro / classic game?": "video-games",
  "Is it a modern game?": "video-games",
  "Is it a Nintendo game?": "video-games",
  "Is it multiplayer?": "video-games",
  "Does it involve magic or fantasy?": "video-games",
  "Is it a sandbox or creative game?": "video-games",

  // --- Brands ---
  "Is it a technology brand?": "brands",
  "Is it a food or drink brand?": "brands",
  "Is it a fashion brand?": "brands",
  "Is it a car brand?": "brands",
  "Is it a luxury (expensive) brand?": "brands",
  "Is it an American brand?": "brands",
  "Is it a Japanese brand?": "brands",
  "Is it a European brand?": "brands",
  "Is it a global (worldwide) brand?": "brands",
  "Is it an old, established brand?": "brands",
  "Is it a modern, recent brand?": "brands",
  "Does it make hardware (devices)?": "brands",
  "Does it make software?": "brands",

  // --- Objects ---
  "Is it an electronic device?": "objects",
  "Is it a piece of furniture?": "objects",
  "Is it an item of clothing?": "objects",
  "Is it a tool?": "objects",
  "Is it a kitchen item?": "objects",
  "Is it an office or school item?": "objects",
  "Is it food or drink?": "objects",
  "Is it small (portable)?": "objects",
  "Is it large?": "objects",
  "Is it portable?": "objects",
  "Does it have a screen?": "objects",
  "Does it use electricity?": "objects",
  "Is it soft?": "objects",
  "Is it sharp?": "objects",
  "Is it a household item?": "objects",
  "Is it something you wear?": "objects",

  // --- Sports ---
  "Is it a team sport?": "sports",
  "Is it an individual sport?": "sports",
  "Is it a ball sport?": "sports",
  "Is it an Olympic sport?": "sports",
  "Is it a water sport?": "sports",
  "Is it a winter sport?": "sports",
  "Is it a contact or combat sport?": "sports",
  "Is it played indoors?": "sports",
  "Is it played outdoors?": "sports",
  "Is it a motorsport?": "sports",
  "Is it a globally popular sport?": "sports",
};

// Person questions -> duplicated into BOTH celebrities and historical.
const PERSON_QUESTIONS: string[] = [
  "Is this person male?",
  "Is this person female?",
  "Is this person still alive?",
  "Is this person deceased?",
  "Is this person American?",
  "Is this person European (British, French, German, etc.)?",
  "Is this person Asian (Japanese, Chinese, etc.)?",
  "Is this person an actor or actress?",
  "Is this person a musician or singer?",
  "Is this person an athlete?",
  "Is this person a scientist or inventor?",
  "Is this person a political or military leader?",
  "Is this person an entrepreneur or business figure?",
  "Is this person known for being a genius?",
  "Is this person famous?",
];

// ------------------------------------------------------------
// Runner
// ------------------------------------------------------------

async function main() {
  console.log("=== CATEGORY LOCK UPGRADE ===\n");

  const categorySlugs = [
    "characters",
    "jobs",
    "animals",
    "countries",
    "movies",
    "tv-shows",
    "video-games",
    "brands",
    "objects",
    "sports",
    "celebrities",
    "historical",
  ];
  const cats = await db.category.findMany({
    where: { slug: { in: categorySlugs } },
    select: { id: true, slug: true },
  });
  const catIdBySlug = new Map(cats.map((c) => [c.slug, c.id]));
  for (const slug of categorySlugs) {
    if (!catIdBySlug.has(slug)) {
      throw new Error(`Category "${slug}" not found. Run prisma/seed.ts first.`);
    }
  }

  // --- 1. Single-category questions: update categoryId from null -> category ---
  let singleUpdated = 0;
  for (const [text, slug] of Object.entries(SINGLE_CATEGORY)) {
    const categoryId = catIdBySlug.get(slug)!;
    const res = await db.question.updateMany({
      where: { text, categoryId: null },
      data: { categoryId },
    });
    singleUpdated += res.count;
  }
  console.log(`Assigned ${singleUpdated} single-category questions.`);

  // --- 2. Person questions: duplicate into celebrities AND historical ---
  // The existing general row is assigned to celebrities; a new row is
  // created for historical (if missing).
  let personAssigned = 0;
  let personDuplicated = 0;
  for (const text of PERSON_QUESTIONS) {
    const celebsId = catIdBySlug.get("celebrities")!;
    const histId = catIdBySlug.get("historical")!;

    // Find the existing general question (categoryId: null) by text.
    const existing = await db.question.findFirst({
      where: { text, categoryId: null },
      select: { id: true, primaryTagId: true, inverted: true, sortOrder: true },
    });

    if (existing) {
      // Assign it to celebrities.
      await db.question.update({
        where: { id: existing.id },
        data: { categoryId: celebsId },
      });
      personAssigned += 1;

      // Create a duplicate for historical (if one doesn't already exist).
      const histExists = await db.question.findFirst({
        where: { text, categoryId: histId },
        select: { id: true },
      });
      if (!histExists) {
        await db.question.create({
          data: {
            text,
            primaryTagId: existing.primaryTagId,
            categoryId: histId,
            inverted: existing.inverted,
            sortOrder: existing.sortOrder,
            isActive: true,
          },
        });
        personDuplicated += 1;
      }
    } else {
      // Maybe it was already assigned to celebrities in a prior run.
      // Ensure historical copy exists.
      const celebsExists = await db.question.findFirst({
        where: { text, categoryId: celebsId },
        select: { id: true, primaryTagId: true, inverted: true, sortOrder: true },
      });
      if (celebsExists) {
        const histExists = await db.question.findFirst({
          where: { text, categoryId: histId },
          select: { id: true },
        });
        if (!histExists) {
          await db.question.create({
            data: {
              text,
              primaryTagId: celebsExists.primaryTagId,
              categoryId: histId,
              inverted: celebsExists.inverted,
              sortOrder: celebsExists.sortOrder,
              isActive: true,
            },
          });
          personDuplicated += 1;
        }
      }
    }
  }
  console.log(
    `Assigned ${personAssigned} person questions to celebrities; created ${personDuplicated} historical duplicates.`
  );

  // --- 3. Broad splitters: ensure they remain general (categoryId: null) ---
  // (No action needed; they should already be null. Just verify count.)
  const broadCount = await db.question.count({
    where: { text: { in: BROAD_SPLITTERS }, categoryId: null },
  });
  console.log(`${broadCount} broad splitters remain general (for Anything mode).`);

  // --- 4. Report final distribution ---
  console.log("\n=== FINAL DISTRIBUTION ===");
  const allCats = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, slug: true },
  });
  for (const c of allCats) {
    const q = await db.question.count({ where: { categoryId: c.id } });
    const e = await db.entity.count({ where: { categoryId: c.id } });
    console.log(`  ${c.slug.padEnd(14)} | ${String(e).padStart(3)} entities | ${String(q).padStart(3)} questions`);
  }
  const nullQ = await db.question.count({ where: { categoryId: null } });
  const totalQ = await db.question.count();
  console.log(`  ${"general".padEnd(14)} | ${"-".padStart(3)}          | ${String(nullQ).padStart(3)} questions (Anything mode)`);
  console.log(`  ${"TOTAL".padEnd(14)} |              | ${String(totalQ).padStart(3)} questions`);

  console.log("\nDone.");
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
