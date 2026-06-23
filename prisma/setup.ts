/**
 * GUESS MY ANYTHING — One-command database setup.
 *
 * Runs the full pipeline to (re)build a working database:
 *   1. prisma db push   — create/apply schema
 *   2. prisma/seed.ts   — base categories, entities, tags, questions, settings
 *   3. prisma/seed-all.ts — expanded animals/countries/sports data
 *   4. prisma/upgrade-jobs.ts — job industries + rare jobs + job questions
 *   5. prisma/upgrade-categories.ts — strict category lock (no off-category questions)
 *
 * Safe to run on a fresh DB or an existing one (all scripts are idempotent).
 *
 * Run: bun run db:setup
 */
import { db } from "../src/lib/db";

async function main() {
  console.log("=== GUESS MY ANYTHING — DB SETUP ===\n");
  console.log("DATABASE_URL =", process.env.DATABASE_URL ?? "(not set)");
  console.log("");

  // Step 1: Push schema
  console.log("Step 1/6: Pushing schema (prisma db push)...");
  const { execSync } = await import("node:child_process");
  execSync("bun run db:push --accept-data-loss", { stdio: "inherit" });
  console.log("✓ Schema pushed.\n");

  // Step 2: Base seed
  console.log("Step 2/6: Base seed (categories, entities, tags, questions)...");
  execSync("bun run prisma/seed.ts", { stdio: "inherit" });
  console.log("✓ Base seed complete.\n");

  // Step 3: Expanded data (animals/countries/sports)
  console.log("Step 3/6: Expanded data (animals, countries, sports)...");
  execSync("bun run prisma/seed-all.ts", { stdio: "inherit" });
  console.log("✓ Expanded data complete.\n");

  // Step 4: Jobs upgrade
  console.log("Step 4/6: Jobs upgrade (industries, rare jobs, job questions)...");
  execSync("bun run prisma/upgrade-jobs.ts", { stdio: "inherit" });
  console.log("✓ Jobs upgrade complete.\n");

  // Step 5: Jobs expanded (300+ jobs with 8-attribute tagging)
  console.log("Step 5/6: Jobs expanded (300+ jobs, 8-attribute tagging system)...");
  execSync("bun run prisma/upgrade-jobs-expanded.ts", { stdio: "inherit" });
  console.log("✓ Jobs expanded complete.\n");

  // Step 6: Category lock
  console.log("Step 6/6: Category lock (assign questions to categories)...");
  execSync("bun run prisma/upgrade-categories.ts", { stdio: "inherit" });
  console.log("✓ Category lock complete.\n");

  // Final report
  const [entities, questions, tags, categories] = await Promise.all([
    db.entity.count(),
    db.question.count(),
    db.tag.count(),
    db.category.count(),
  ]);
  console.log("=== SETUP COMPLETE ===");
  console.log(`  Categories: ${categories}`);
  console.log(`  Entities:   ${entities}`);
  console.log(`  Questions:  ${questions}`);
  console.log(`  Tags:       ${tags}`);
  console.log("");
  console.log("Your database is ready. Run `bun run dev` to start playing.");

  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
