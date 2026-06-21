/**
 * RESTORE-1 — Idempotent restoration script for partially-reset database.
 *
 * Performs ALL of the following (safe to run multiple times):
 *   1. Cleans fictional characters from the animals category.
 *   2. Adds ALL ~195 UN-recognized countries to the countries category with
 *      rich, fingerprint-style tags for >90% guessing accuracy.
 *   3. Adds ALL ~195 sports to the sports category with rich tags
 *      (team/individual, ball/racket/water/winter/combat/motor/etc.).
 *   4. Adds 25-30 category-specific questions per category
 *      (animals, characters, countries, movies, tv-shows, video-games,
 *       celebrities, sports, brands, objects, historical) — each scoped to
 *      that category so the strict category lock works.
 *   5. Seeds 25+ life-stage age questions in the AgeQuestion table.
 *
 * Run:  bun run prisma/restore-data.ts
 */

import { db } from "../src/lib/db";

// ============================================================
// Helpers
// ============================================================

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

async function ensureEntity(opts: {
  name: string;
  categoryId: string;
  subcategoryId?: string | null;
  tags: string[];
  description?: string;
  popularity?: number;
  difficulty?: number;
}): Promise<void> {
  const slug = slugify(opts.name);
  const existing = await db.entity.findUnique({
    where: { categoryId_slug: { categoryId: opts.categoryId, slug } },
    include: { tags: true },
  });

  // Resolve all tags first.
  const tagSlugs: string[] = [];
  const tagIds: string[] = [];
  for (const t of opts.tags) {
    const tag = await ensureTag(t);
    if (!tagSlugs.includes(tag.slug)) {
      tagSlugs.push(tag.slug);
      tagIds.push(tag.id);
    }
  }

  if (existing) {
    const existingTagIds = new Set(existing.tags.map((et) => et.tagId));
    for (const tagId of tagIds) {
      if (!existingTagIds.has(tagId)) {
        await db.entityTag.create({
          data: { entityId: existing.id, tagId, weight: 1 },
        });
      }
    }
    // Merge tagCache.
    const allTagSlugs = new Set<string>(
      existing.tagCache.split(",").filter(Boolean)
    );
    for (const s of tagSlugs) allTagSlugs.add(s);
    await db.entity.update({
      where: { id: existing.id },
      data: {
        tagCache: Array.from(allTagSlugs).join(","),
        description: opts.description ?? existing.description,
        popularity: opts.popularity ?? existing.popularity,
      },
    });
    return;
  }

  await db.entity.create({
    data: {
      name: opts.name,
      slug,
      description: opts.description ?? null,
      categoryId: opts.categoryId,
      subcategoryId: opts.subcategoryId ?? null,
      difficulty: opts.difficulty ?? 1,
      popularity: opts.popularity ?? 50,
      tagCache: tagSlugs.join(","),
      tags: {
        create: tagIds.map((id) => ({ tagId: id, weight: 1 })),
      },
    },
  });
}

async function ensureQuestion(
  text: string,
  tagSlug: string,
  categoryId: string,
  inverted = false
): Promise<void> {
  const existing = await db.question.findFirst({ where: { text } });
  if (existing) return;
  const tag = await ensureTag(tagSlug);
  await db.question.create({
    data: { text, primaryTagId: tag.id, categoryId, inverted },
  });
}

// ============================================================
// 1. CLEAN ANIMALS — remove fictional characters
// ============================================================

// Names of fictional characters that have been mis-categorized as animals.
// Includes common cartoon/movie/animal mascots plus known fictional names.
const FICTIONAL_ANIMAL_NAMES = new Set([
  "Pikachu",
  "Scooby-Doo",
  "Mickey Mouse",
  "Minnie Mouse",
  "Bugs Bunny",
  "Garfield",
  "Simba",
  "Nemo",
  "Dory",
  "Toothless",
  "Rigby",
  "Mordecai",
  "Snoopy",
  "Tweety",
  "Tweety Bird",
  "Daffy Duck",
  "Donald Duck",
  "Daisy Duck",
  "Goofy",
  "Pluto",
  "Dumbo",
  "Bambi",
  "Thumper",
  "Tigger",
  "Winnie the Pooh",
  "Eeyore",
  "Piglet",
  "Road Runner",
  "Tom",
  "Jerry",
  "Stitch",
  "Lassie",
  "Rin Tin Tin",
  "Mr. Ed",
  "Babe",
  "Wilbur",
  "Charlotte",
  "Stuart Little",
  "Reepicheep",
  "Rocket Raccoon",
  "Bullwinkle",
  "Rocky the Flying Squirrel",
  "Secret Squirrel",
  "Howard the Duck",
  "Woodstock",
  "Hedwig",
  "Buckbeak",
  "Fawkes",
  "Scabbers",
  "Scooby Doo",
  "Scrappy-Doo",
  "Yogi Bear",
  "Boo-Boo Bear",
  "Baloo",
  "Bagheera",
  "Shere Khan",
  "Kaa",
  "Rajah",
  "Abu",
  "Raja",
  "Sebastian",
  "Flounder",
  "Sebastien",
  "Iago",
  "Zazu",
  "Timon",
  "Pumbaa",
  "Rafiki",
  "Mushu",
  "Cri-Kee",
  "Hei Hei",
  "Pua",
  "Sven",
  "Olaf",
  "Donkey",
  "Puss in Boots",
  "Sid",
  "Scrat",
  "Diego",
  "Manny",
  "Alex",
  "Marty",
  "Melman",
  "Gloria",
  "King Julien",
  "Mort",
  "Skipper",
  "Kowalski",
  "Private",
  "Rico",
  "Po",
  "Shifu",
  "Tigress",
  "Tai Lung",
  "Kung Fu Panda",
  "SpongeBob",
  "Patrick",
  "Squidward",
  "Mr. Krabs",
  "Sandy",
  "Plankton",
  "Gary",
  "Nessie",
  "Bigfoot",
  "Yeti",
  "Jackalope",
  "Unicorn",
  "Dragon",
  "Griffin",
  "Phoenix",
  "Centaur",
  "Pegasus",
  "Mermaid",
  "Loch Ness Monster",
  "Godzilla",
  "King Kong",
  "Mothra",
]);

async function cleanAnimals(): Promise<void> {
  console.log("\n[1/5] Cleaning animals category...");
  const cat = await db.category.findUnique({ where: { slug: "animals" } });
  if (!cat) {
    console.log("  animals category not found — skipping");
    return;
  }
  // Delete entities whose name contains parentheses (movie/show ref)
  // OR matches a known fictional character name.
  const fictionalNamesArray = Array.from(FICTIONAL_ANIMAL_NAMES);
  const result = await db.entity.deleteMany({
    where: {
      categoryId: cat.id,
      OR: [
        { name: { contains: "(" } },
        { name: { contains: " (" } },
        { name: { in: fictionalNamesArray } },
      ],
    },
  });
  console.log(`  Removed ${result.count} fictional animal(s).`);
}

// ============================================================
// 2. COUNTRIES — all ~195 UN member states + observers
// ============================================================

type CountrySpec = {
  n: string; // name
  c: "asia" | "europe" | "americas" | "africa" | "oceania";
  r?: string; // sub-region slug
  d?: 1 | 0; // developed?
  s?: "l" | "m" | "s"; // large / medium / small
  cl?: string[]; // climate tags
  i?: 1 | 0; // island
  ll?: 1 | 0; // landlocked
  lang?: string[]; // languages (no -speaking suffix)
  m?: 1 | 0; // monarchy
  anc?: 1 | 0; // ancient-place
  tech?: 1 | 0; // tech-advanced
  pop?: 1 | 0; // populous
  u?: string[]; // unique identifying tags
  p?: number; // popularity
  desc?: string;
};

function countryTags(c: CountrySpec): string[] {
  const t: string[] = ["place", "country"];
  const contTag =
    c.c === "asia"
      ? "asian"
      : c.c === "europe"
      ? "european"
      : c.c === "americas"
      ? "american"
      : c.c === "africa"
      ? "african"
      : "oceanian";
  t.push(contTag);
  if (c.r) t.push(c.r);
  t.push(c.s === "l" ? "large" : c.s === "s" ? "small" : "medium");
  t.push(c.d === 1 ? "developed" : "developing");
  if (c.pop === 1) t.push("populous");
  if (c.cl) for (const cl of c.cl) t.push(cl);
  if (c.i === 1) t.push("island");
  if (c.ll === 1) t.push("landlocked");
  if (c.lang) for (const l of c.lang) t.push(`${l}-speaking`);
  if (c.m === 1) t.push("monarchy");
  if (c.anc === 1) t.push("ancient-place");
  if (c.tech === 1) t.push("tech-advanced");
  if (c.u) for (const u of c.u) t.push(u);
  return t;
}

const COUNTRIES: CountrySpec[] = [
  // ----- ASIA (48) -----
  { n: "Afghanistan", c: "asia", r: "south-asia", d: 0, s: "m", cl: ["hot", "cold", "mountainous"], ll: 1, lang: ["persian"], anc: 1, u: ["hindu-kush", "poppies", "taliban"], p: 55, desc: "A mountainous, landlocked South Asian country with ancient history." },
  { n: "Armenia", c: "asia", r: "caucasus", d: 0, s: "s", cl: ["temperate", "mountainous"], ll: 1, lang: ["russian"], anc: 1, u: ["first-christian-country", "mount-ararat"], p: 55, desc: "A Caucasus nation, the first to adopt Christianity." },
  { n: "Azerbaijan", c: "asia", r: "caucasus", d: 0, s: "m", cl: ["temperate"], ll: 1, lang: ["turkish"], u: ["caspian-sea", "fire-temple", "oil"], p: 60, desc: "A Caucasus nation on the Caspian Sea known for fire temples." },
  { n: "Bahrain", c: "asia", r: "middle-east", d: 1, s: "s", cl: ["hot", "desert"], i: 1, lang: ["arabic"], m: 1, u: ["f1-night-race", "oil-rich"], p: 60, desc: "A small island monarchy in the Persian Gulf." },
  { n: "Bangladesh", c: "asia", r: "south-asia", d: 0, s: "m", cl: ["tropical", "hot"], lang: ["bengali"], pop: 1, u: ["ganges-delta", "bengal-tigers", "densely-populated"], p: 65, desc: "A populous, river-delta South Asian nation." },
  { n: "Bhutan", c: "asia", r: "south-asia", d: 0, s: "s", cl: ["cold", "mountainous"], ll: 1, lang: ["tibetan"], m: 1, u: ["happiness-index", "mountains", "buddhist-kingdom"], p: 55, desc: "A Himalayan Buddhist kingdom measuring gross national happiness." },
  { n: "Brunei", c: "asia", r: "southeast-asia", d: 1, s: "s", cl: ["tropical", "hot"], i: 1, lang: ["malay"], m: 1, u: ["oil-rich", "rainforest", "sultan"], p: 55, desc: "A tiny, oil-rich sultanate on Borneo." },
  { n: "Cambodia", c: "asia", r: "southeast-asia", d: 0, s: "m", cl: ["tropical", "hot"], lang: ["khmer"], anc: 1, u: ["angkor-wat", "killing-fields", "mekong"], p: 65, desc: "A Southeast Asian kingdom home to Angkor Wat." },
  { n: "China", c: "asia", r: "east-asia", d: 0, s: "l", cl: ["temperate", "cold", "hot", "mountainous"], lang: ["chinese"], anc: 1, tech: 1, pop: 1, u: ["great-wall", "pandas", "communist", "tea-origin", "silkworm", "ming-dynasty"], p: 92, desc: "The world's most populous nation and a rising superpower." },
  { n: "Cyprus", c: "asia", r: "middle-east", d: 1, s: "s", cl: ["hot", "mediterranean"], i: 1, lang: ["greek"], u: ["divided-island", "aphrodite", "eu-member"], p: 60, desc: "A Mediterranean island divided between Greek and Turkish sides." },
  { n: "Georgia", c: "asia", r: "caucasus", d: 0, s: "s", cl: ["temperate", "mountainous"], ll: 1, lang: ["georgian"], anc: 1, u: ["wine-origin", "caucasus", "black-sea"], p: 60, desc: "A Caucasus nation, the alleged birthplace of wine." },
  { n: "India", c: "asia", r: "south-asia", d: 0, s: "l", cl: ["tropical", "hot", "temperate", "mountainous"], lang: ["hindi", "english"], anc: 1, tech: 1, pop: 1, u: ["taj-mahal", "bollywood", "spicy-food", "curry", "yoga-origin", "ganges"], p: 90, desc: "The world's most populous democracy and a rising tech power." },
  { n: "Indonesia", c: "asia", r: "southeast-asia", d: 0, s: "l", cl: ["tropical", "hot"], i: 1, lang: ["indonesian"], pop: 1, u: ["volcanoes", "bali", "komodo-dragons", "archipelago"], p: 75, desc: "The world's largest archipelago with active volcanoes." },
  { n: "Iran", c: "asia", r: "middle-east", d: 0, s: "l", cl: ["hot", "desert", "cold"], lang: ["persian"], anc: 1, u: ["persian-empire", "carpets", "pistachios", "persian-cats", "theocracy"], p: 75, desc: "A large Middle Eastern nation once the heart of the Persian Empire." },
  { n: "Iraq", c: "asia", r: "middle-east", d: 0, s: "m", cl: ["hot", "desert"], lang: ["arabic"], anc: 1, u: ["mesopotamia", "babylon", "baghdad", "tigris-euphrates"], p: 70, desc: "The cradle of civilization between the Tigris and Euphrates." },
  { n: "Israel", c: "asia", r: "middle-east", d: 1, s: "s", cl: ["hot", "mediterranean"], lang: ["hebrew"], tech: 1, u: ["holy-land", "jerusalem", "startup-nation", "dead-sea"], p: 78, desc: "A high-tech Middle Eastern nation sacred to three religions." },
  { n: "Japan", c: "asia", r: "east-asia", d: 1, s: "m", cl: ["temperate", "cold", "mountainous"], i: 1, lang: ["japanese"], tech: 1, anc: 1, pop: 1, u: ["sushi", "anime-origin", "mount-fuji", "samurai", "cherry-blossoms", "tokyo", "bullet-train"], p: 95, desc: "An island nation blending ancient tradition with cutting-edge technology." },
  { n: "Jordan", c: "asia", r: "middle-east", d: 0, s: "m", cl: ["hot", "desert"], ll: 1, lang: ["arabic"], m: 1, u: ["petra", "dead-sea", "hashemite-kingdom"], p: 65, desc: "A Middle Eastern kingdom home to Petra and the Dead Sea." },
  { n: "Kazakhstan", c: "asia", r: "central-asia", d: 0, s: "l", cl: ["cold", "desert", "temperate"], ll: 1, lang: ["russian"], u: ["steppes", "baikonur", "oil"], p: 65, desc: "The largest landlocked country and Central Asian giant." },
  { n: "Kuwait", c: "asia", r: "middle-east", d: 1, s: "s", cl: ["hot", "desert"], lang: ["arabic"], m: 1, u: ["oil-rich", "gulf-war", "kuwait-towers"], p: 65, desc: "A small, oil-rich Gulf monarchy." },
  { n: "Kyrgyzstan", c: "asia", r: "central-asia", d: 0, s: "m", cl: ["cold", "mountainous"], ll: 1, lang: ["russian"], u: ["tien-shan", "nomadic", "yurt"], p: 55, desc: "A mountainous, nomadic Central Asian republic." },
  { n: "Laos", c: "asia", r: "southeast-asia", d: 0, s: "m", cl: ["tropical", "hot"], ll: 1, lang: ["lao"], m: 1, u: ["mekong", "land-of-million-elephants", "communist"], p: 55, desc: "A landlocked, communist Southeast Asian kingdom." },
  { n: "Lebanon", c: "asia", r: "middle-east", d: 0, s: "s", cl: ["mediterranean", "hot"], lang: ["arabic", "french"], anc: 1, u: ["cedars", "beirut", "phoenicians", "ancient-ports"], p: 65, desc: "A Mediterranean Levantine nation with ancient Phoenician roots." },
  { n: "Malaysia", c: "asia", r: "southeast-asia", d: 1, s: "m", cl: ["tropical", "hot"], lang: ["malay"], m: 1, u: ["petronas-towers", "rainforest", "kuala-lumpur"], p: 70, desc: "A Southeast Asian monarchy of rainforests and modern skylines." },
  { n: "Maldives", c: "asia", r: "south-asia", d: 0, s: "s", cl: ["tropical", "hot"], i: 1, lang: ["dhivehi"], u: ["atolls", "beaches", "sinking"], p: 60, desc: "A tropical Indian Ocean archipelago of coral atolls." },
  { n: "Mongolia", c: "asia", r: "east-asia", d: 0, s: "l", cl: ["cold", "desert"], ll: 1, lang: ["mongolian"], anc: 1, u: ["genghis-khan", "steppes", "gers", "nomadic"], p: 60, desc: "A vast, sparsely populated steppes nation of nomadic heritage." },
  { n: "Myanmar", c: "asia", r: "southeast-asia", d: 0, s: "m", cl: ["tropical", "hot"], lang: ["burmese"], u: ["pagodas", "yangon", "military-junta"], p: 60, desc: "A Southeast Asian nation of golden pagodas and the Irrawaddy." },
  { n: "Nepal", c: "asia", r: "south-asia", d: 0, s: "m", cl: ["cold", "mountainous", "temperate"], ll: 1, lang: ["nepali"], u: ["mount-everest", "buddha-birthplace", "himalayas", "sherpa"], p: 70, desc: "A Himalayan kingdom home to Mount Everest." },
  { n: "North Korea", c: "asia", r: "east-asia", d: 0, s: "s", cl: ["temperate", "cold"], ll: 1, lang: ["korean"], u: ["dictatorship", "isolated", "nuclear-armed", "communist"], p: 65, desc: "A secretive, authoritarian East Asian state." },
  { n: "Oman", c: "asia", r: "middle-east", d: 1, s: "m", cl: ["hot", "desert"], lang: ["arabic"], m: 1, u: ["frankincense", "muscat", "sultan"], p: 60, desc: "A Gulf sultanate known for frankincense and historic ports." },
  { n: "Pakistan", c: "asia", r: "south-asia", d: 0, s: "m", cl: ["hot", "desert", "cold", "mountainous"], lang: ["urdu", "english"], anc: 1, pop: 1, u: ["indus-valley", "k2", "karachi", "cricket-mad"], p: 70, desc: "A populous South Asian nation with the Indus Valley heritage." },
  { n: "Palestine", c: "asia", r: "middle-east", d: 0, s: "s", cl: ["hot", "mediterranean"], lang: ["arabic"], anc: 1, u: ["gaza", "west-bank", "bethlehem", "jerusalem-dispute"], p: 70, desc: "A Levantine state spanning the West Bank and Gaza." },
  { n: "Philippines", c: "asia", r: "southeast-asia", d: 0, s: "m", cl: ["tropical", "hot"], i: 1, lang: ["filipino", "english"], pop: 1, u: ["beaches", "typhoons", "manila", "rice-terraces"], p: 70, desc: "A tropical Southeast Asian archipelago of 7,000+ islands." },
  { n: "Qatar", c: "asia", r: "middle-east", d: 1, s: "s", cl: ["hot", "desert"], lang: ["arabic"], m: 1, tech: 1, u: ["world-cup-2022", "al-jazeera", "oil-rich", "doha"], p: 70, desc: "A wealthy Gulf emirate that hosted the 2022 FIFA World Cup." },
  { n: "Saudi Arabia", c: "asia", r: "middle-east", d: 1, s: "l", cl: ["hot", "desert"], lang: ["arabic"], m: 1, u: ["mecca", "oil", "desert", "islam-birthplace", "medina"], p: 78, desc: "A vast desert monarchy, birthplace of Islam." },
  { n: "Singapore", c: "asia", r: "southeast-asia", d: 1, s: "s", cl: ["tropical", "hot"], i: 1, lang: ["english", "malay", "chinese"], tech: 1, u: ["marina-bay", "clean-city", "garden-city", "lion-city"], p: 78, desc: "A high-tech island city-state at the tip of Malaya." },
  { n: "South Korea", c: "asia", r: "east-asia", d: 1, s: "s", cl: ["temperate", "cold"], lang: ["korean"], tech: 1, u: ["kpop", "kimchi", "samsung", "seoul", "gangnam"], p: 85, desc: "A tech-forward East Asian democracy and cultural exporter." },
  { n: "Sri Lanka", c: "asia", r: "south-asia", d: 0, s: "s", cl: ["tropical", "hot"], i: 1, lang: ["sinhala"], u: ["tea", "ceylon", "elephants", "gems"], p: 65, desc: "A tropical island nation famous for tea and elephants." },
  { n: "Syria", c: "asia", r: "middle-east", d: 0, s: "m", cl: ["hot", "mediterranean", "desert"], lang: ["arabic"], anc: 1, u: ["damascus", "war-torn", "aleppo", "oldest-city"], p: 65, desc: "A Levantine nation home to Damascus, the oldest city." },
  { n: "Tajikistan", c: "asia", r: "central-asia", d: 0, s: "s", cl: ["cold", "mountainous"], ll: 1, lang: ["tajik"], u: ["pamirs", "mountains", "silk-road"], p: 55, desc: "A mountainous Central Asian republic on the Silk Road." },
  { n: "Thailand", c: "asia", r: "southeast-asia", d: 0, s: "m", cl: ["tropical", "hot"], lang: ["thai"], m: 1, u: ["beaches", "spicy-food", "bangkok", "buddhism", "temples", "pad-thai"], p: 78, desc: "A Southeast Asian kingdom of beaches, temples, and street food." },
  { n: "Timor-Leste", c: "asia", r: "southeast-asia", d: 0, s: "s", cl: ["tropical", "hot"], i: 1, lang: ["portuguese"], u: ["newest-asian-nation", "coffee"], p: 50, desc: "The newest sovereign state in Southeast Asia." },
  { n: "Turkey", c: "asia", r: "middle-east", d: 0, s: "l", cl: ["temperate", "mediterranean", "cold"], lang: ["turkish"], anc: 1, u: ["istanbul", "ottoman-empire", "kebab", "cappadocia", "transcontinental"], p: 80, desc: "A transcontinental republic bridging Europe and Asia." },
  { n: "Turkmenistan", c: "asia", r: "central-asia", d: 0, s: "m", cl: ["hot", "desert"], ll: 1, lang: ["turkmen"], u: ["darvaza-gas-crater", "cotton", "natural-gas"], p: 55, desc: "A Central Asian republic known for its 'Gates of Hell' crater." },
  { n: "United Arab Emirates", c: "asia", r: "middle-east", d: 1, s: "s", cl: ["hot", "desert"], lang: ["arabic"], m: 1, tech: 1, u: ["dubai", "burj-khalifa", "oil-rich", "federation"], p: 80, desc: "A federation of seven Gulf emirates home to Dubai." },
  { n: "Uzbekistan", c: "asia", r: "central-asia", d: 0, s: "m", cl: ["hot", "desert"], ll: 1, lang: ["uzbek"], anc: 1, u: ["silk-road", "samarkand", "registan"], p: 60, desc: "A Silk Road Central Asian republic of blue-tiled mosques." },
  { n: "Vietnam", c: "asia", r: "southeast-asia", d: 0, s: "m", cl: ["tropical", "hot"], lang: ["vietnamese"], u: ["pho", "halong-bay", "war-history", "motorbikes"], p: 72, desc: "A Southeast Asian nation of pho, motorbikes, and Halong Bay." },
  { n: "Yemen", c: "asia", r: "middle-east", d: 0, s: "m", cl: ["hot", "desert"], lang: ["arabic"], anc: 1, u: ["sanaa", "frankincense", "war-torn", "socotra"], p: 60, desc: "A southern Arabian nation of ancient tower-houses." },

  // ----- EUROPE (44) -----
  { n: "Albania", c: "europe", r: "balkans", d: 0, s: "s", cl: ["mediterranean", "temperate", "mountainous"], lang: ["albanian"], u: ["bunkers", "adriatic", "skanderbeg"], p: 60, desc: "A Balkan nation on the Adriatic with concrete bunkers." },
  { n: "Andorra", c: "europe", r: "western-europe", d: 1, s: "s", cl: ["mountainous", "cold"], ll: 1, lang: ["catalan"], u: ["pyrenees", "co-principality", "ski-resorts"], p: 50, desc: "A tiny co-principality tucked in the Pyrenees." },
  { n: "Austria", c: "europe", r: "western-europe", d: 1, s: "s", cl: ["temperate", "cold", "mountainous"], ll: 1, lang: ["german"], u: ["alps", "mozart", "vienna", "strudel", "skiing"], p: 75, desc: "An Alpine German-speaking republic of music and mountains." },
  { n: "Belarus", c: "europe", r: "eastern-europe", d: 0, s: "m", cl: ["cold", "temperate"], ll: 1, lang: ["russian", "belarusian"], u: ["minsk", "dictatorship", "chernobyl-affected"], p: 60, desc: "An Eastern European republic under long-standing authoritarian rule." },
  { n: "Belgium", c: "europe", r: "western-europe", d: 1, s: "s", cl: ["temperate"], lang: ["dutch", "french", "german"], m: 1, u: ["chocolate", "waffles", "brussels-eu", "fries", "tintin"], p: 75, desc: "A trilingual kingdom of chocolate, waffles, and EU institutions." },
  { n: "Bosnia and Herzegovina", c: "europe", r: "balkans", d: 0, s: "s", cl: ["temperate", "mountainous"], ll: 1, u: ["sarajevo", "war-1990s", "mostar-bridge"], p: 60, desc: "A Balkan federation scarred by 1990s war." },
  { n: "Bulgaria", c: "europe", r: "balkans", d: 0, s: "s", cl: ["temperate", "cold"], lang: ["bulgarian"], u: ["black-sea", "rose-oil", "yogurt", "cyrillic"], p: 65, desc: "A Balkan republic on the Black Sea known for rose oil." },
  { n: "Croatia", c: "europe", r: "balkans", d: 1, s: "s", cl: ["mediterranean", "temperate"], u: ["adriatic-coast", "dubrovnik", "necktie-origin"], p: 70, desc: "An Adriatic nation famed for its coastline and Dubrovnik." },
  { n: "Czech Republic", c: "europe", r: "central-europe", d: 1, s: "s", cl: ["temperate", "cold"], ll: 1, lang: ["czech"], u: ["prague", "beer", "havel", "bohemia"], p: 75, desc: "A Central European republic of Prague and pilsner beer." },
  { n: "Denmark", c: "europe", r: "scandinavia", d: 1, s: "s", cl: ["cold", "temperate"], lang: ["danish"], m: 1, u: ["lego", "copenhagen", "bicycles", "vikings", "hans-christian-andersen"], p: 78, desc: "A Scandinavian kingdom of Lego, bicycles, and Vikings." },
  { n: "Estonia", c: "europe", r: "baltic", d: 1, s: "s", cl: ["cold", "temperate"], lang: ["estonian"], tech: 1, u: ["digital-society", "skype-origin", "tallinn", "saunas"], p: 65, desc: "A digital-forward Baltic republic and Skype birthplace." },
  { n: "Finland", c: "europe", r: "scandinavia", d: 1, s: "m", cl: ["cold"], lang: ["finnish"], u: ["sauna", "santa-claus", "nokia", "lapland", "thousand-lakes"], p: 78, desc: "A Nordic republic of saunas, lakes, and Santa's home." },
  { n: "France", c: "europe", r: "western-europe", d: 1, s: "m", cl: ["temperate", "mediterranean", "cold"], lang: ["french"], m: 1, anc: 1, tech: 1, u: ["eiffel-tower", "wine", "fashion", "paris", "romantic", "croissant", "louvre", "champs-elysees"], p: 92, desc: "A Western European republic of fashion, wine, and the Eiffel Tower." },
  { n: "Germany", c: "europe", r: "western-europe", d: 1, s: "m", cl: ["temperate", "cold"], lang: ["german"], tech: 1, u: ["cars", "beer", "berlin-wall", "oktoberfest", "autobahn", "sausages"], p: 90, desc: "A Central European economic powerhouse of cars and beer." },
  { n: "Greece", c: "europe", r: "southern-europe", d: 1, s: "s", cl: ["mediterranean", "hot"], lang: ["greek"], anc: 1, u: ["acropolis", "islands", "olives", "santorini", "democracy-origin", "mythology"], p: 82, desc: "A Mediterranean nation, the cradle of Western civilization." },
  { n: "Hungary", c: "europe", r: "central-europe", d: 0, s: "s", cl: ["temperate"], ll: 1, lang: ["hungarian"], u: ["budapest", "paprika", "danube", "goulash"], p: 70, desc: "A Central European republic of Budapest and the Danube." },
  { n: "Iceland", c: "europe", r: "scandinavia", d: 1, s: "s", cl: ["cold"], i: 1, lang: ["icelandic"], u: ["geysers", "volcanoes", "bjork", "northern-lights", "bjork-music"], p: 70, desc: "A volcanic North Atlantic island of geysers and auroras." },
  { n: "Ireland", c: "europe", r: "western-europe", d: 1, s: "s", cl: ["temperate", "rainy"], i: 1, lang: ["english", "irish"], u: ["guinness", "leprechauns", "green", "dublin", "potatoes", "celtic"], p: 78, desc: "An Emerald Isle republic of Guinness and Celtic heritage." },
  { n: "Italy", c: "europe", r: "southern-europe", d: 1, s: "m", cl: ["mediterranean", "temperate"], lang: ["italian"], anc: 1, u: ["pasta", "pizza", "rome", "venice", "fashion", "colosseum", "renaissance", "tuscany"], p: 90, desc: "A Mediterranean republic of pasta, pizza, and Renaissance art." },
  { n: "Latvia", c: "europe", r: "baltic", d: 1, s: "s", cl: ["cold", "temperate"], lang: ["latvian"], u: ["riga", "forests", "amber"], p: 60, desc: "A Baltic republic of forests and Art Nouveau Riga." },
  { n: "Liechtenstein", c: "europe", r: "western-europe", d: 1, s: "s", cl: ["mountainous", "cold"], ll: 1, lang: ["german"], m: 1, u: ["alpine", "tiny", "banking"], p: 50, desc: "A tiny Alpine principality known for banking." },
  { n: "Lithuania", c: "europe", r: "baltic", d: 1, s: "s", cl: ["cold", "temperate"], ll: 1, lang: ["lithuanian"], u: ["vilnius", "amber", "basketball"], p: 60, desc: "A Baltic republic of amber and basketball." },
  { n: "Luxembourg", c: "europe", r: "western-europe", d: 1, s: "s", cl: ["temperate"], ll: 1, lang: ["french", "german"], m: 1, u: ["wealthy", "eu-capital", "banking"], p: 65, desc: "A wealthy grand duchy and EU capital." },
  { n: "Malta", c: "europe", r: "southern-europe", d: 1, s: "s", cl: ["mediterranean", "hot"], i: 1, lang: ["maltese", "english"], u: ["knights-of-malta", "tiny-island", "meghalithic-temples"], p: 60, desc: "A Mediterranean island republic of historic knights." },
  { n: "Moldova", c: "europe", r: "eastern-europe", d: 0, s: "s", cl: ["temperate"], ll: 1, lang: ["romanian"], u: ["wine", "poorest-europe", "chisinau"], p: 55, desc: "One of Europe's poorest republics, known for wine." },
  { n: "Monaco", c: "europe", r: "western-europe", d: 1, s: "s", cl: ["mediterranean"], lang: ["french"], m: 1, u: ["casino", "f1-monaco", "millionaires", "monte-carlo"], p: 65, desc: "A tiny Riviera principality of casinos and millionaires." },
  { n: "Montenegro", c: "europe", r: "balkans", d: 0, s: "s", cl: ["mediterranean", "mountainous"], u: ["kotor-bay", "mountains", "adriatic"], p: 60, desc: "A Balkan republic of mountains and the Bay of Kotor." },
  { n: "Netherlands", c: "europe", r: "western-europe", d: 1, s: "s", cl: ["temperate", "rainy"], lang: ["dutch"], u: ["windmills", "tulips", "amsterdam", "bicycles", "canals", "weed-legal", "dutch-masters"], p: 82, desc: "A low-lying kingdom of windmills, tulips, and canals." },
  { n: "North Macedonia", c: "europe", r: "balkans", d: 0, s: "s", cl: ["temperate", "mountainous"], ll: 1, u: ["skopje", "ohrid-lake", "alexander-the-great"], p: 55, desc: "A Balkan republic on Lake Ohrid." },
  { n: "Norway", c: "europe", r: "scandinavia", d: 1, s: "m", cl: ["cold"], lang: ["norwegian"], m: 1, u: ["fjords", "oil", "salmon", "midnight-sun", "vikings", "sami"], p: 80, desc: "A Scandinavian kingdom of fjords and oil wealth." },
  { n: "Poland", c: "europe", r: "central-europe", d: 0, s: "m", cl: ["temperate", "cold"], ll: 1, lang: ["polish"], u: ["pierogi", "warsaw", "auschwitz", "krakow", "chopin"], p: 75, desc: "A Central European republic of pierogi and Chopin." },
  { n: "Portugal", c: "europe", r: "southern-europe", d: 1, s: "s", cl: ["mediterranean", "temperate"], lang: ["portuguese"], u: ["port-wine", "lisbon", "explorers", "azulejos", "fado-music"], p: 78, desc: "An Iberian republic of explorers and port wine." },
  { n: "Romania", c: "europe", r: "eastern-europe", d: 0, s: "m", cl: ["temperate", "cold"], lang: ["romanian"], u: ["dracula", "carpathians", "transylvania", "bucharest"], p: 70, desc: "An Eastern European republic of Transylvania and Dracula." },
  { n: "Russia", c: "europe", r: "eastern-europe", d: 0, s: "l", cl: ["cold", "temperate", "desert"], lang: ["russian"], anc: 1, pop: 1, u: ["vodka", "kremlin", "largest-country", "transcontinental", "moscow", "trans-siberian", "tundra"], p: 88, desc: "The world's largest country, spanning eleven time zones." },
  { n: "San Marino", c: "europe", r: "southern-europe", d: 1, s: "s", cl: ["mediterranean", "temperate"], ll: 1, lang: ["italian"], u: ["oldest-republic", "tiny", "monte-titano"], p: 50, desc: "The world's oldest surviving republic, enclaved in Italy." },
  { n: "Serbia", c: "europe", r: "balkans", d: 0, s: "s", cl: ["temperate", "cold"], ll: 1, u: ["belgrade", "slivovitz", "rakija"], p: 65, desc: "A Balkan republic on the Danube at Belgrade." },
  { n: "Slovakia", c: "europe", r: "central-europe", d: 0, s: "s", cl: ["temperate", "mountainous"], ll: 1, lang: ["slovak"], u: ["tatras", "castles", "bratislava"], p: 65, desc: "A Central European republic of castles and the Tatras." },
  { n: "Slovenia", c: "europe", r: "central-europe", d: 1, s: "s", cl: ["alpine", "mediterranean"], u: ["ljubljana", "mountains", "caves", "bled-lake"], p: 65, desc: "A small Alpine republic of caves and Lake Bled." },
  { n: "Spain", c: "europe", r: "southern-europe", d: 1, s: "m", cl: ["mediterranean", "hot", "temperate"], lang: ["spanish"], m: 1, u: ["flamenco", "bullfighting", "fiesta", "tapas", "paella", "siesta", "gaudi"], p: 85, desc: "An Iberian kingdom of flamenco, fiestas, and tapas." },
  { n: "Sweden", c: "europe", r: "scandinavia", d: 1, s: "m", cl: ["cold", "temperate"], lang: ["swedish"], m: 1, u: ["ikea", "abba", "meatballs", "welfare-state", "stockholm", "nobel-prize"], p: 82, desc: "A Scandinavian kingdom of IKEA, ABBA, and the Nobel Prize." },
  { n: "Switzerland", c: "europe", r: "western-europe", d: 1, s: "s", cl: ["mountainous", "cold", "temperate"], ll: 1, lang: ["german", "french", "italian"], u: ["alps", "chocolate", "watches", "neutrality", "banks", "matterhorn", "cuckoo-clocks"], p: 85, desc: "A neutral Alpine republic of banks, watches, and chocolate." },
  { n: "Ukraine", c: "europe", r: "eastern-europe", d: 0, s: "l", cl: ["temperate", "cold"], ll: 1, lang: ["ukrainian"], u: ["kiev", "chernobyl", "wheat", "war-2022", "maidan"], p: 80, desc: "A large Eastern European republic known for wheat fields." },
  { n: "United Kingdom", c: "europe", r: "western-europe", d: 1, s: "m", cl: ["temperate", "rainy"], i: 1, lang: ["english"], m: 1, anc: 1, tech: 1, u: ["royal-family", "tea", "big-ben", "london", "beatles", "shakespeare", "tube", "the-crown"], p: 93, desc: "A union of four nations of tea, the royal family, and Shakespeare." },
  { n: "Vatican City", c: "europe", r: "southern-europe", d: 1, s: "s", cl: ["mediterranean"], ll: 1, lang: ["italian", "latin"], u: ["pope", "smallest-country", "catholic", "st-peters"], p: 70, desc: "The smallest country in the world, the seat of the Pope." },

  // ----- AMERICAS (35) -----
  { n: "Antigua and Barbuda", c: "americas", r: "caribbean", d: 0, s: "s", cl: ["tropical", "hot"], i: 1, lang: ["english"], m: 1, u: ["beaches", "cricket", "sailing-week"], p: 50, desc: "A three-island Caribbean monarchy of beaches and cricket." },
  { n: "Bahamas", c: "americas", r: "caribbean", d: 0, s: "s", cl: ["tropical", "hot"], i: 1, lang: ["english"], m: 1, u: ["pirates", "pig-beach", "atlantis-resort"], p: 60, desc: "A Caribbean archipelago of beaches and famous swimming pigs." },
  { n: "Barbados", c: "americas", r: "caribbean", d: 1, s: "s", cl: ["tropical", "hot"], i: 1, lang: ["english"], m: 1, u: ["rum", "rihanna", "flying-fish"], p: 55, desc: "An eastern Caribbean island nation of rum and Rihanna." },
  { n: "Belize", c: "americas", r: "central-america", d: 0, s: "s", cl: ["tropical", "hot"], lang: ["english"], u: ["reef", "mayan-ruins", "jungle"], p: 50, desc: "A Central American nation with the second-largest barrier reef." },
  { n: "Canada", c: "americas", r: "north-america", d: 1, s: "l", cl: ["cold", "temperate"], lang: ["english", "french"], m: 1, u: ["maple-syrup", "hockey", "mounties", "polite", "rockies", "moose"], p: 88, desc: "A vast northern American monarchy of maple syrup and hockey." },
  { n: "Costa Rica", c: "americas", r: "central-america", d: 0, s: "s", cl: ["tropical", "hot"], lang: ["spanish"], u: ["rainforest", "no-army", "pura-vida", "sloths", "ecotourism"], p: 70, desc: "A Central American republic with no army and lush rainforests." },
  { n: "Cuba", c: "americas", r: "caribbean", d: 0, s: "m", cl: ["tropical", "hot"], i: 1, lang: ["spanish"], u: ["cigars", "classic-cars", "communist", "salsa", "havana", "mojito"], p: 72, desc: "A Caribbean communist republic of cigars and classic cars." },
  { n: "Dominica", c: "americas", r: "caribbean", d: 0, s: "s", cl: ["tropical", "hot"], i: 1, lang: ["english"], u: ["boiling-lake", "rainforest", "nature-isle"], p: 50, desc: "A mountainous Caribbean 'nature island'." },
  { n: "Dominican Republic", c: "americas", r: "caribbean", d: 0, s: "s", cl: ["tropical", "hot"], i: 1, lang: ["spanish"], u: ["baseball", "merengue", "santo-domingo"], p: 65, desc: "A Caribbean republic of baseball and merengue." },
  { n: "El Salvador", c: "americas", r: "central-america", d: 0, s: "s", cl: ["tropical", "hot"], lang: ["spanish"], u: ["bitcoin-legal", "pupusas", "volcanoes"], p: 55, desc: "A Central American republic that adopted Bitcoin as legal tender." },
  { n: "Grenada", c: "americas", r: "caribbean", d: 0, s: "s", cl: ["tropical", "hot"], i: 1, lang: ["english"], m: 1, u: ["spice-isle", "nutmeg"], p: 50, desc: "The Caribbean 'spice isle' of nutmeg and mace." },
  { n: "Guatemala", c: "americas", r: "central-america", d: 0, s: "s", cl: ["tropical", "mountainous"], lang: ["spanish"], anc: 1, u: ["maya", "volcanoes", "tikal", "antigua"], p: 60, desc: "A Central American republic of Mayan ruins and volcanoes." },
  { n: "Haiti", c: "americas", r: "caribbean", d: 0, s: "s", cl: ["tropical", "hot"], i: 1, lang: ["french", "haitian-creole"], u: ["earthquake", "voodoo", "first-black-republic"], p: 60, desc: "The first republic founded by formerly enslaved people." },
  { n: "Honduras", c: "americas", r: "central-america", d: 0, s: "s", cl: ["tropical", "hot"], lang: ["spanish"], u: ["mayan-ruins", "bananas", "copan"], p: 55, desc: "A Central American republic of bananas and Mayan Copán." },
  { n: "Jamaica", c: "americas", r: "caribbean", d: 0, s: "s", cl: ["tropical", "hot"], i: 1, lang: ["english"], u: ["reggae", "usain-bolt", "rum", "bob-marley", "jerk-chicken"], p: 75, desc: "A Caribbean island of reggae, Usain Bolt, and jerk chicken." },
  { n: "Mexico", c: "americas", r: "north-america", d: 0, s: "l", cl: ["hot", "desert", "tropical", "mountainous"], lang: ["spanish"], anc: 1, pop: 1, u: ["tacos", "aztec", "mayan", "tequila", "sombrero", "day-of-the-dead", "mariachi"], p: 84, desc: "A large North American republic of Aztec heritage and tacos." },
  { n: "Nicaragua", c: "americas", r: "central-america", d: 0, s: "s", cl: ["tropical", "hot"], lang: ["spanish"], u: ["lakes", "volcanoes", "coffee"], p: 55, desc: "The largest Central American republic of lakes and volcanoes." },
  { n: "Panama", c: "americas", r: "central-america", d: 0, s: "s", cl: ["tropical", "hot"], lang: ["spanish"], u: ["canal", "panama-hats", "darien-gap"], p: 65, desc: "A Central American republic defined by its famous canal." },
  { n: "Saint Kitts and Nevis", c: "americas", r: "caribbean", d: 0, s: "s", cl: ["tropical", "hot"], i: 1, lang: ["english"], m: 1, u: ["smallest-americas", "sugar", "brimstone-hill"], p: 50, desc: "The smallest sovereign state in the Americas." },
  { n: "Saint Lucia", c: "americas", r: "caribbean", d: 0, s: "s", cl: ["tropical", "hot"], i: 1, lang: ["english"], m: 1, u: ["pitons", "volcanic", "sulphur-springs"], p: 55, desc: "A Caribbean island of the Pitons and volcanic springs." },
  { n: "Saint Vincent and the Grenadines", c: "americas", r: "caribbean", d: 0, s: "s", cl: ["tropical", "hot"], i: 1, lang: ["english"], m: 1, u: ["pirates-movie", "banana", "tobago-cays"], p: 50, desc: "A multi-island Caribbean monarchy of the Grenadines." },
  { n: "Trinidad and Tobago", c: "americas", r: "caribbean", d: 0, s: "s", cl: ["tropical", "hot"], i: 1, lang: ["english"], u: ["carnival", "steelpan", "oil", "calypso"], p: 60, desc: "A twin-island Caribbean republic of carnival and steelpan." },
  { n: "United States", c: "americas", r: "north-america", d: 1, s: "l", cl: ["temperate", "cold", "hot", "desert", "tropical"], lang: ["english"], tech: 1, pop: 1, u: ["hollywood", "statue-of-liberty", "navy", "apple-pie", "capitalist", "nasa", "bald-eagle", "grand-canyon", "silicon-valley"], p: 97, desc: "A large federal republic and global superpower." },
  { n: "Argentina", c: "americas", r: "south-america", d: 0, s: "l", cl: ["temperate", "cold", "hot", "mountainous"], lang: ["spanish"], u: ["tango", "pampas", "maradona", "patagonia", "mate-tea", "messi"], p: 75, desc: "A large South American republic of tango and pampas." },
  { n: "Bolivia", c: "americas", r: "south-america", d: 0, s: "m", cl: ["tropical", "cold", "mountainous"], ll: 1, lang: ["spanish", "quechua"], u: ["andes", "salt-flats", "indigenous", "lake-titicaca"], p: 60, desc: "A landlocked Andean republic of salt flats and Titicaca." },
  { n: "Brazil", c: "americas", r: "south-america", d: 0, s: "l", cl: ["tropical", "hot"], lang: ["portuguese"], pop: 1, u: ["carnival", "amazon", "soccer", "rio", "samba", "christ-the-redeemer"], p: 86, desc: "The largest South American republic of carnival and the Amazon." },
  { n: "Chile", c: "americas", r: "south-america", d: 0, s: "m", cl: ["temperate", "cold", "desert", "mountainous"], lang: ["spanish"], u: ["andes", "easter-island", "long-country", "atacama-desert", "wine"], p: 70, desc: "A long, thin South American republic stretching to Antarctica." },
  { n: "Colombia", c: "americas", r: "south-america", d: 0, s: "m", cl: ["tropical", "hot", "mountainous"], lang: ["spanish"], u: ["coffee", "shakira", "cartagena", "emeralds"], p: 72, desc: "A South American republic of coffee and Shakira." },
  { n: "Ecuador", c: "americas", r: "south-america", d: 0, s: "s", cl: ["tropical", "mountainous"], lang: ["spanish"], u: ["galapagos", "equator", "andes", "darwin"], p: 65, desc: "A South American republic on the equator, home to the Galápagos." },
  { n: "Guyana", c: "americas", r: "south-america", d: 0, s: "s", cl: ["tropical", "hot"], lang: ["english"], u: ["rainforest", "only-english-south-america", "kaieteur-falls"], p: 50, desc: "The only English-speaking South American republic." },
  { n: "Paraguay", c: "americas", r: "south-america", d: 0, s: "s", cl: ["tropical", "hot"], ll: 1, lang: ["spanish", "guarani"], u: ["guarani", "itaipu-dam", "yerba-mate"], p: 55, desc: "A bilingual South American republic of Guaraní heritage." },
  { n: "Peru", c: "americas", r: "south-america", d: 0, s: "m", cl: ["tropical", "mountainous", "desert"], lang: ["spanish"], anc: 1, u: ["machu-picchu", "incas", "llamas", "nazca-lines", "cusco"], p: 78, desc: "A South American republic of the Incas and Machu Picchu." },
  { n: "Suriname", c: "americas", r: "south-america", d: 0, s: "s", cl: ["tropical", "hot"], lang: ["dutch"], u: ["rainforest", "only-dutch-south-america", "paramaribo"], p: 50, desc: "The only Dutch-speaking South American republic." },
  { n: "Uruguay", c: "americas", r: "south-america", d: 1, s: "s", cl: ["temperate"], lang: ["spanish"], u: ["mate-tea", "beef", "first-world-cup", "punta-del-este"], p: 60, desc: "A small Southern Cone republic of mate and beef." },
  { n: "Venezuela", c: "americas", r: "south-america", d: 0, s: "m", cl: ["tropical", "hot"], lang: ["spanish"], u: ["oil", "angel-falls", "beauty-queens", "arepas"], p: 65, desc: "A South American republic of oil and Angel Falls." },

  // ----- AFRICA (54) -----
  { n: "Algeria", c: "africa", r: "north-africa", d: 0, s: "l", cl: ["hot", "desert"], lang: ["arabic", "french"], u: ["sahara", "casbah", "algiers"], p: 65, desc: "The largest African country, mostly Sahara desert." },
  { n: "Egypt", c: "africa", r: "north-africa", d: 0, s: "m", cl: ["hot", "desert"], lang: ["arabic"], anc: 1, pop: 1, u: ["pyramids", "sphinx", "nile", "pharaohs", "mummies", "cairo", "hieroglyphs"], p: 85, desc: "A North African republic of pyramids and the Nile." },
  { n: "Libya", c: "africa", r: "north-africa", d: 0, s: "l", cl: ["hot", "desert"], lang: ["arabic"], u: ["sahara", "oil", "war-torn", "tripoli"], p: 55, desc: "A North African republic of desert and oil." },
  { n: "Morocco", c: "africa", r: "north-africa", d: 0, s: "m", cl: ["hot", "mediterranean", "desert", "mountainous"], lang: ["arabic", "french"], m: 1, u: ["marrakech", "casablanca", "tagine", "souks", "atlas-mountains", "blue-city-chefchaouen"], p: 75, desc: "A North African kingdom of Marrakech and tagine." },
  { n: "Sudan", c: "africa", r: "north-africa", d: 0, s: "l", cl: ["hot", "desert"], lang: ["arabic"], u: ["pyramids-nubian", "split-2011", "nile", "darfur"], p: 60, desc: "A large North African republic split in 2011." },
  { n: "Tunisia", c: "africa", r: "north-africa", d: 0, s: "s", cl: ["hot", "mediterranean"], lang: ["arabic", "french"], u: ["carthage", "jasmine-revolution", "arab-spring", "star-wars-filming"], p: 65, desc: "A North African republic where the Arab Spring began." },
  { n: "Benin", c: "africa", r: "west-africa", d: 0, s: "s", cl: ["tropical", "hot"], lang: ["french"], u: ["voodoo-origin", "porto-novo", "oothaa"], p: 50, desc: "A West African republic, the birthplace of Vodun." },
  { n: "Burkina Faso", c: "africa", r: "west-africa", d: 0, s: "s", cl: ["hot", "tropical"], ll: 1, lang: ["french"], u: ["fespaco", "land-of-honest-men", "mud-architecture"], p: 50, desc: "A landlocked West African republic of FESPACO film festival." },
  { n: "Cabo Verde", c: "africa", r: "west-africa", d: 0, s: "s", cl: ["tropical"], i: 1, lang: ["portuguese"], u: ["islands", "morna-music", "cesaria-evora"], p: 50, desc: "A volcanic Atlantic archipelago off West Africa." },
  { n: "Cameroon", c: "africa", r: "central-africa", d: 0, s: "m", cl: ["tropical", "hot"], lang: ["french", "english"], u: ["mini-africa", "football", "yaounde"], p: 55, desc: "A diverse Central African 'mini-Africa'." },
  { n: "Central African Republic", c: "africa", r: "central-africa", d: 0, s: "s", cl: ["tropical", "hot"], ll: 1, lang: ["french"], u: ["diamonds", "conflict", "bangui"], p: 45, desc: "A landlocked, conflict-torn Central African republic." },
  { n: "Chad", c: "africa", r: "central-africa", d: 0, s: "l", cl: ["hot", "desert"], ll: 1, lang: ["french", "arabic"], u: ["lake-chad", "desert", "sahel"], p: 50, desc: "A large Sahelian republic dominated by desert." },
  { n: "Comoros", c: "africa", r: "east-africa", d: 0, s: "s", cl: ["tropical", "hot"], i: 1, lang: ["arabic", "french"], u: ["volcanic-islands", "perfume", "ylang-ylang"], p: 45, desc: "A volcanic Indian Ocean archipelago off East Africa." },
  { n: "Republic of the Congo", c: "africa", r: "central-africa", d: 0, s: "m", cl: ["tropical", "hot"], lang: ["french"], u: ["rainforest", "oil", "brazzaville"], p: 55, desc: "A Central African republic of rainforest and oil." },
  { n: "Democratic Republic of the Congo", c: "africa", r: "central-africa", d: 0, s: "l", cl: ["tropical", "hot"], lang: ["french"], pop: 1, u: ["rainforest", "cobalt", "congo-river", "kinshasa"], p: 65, desc: "A vast Central African republic of rainforest and minerals." },
  { n: "Ivory Coast", c: "africa", r: "west-africa", d: 0, s: "m", cl: ["tropical", "hot"], lang: ["french"], u: ["cocoa", "abidjan", "football"], p: 60, desc: "A West African republic, the world's top cocoa producer." },
  { n: "Djibouti", c: "africa", r: "east-africa", d: 0, s: "s", cl: ["hot", "desert"], lang: ["arabic", "french"], u: ["red-sea", "foreign-bases", "lac-assal"], p: 50, desc: "A small Horn of Africa republic hosting foreign military bases." },
  { n: "Equatorial Guinea", c: "africa", r: "central-africa", d: 0, s: "s", cl: ["tropical", "hot"], lang: ["spanish", "french"], u: ["oil", "spanish-speaking-africa", "malabo"], p: 50, desc: "The only Spanish-speaking African republic." },
  { n: "Eritrea", c: "africa", r: "east-africa", d: 0, s: "s", cl: ["hot", "desert"], lang: ["arabic"], u: ["red-sea", "isolated", "asmara"], p: 50, desc: "A Horn of Africa republic on the Red Sea." },
  { n: "Eswatini", c: "africa", r: "southern-africa", d: 0, s: "s", cl: ["temperate", "tropical"], ll: 1, m: 1, u: ["last-absolute-monarchy-africa", "reed-dance", "swazi"], p: 50, desc: "Africa's last absolute monarchy, enclaved in South Africa." },
  { n: "Ethiopia", c: "africa", r: "east-africa", d: 0, s: "l", cl: ["tropical", "mountainous", "temperate"], ll: 1, anc: 1, pop: 1, u: ["coffee-origin", "lucy", "rock-churches", "amharic", "injera", "never-colonized"], p: 70, desc: "An ancient, never-colonized East African republic, coffee's birthplace." },
  { n: "Gabon", c: "africa", r: "central-africa", d: 1, s: "s", cl: ["tropical", "hot"], lang: ["french"], u: ["rainforest", "oil", "gorillas", "loango"], p: 50, desc: "A wealthy Central African republic of rainforest and gorillas." },
  { n: "Gambia", c: "africa", r: "west-africa", d: 0, s: "s", cl: ["tropical", "hot"], lang: ["english"], u: ["smallest-mainland-africa", "river-gambia", "birdwatching"], p: 50, desc: "The smallest mainland African republic." },
  { n: "Ghana", c: "africa", r: "west-africa", d: 0, s: "s", cl: ["tropical", "hot"], lang: ["english"], u: ["gold-coast", "kente", "cocoa", "kente-cloth", "accra"], p: 65, desc: "A West African republic of gold, cocoa, and kente cloth." },
  { n: "Guinea", c: "africa", r: "west-africa", d: 0, s: "s", cl: ["tropical", "hot"], lang: ["french"], u: ["bauxite", "conakry", "fouta-djallon"], p: 50, desc: "A West African republic rich in bauxite." },
  { n: "Guinea-Bissau", c: "africa", r: "west-africa", d: 0, s: "s", cl: ["tropical", "hot"], lang: ["portuguese"], u: ["bijagos-islands", "cashews"], p: 45, desc: "A small West African republic of the Bijagós islands." },
  { n: "Kenya", c: "africa", r: "east-africa", d: 0, s: "m", cl: ["tropical", "temperate"], u: ["safari", "wildlife", "marathon-runners", "masai-mara", "nairobi", "wildebeest-migration"], p: 75, desc: "An East African republic of safaris and marathon runners." },
  { n: "Lesotho", c: "africa", r: "southern-africa", d: 0, s: "s", cl: ["cold", "mountainous"], ll: 1, m: 1, u: ["high-altitude", "blankets", "enclaved"], p: 50, desc: "A high-altitude mountain kingdom enclaved in South Africa." },
  { n: "Liberia", c: "africa", r: "west-africa", d: 0, s: "s", cl: ["tropical", "hot"], lang: ["english"], u: ["founded-by-freed-slaves", "rubber", "firestone"], p: 55, desc: "A West African republic founded by freed American slaves." },
  { n: "Madagascar", c: "africa", r: "east-africa", d: 0, s: "m", cl: ["tropical", "hot"], i: 1, lang: ["malagasy", "french"], u: ["lemurs", "baobabs", "unique-wildlife", "dreamworks-movie"], p: 65, desc: "A biodiversity hotspot island off East Africa." },
  { n: "Malawi", c: "africa", r: "east-africa", d: 0, s: "s", cl: ["tropical", "temperate"], ll: 1, u: ["lake-malawi", "warm-heart", "tobacco"], p: 50, desc: "The 'warm heart of Africa' on Lake Malawi." },
  { n: "Mali", c: "africa", r: "west-africa", d: 0, s: "l", cl: ["hot", "desert"], ll: 1, lang: ["french"], anc: 1, u: ["timbuktu", "dogon", "mud-mosques", "sahara", "solar"], p: 55, desc: "A West African republic of ancient Timbuktu." },
  { n: "Mauritania", c: "africa", r: "west-africa", d: 0, s: "l", cl: ["hot", "desert"], lang: ["arabic"], u: ["sahara", "iron-ore", "slavery-issue"], p: 50, desc: "A largely Saharan republic of dunes and iron ore." },
  { n: "Mauritius", c: "africa", r: "east-africa", d: 1, s: "s", cl: ["tropical", "hot"], i: 1, lang: ["english", "french"], u: ["beaches", "dodo-extinct", "segaelectronica", "rainbow-nation"], p: 60, desc: "An Indian Ocean island nation where the dodo went extinct." },
  { n: "Morocco", c: "africa", r: "north-africa", d: 0, s: "m", cl: ["hot", "mediterranean", "mountainous"], lang: ["arabic", "french"], m: 1, u: ["marrakech", "casablanca", "tagine", "souks", "atlas-mountains", "blue-city-chefchaouen"], p: 75, desc: "A North African kingdom of Marrakech and tagine." },
  { n: "Mozambique", c: "africa", r: "east-africa", d: 0, s: "l", cl: ["tropical", "hot"], lang: ["portuguese"], u: ["beaches", "mozambique-island", "marrabenta"], p: 55, desc: "A lusophone East African republic of beaches and islands." },
  { n: "Namibia", c: "africa", r: "southern-africa", d: 1, s: "m", cl: ["desert", "hot"], u: ["namib-desert", "skeleton-coast", "diamonds", "etosha"], p: 60, desc: "A Southern African republic of the Namib Desert." },
  { n: "Niger", c: "africa", r: "west-africa", d: 0, s: "l", cl: ["hot", "desert"], ll: 1, lang: ["french"], u: ["uranium", "sahara", "tuareg"], p: 50, desc: "A vast Sahelian republic of uranium and Tuareg nomads." },
  { n: "Nigeria", c: "africa", r: "west-africa", d: 0, s: "l", cl: ["tropical", "hot"], lang: ["english"], pop: 1, u: ["oil", "nollywood", "lagos", "most-populous-africa", "jollof-rice"], p: 75, desc: "The most populous African republic, home of Nollywood." },
  { n: "Rwanda", c: "africa", r: "east-africa", d: 0, s: "s", cl: ["temperate", "mountainous"], ll: 1, lang: ["french", "english", "kinyarwanda"], u: ["gorillas", "genocide-1994", "clean", "thousand-hills"], p: 65, desc: "A land of a thousand hills, recovering from the 1994 genocide." },
  { n: "Sao Tome and Principe", c: "africa", r: "central-africa", d: 0, s: "s", cl: ["tropical", "hot"], i: 1, lang: ["portuguese"], u: ["cocoa", "tiny-islands", "equator"], p: 45, desc: "A tiny two-island equatorial African republic." },
  { n: "Senegal", c: "africa", r: "west-africa", d: 0, s: "s", cl: ["tropical", "hot"], lang: ["french"], u: ["dakar", "wrestling", "goree-island", "teranga", "mbalax"], p: 60, desc: "A West African republic of teranga (hospitality) and Dakar." },
  { n: "Seychelles", c: "africa", r: "east-africa", d: 1, s: "s", cl: ["tropical", "hot"], i: 1, lang: ["english", "french", "creole"], u: ["beaches", "giant-tortoises", "coco-de-mer"], p: 55, desc: "An Indian Ocean archipelago of beaches and giant tortoises." },
  { n: "Sierra Leone", c: "africa", r: "west-africa", d: 0, s: "s", cl: ["tropical", "hot"], lang: ["english"], u: ["diamonds", "blood-diamonds", "freetown"], p: 55, desc: "A West African republic whose capital was founded for freed slaves." },
  { n: "Somalia", c: "africa", r: "east-africa", d: 0, s: "m", cl: ["hot", "desert"], lang: ["arabic", "somali"], u: ["pirates", "horn-of-africa", "nomads", "fragile-state"], p: 55, desc: "A Horn of Africa republic on the tip of the horn." },
  { n: "South Africa", c: "africa", r: "southern-africa", d: 1, s: "m", cl: ["temperate", "hot", "mountainous"], u: ["nelson-mandela", "safari", "diamonds", "apartheid-history", "cape-town", "table-mountain", "springboks"], p: 80, desc: "A Southern African republic of Nelson Mandela and Table Mountain." },
  { n: "South Sudan", c: "africa", r: "east-africa", d: 0, s: "s", cl: ["tropical", "hot"], ll: 1, u: ["newest-country", "oil", "war-torn", "juba"], p: 50, desc: "The world's newest sovereign state, independent since 2011." },
  { n: "Sudan", c: "africa", r: "north-africa", d: 0, s: "l", cl: ["hot", "desert"], lang: ["arabic"], u: ["pyramids-nubian", "split-2011", "nile", "darfur"], p: 60, desc: "A large North African republic split in 2011." },
  { n: "Tanzania", c: "africa", r: "east-africa", d: 0, s: "l", cl: ["tropical", "temperate"], u: ["serengeti", "kilimanjaro", "zing", "maasai", "zingibar"], p: 70, desc: "An East African republic of the Serengeti and Kilimanjaro." },
  { n: "Togo", c: "africa", r: "west-africa", d: 0, s: "s", cl: ["tropical", "hot"], lang: ["french"], u: ["togo-lake", "voodoo", "phosphate"], p: 50, desc: "A thin West African republic on the Gulf of Guinea." },
  { n: "Tunisia", c: "africa", r: "north-africa", d: 0, s: "s", cl: ["hot", "mediterranean"], lang: ["arabic", "french"], u: ["carthage", "jasmine-revolution", "arab-spring", "star-wars-filming"], p: 65, desc: "A North African republic where the Arab Spring began." },
  { n: "Uganda", c: "africa", r: "east-africa", d: 0, s: "s", cl: ["tropical", "temperate"], ll: 1, u: ["source-of-nile", "gorillas", "idi-amin", "kampala"], p: 60, desc: "An East African republic at the source of the Nile." },
  { n: "Zambia", c: "africa", r: "southern-africa", d: 0, s: "m", cl: ["tropical", "temperate"], ll: 1, u: ["victoria-falls", "copper", "lewiston-annan"], p: 55, desc: "A landlocked Southern African republic of Victoria Falls." },
  { n: "Zimbabwe", c: "africa", r: "southern-africa", d: 0, s: "s", cl: ["tropical", "temperate"], ll: 1, u: ["victoria-falls", "great-zimbabwe-ruins", "hyperinflation", "harare"], p: 55, desc: "A Southern African republic of Great Zimbabwe ruins." },

  // ----- OCEANIA (14) -----
  { n: "Australia", c: "oceania", r: "oceania", d: 1, s: "l", cl: ["hot", "desert", "tropical", "temperate"], lang: ["english"], u: ["kangaroo", "koala", "outback", "great-barrier-reef", "southern-hemisphere", "sydney-opera-house", "boomerang"], p: 90, desc: "A continent-country of kangaroos, koalas, and the outback." },
  { n: "Fiji", c: "oceania", r: "oceania", d: 0, s: "s", cl: ["tropical", "hot"], i: 1, lang: ["english", "fijian"], u: ["beaches", "friendly", "kava-ceremony"], p: 60, desc: "A tropical Melanesian archipelago of beaches and kava." },
  { n: "Kiribati", c: "oceania", r: "oceania", d: 0, s: "s", cl: ["tropical", "hot"], i: 1, lang: ["english", "gilbertese"], u: ["sinking-islands", "date-line", "atolls"], p: 45, desc: "A Pacific atoll republic threatened by rising seas." },
  { n: "Marshall Islands", c: "oceania", r: "oceania", d: 0, s: "s", cl: ["tropical", "hot"], i: 1, lang: ["english", "marshallese"], u: ["atolls", "nuclear-testing", "majuro"], p: 45, desc: "A Pacific atoll republic scarred by nuclear testing." },
  { n: "Micronesia", c: "oceania", r: "oceania", d: 0, s: "s", cl: ["tropical", "hot"], i: 1, lang: ["english"], u: ["islands", "diving", "nan-madol"], p: 45, desc: "A Pacific archipelago federation of four states." },
  { n: "Nauru", c: "oceania", r: "oceania", d: 0, s: "s", cl: ["tropical", "hot"], i: 1, lang: ["english", "nauruan"], u: ["smallest-island-nation", "phosphate", "refugee-camp"], p: 45, desc: "The world's smallest island nation, once rich on phosphate." },
  { n: "New Zealand", c: "oceania", r: "oceania", d: 1, s: "s", cl: ["temperate", "mountainous"], i: 1, u: ["kiwi-bird", "sheep", "lord-of-the-rings", "maori", "southern-hemisphere", "haka", "weta"], p: 80, desc: "A scenic Pacific island nation of kiwis and the Haka." },
  { n: "Palau", c: "oceania", r: "oceania", d: 0, s: "s", cl: ["tropical", "hot"], i: 1, lang: ["english", "palauan"], u: ["jellyfish-lake", "diving", "rock-islands"], p: 45, desc: "A Pacific archipelago famous for its jellyfish lake." },
  { n: "Papua New Guinea", c: "oceania", r: "oceania", d: 0, s: "m", cl: ["tropical", "hot", "mountainous"], i: 1, u: ["rainforest", "tribes", "birds-of-paradise", "languages"], p: 55, desc: "A culturally diverse Pacific island nation of rainforests." },
  { n: "Samoa", c: "oceania", r: "oceania", d: 0, s: "s", cl: ["tropical", "hot"], i: 1, lang: ["english", "samoan"], u: ["tatau", "polynesian", "fire-knife"], p: 50, desc: "A Polynesian island nation where the tatau tattoo originated." },
  { n: "Solomon Islands", c: "oceania", r: "oceania", d: 0, s: "s", cl: ["tropical", "hot"], i: 1, u: ["ww2-battles", "rainforest", "guadalcanal"], p: 50, desc: "A Pacific archipelago of WWII battles and rainforest." },
  { n: "Tonga", c: "oceania", r: "oceania", d: 0, s: "s", cl: ["tropical", "hot"], i: 1, lang: ["english", "tongan"], m: 1, u: ["polynesian-monarchy", "whale-swimming", "kava"], p: 50, desc: "The only Polynesian monarchy never colonized." },
  { n: "Tuvalu", c: "oceania", r: "oceania", d: 0, s: "s", cl: ["tropical", "hot"], i: 1, lang: ["english", "tuvaluan"], u: ["sinking", "tv-domain", "atolls"], p: 45, desc: "A low-lying Pacific atoll republic threatened by sea rise." },
  { n: "Vanuatu", c: "oceania", r: "oceania", d: 0, s: "s", cl: ["tropical", "hot"], i: 1, lang: ["english", "french", "bisla"], u: ["volcanoes", "bungee-origin", "land-diving"], p: 50, desc: "A volcanic Pacific archipelago, birthplace of bungee." },
];

async function restoreCountries(): Promise<void> {
  console.log("\n[2/5] Restoring countries...");
  const cat = await db.category.findUnique({ where: { slug: "countries" } });
  if (!cat) {
    console.log("  countries category not found — skipping");
    return;
  }
  // Map continent code -> subcategory id.
  const subMap = new Map<string, string>();
  for (const c of ["asia", "europe", "americas", "africa", "oceania"]) {
    const sub = await db.subcategory.findFirst({
      where: { slug: c, categoryId: cat.id },
    });
    subMap.set(c, sub?.id ?? null);
  }
  let created = 0;
  for (const c of COUNTRIES) {
    await ensureEntity({
      name: c.n,
      categoryId: cat.id,
      subcategoryId: subMap.get(c.c) ?? null,
      tags: countryTags(c),
      description: c.desc,
      popularity: c.p ?? 50,
      difficulty: c.p && c.p < 60 ? 2 : 1,
    });
    created++;
  }
  console.log(`  Processed ${created} countries.`);
}

// ============================================================
// 3. SPORTS — all ~195 sports
// ============================================================

type SportSpec = {
  n: string;
  cat: "team" | "individual"; // team-sport or individual-sport
  types?: string[]; // sport type tags (ball-sport, racket-sport, etc.)
  env: "indoor" | "outdoor" | "both";
  equip?: string[]; // uses-ball, uses-racket, etc.
  contact?: 1 | 0;
  olympic?: 1 | 0;
  dangerous?: 1 | 0;
  popular?: 1 | 0;
  global?: 1 | 0;
  sub: string; // subcategory slug
  u?: string[]; // unique tags
  p?: number;
  desc?: string;
};

function sportTags(s: SportSpec): string[] {
  const t: string[] = ["sport"];
  t.push(s.cat === "team" ? "team-sport" : "individual-sport");
  if (s.types) for (const ty of s.types) t.push(ty);
  if (s.env === "indoor" || s.env === "both") t.push("indoor-sport");
  if (s.env === "outdoor" || s.env === "both") t.push("outdoor-sport");
  if (s.equip) for (const e of s.equip) t.push(e);
  if (s.contact === 1) t.push("contact");
  if (s.olympic === 1) t.push("olympic");
  if (s.dangerous === 1) t.push("dangerous");
  if (s.popular === 1) t.push("popular-sport");
  if (s.global === 1) t.push("global-sport");
  if (s.u) for (const u of s.u) t.push(u);
  return t;
}

const SPORTS: SportSpec[] = [
  // ----- Team ball sports -----
  { n: "Soccer", cat: "team", types: ["ball-sport"], env: "outdoor", equip: ["uses-ball"], contact: 1, olympic: 1, popular: 1, global: 1, sub: "team", u: ["world-cup", "foot-driven", "most-popular-sport"], p: 96, desc: "The world's most popular sport." },
  { n: "Basketball", cat: "team", types: ["ball-sport"], env: "both", equip: ["uses-ball"], contact: 1, olympic: 1, popular: 1, global: 1, sub: "team", u: ["nba", "tall-players", "hoops"], p: 92, desc: "A team sport of hoops and high-scoring action." },
  { n: "American Football", cat: "team", types: ["ball-sport"], env: "outdoor", equip: ["uses-ball"], contact: 1, dangerous: 1, popular: 1, sub: "team", u: ["nfl", "super-bowl", "helmet", "pads", "american"], p: 90, desc: "The NFL contact sport with helmets and pads." },
  { n: "Baseball", cat: "team", types: ["ball-sport"], env: "outdoor", equip: ["uses-ball", "uses-bat"], olympic: 1, popular: 1, sub: "team", u: ["mlb", "world-series", "diamond"], p: 85, desc: "America's pastime with bats and bases." },
  { n: "Cricket", cat: "team", types: ["ball-sport"], env: "outdoor", equip: ["uses-ball", "uses-bat"], popular: 1, global: 1, sub: "team", u: ["ipl", "ashes", "commonwealth", "wickets"], p: 88, desc: "A bat-and-ball sport loved by billions." },
  { n: "Volleyball", cat: "team", types: ["ball-sport"], env: "both", equip: ["uses-ball", "uses-net"], olympic: 1, popular: 1, sub: "team", u: ["beach-volleyball", "sets-and-spikes"], p: 80, desc: "A net sport of sets and spikes." },
  { n: "Rugby Union", cat: "team", types: ["ball-sport"], env: "outdoor", equip: ["uses-ball"], contact: 1, dangerous: 1, olympic: 1, popular: 1, sub: "team", u: ["scrum", "no-pads", "try", "british-origin"], p: 78, desc: "A tough contact team sport with no pads." },
  { n: "Rugby League", cat: "team", types: ["ball-sport"], env: "outdoor", equip: ["uses-ball"], contact: 1, dangerous: 1, sub: "team", u: ["13-players", "australia-strong"], p: 65, desc: "A 13-a-side variant of rugby football." },
  { n: "Handball", cat: "team", types: ["ball-sport"], env: "indoor", equip: ["uses-ball"], contact: 1, olympic: 1, sub: "team", u: ["european-popular", "court"], p: 65, desc: "A fast indoor team sport with goals." },
  { n: "Field Hockey", cat: "team", types: ["ball-sport"], env: "outdoor", equip: ["uses-ball", "uses-stick"], olympic: 1, sub: "team", u: ["astroturf", "hockey-stick"], p: 65, desc: "A stick-and-ball team sport on astroturf." },
  { n: "Netball", cat: "team", types: ["ball-sport"], env: "both", equip: ["uses-ball", "uses-net"], popular: 1, sub: "team", u: ["female-dominant", "commonwealth", "no-dribble"], p: 60, desc: "A no-dribble net sport popular in the Commonwealth." },
  { n: "Water Polo", cat: "team", types: ["ball-sport", "water-sport"], env: "indoor", equip: ["uses-ball"], contact: 1, olympic: 1, sub: "team", u: ["pool", "tread-water"], p: 60, desc: "A demanding team sport played in deep water." },
  { n: "Australian Rules Football", cat: "team", types: ["ball-sport"], env: "outdoor", equip: ["uses-ball"], contact: 1, dangerous: 1, sub: "team", u: ["afl", "oval-field", "aussie-rules"], p: 60, desc: "A high-scoring contact sport on an oval field." },
  { n: "Gaelic Football", cat: "team", types: ["ball-sport"], env: "outdoor", equip: ["uses-ball"], contact: 1, sub: "team", u: ["irish", "amateur", "gaa"], p: 55, desc: "An Irish amateur field sport." },
  { n: "Hurling", cat: "team", types: ["ball-sport"], env: "outdoor", equip: ["uses-ball", "uses-stick"], contact: 1, dangerous: 1, sub: "team", u: ["irish", "fastest-field-sport", "sliotar"], p: 55, desc: "The world's fastest field sport, Irish origin." },
  { n: "Kabaddi", cat: "team", env: "both", contact: 1, sub: "team", u: ["indian-subcontinent", "raid", "no-equipment"], p: 60, desc: "A contact team sport of raids from South Asia." },
  { n: "Sepak Takraw", cat: "team", env: "both", equip: ["uses-ball", "uses-net"], sub: "team", u: ["southeast-asian", "foot-volleyball", "bicycle-kicks"], p: 50, desc: "A spectacular foot-volleyball from Southeast Asia." },
  { n: "Floorball", cat: "team", types: ["ball-sport"], env: "indoor", equip: ["uses-ball", "uses-stick"], sub: "team", u: ["scandinavian", "plastic-stick"], p: 45, desc: "A fast indoor stick sport from Scandinavia." },
  { n: "Lacrosse", cat: "team", types: ["ball-sport"], env: "outdoor", equip: ["uses-ball", "uses-stick"], contact: 1, sub: "team", u: ["native-american-origin", "canada", "stick-with-pockets"], p: 60, desc: "A stick-and-ball sport of Native American origin." },
  { n: "Ice Hockey", cat: "team", types: ["ball-sport", "winter-sport"], env: "indoor", equip: ["uses-puck", "uses-stick", "uses-skates"], contact: 1, dangerous: 1, olympic: 1, popular: 1, sub: "team", u: ["nhl", "ice", "puck"], p: 82, desc: "Fast team sport on ice with a puck." },
  { n: "Bandy", cat: "team", types: ["ball-sport", "winter-sport"], env: "outdoor", equip: ["uses-ball", "uses-stick", "uses-skates"], sub: "team", u: ["similar-to-ice-hockey", "russian-swedish"], p: 40, desc: "A winter team sport resembling field hockey on ice." },
  { n: "Ringette", cat: "team", types: ["winter-sport"], env: "indoor", equip: ["uses-stick", "uses-puck", "uses-skates"], sub: "team", u: ["female-sport", "canada", "no-body-checking"], p: 40, desc: "A Canadian winter sport primarily for women." },
  { n: "Fistball", cat: "team", types: ["ball-sport"], env: "outdoor", equip: ["uses-ball", "uses-net"], sub: "team", u: ["similar-to-volleyball", "german-origin"], p: 35, desc: "A volleyball-like team sport using fists." },
  { n: "Roller Hockey", cat: "team", types: ["ball-sport"], env: "indoor", equip: ["uses-stick", "uses-skates"], sub: "team", u: ["quad-skates", "portuguese-popular"], p: 40, desc: "A hockey variant on quad roller skates." },

  // ----- Racket sports -----
  { n: "Tennis", cat: "individual", types: ["racket-sport", "ball-sport"], env: "both", equip: ["uses-ball", "uses-racket", "uses-net"], olympic: 1, popular: 1, global: 1, sub: "racket", u: ["grand-slam", "wimbledon", "aces"], p: 88, desc: "A racket sport of aces and Grand Slams." },
  { n: "Badminton", cat: "individual", types: ["racket-sport"], env: "both", equip: ["uses-racket", "uses-net"], olympic: 1, popular: 1, sub: "racket", u: ["shuttlecock", "asian-popular", "fastest-racket"], p: 75, desc: "A fast racket sport with a shuttlecock." },
  { n: "Table Tennis", cat: "individual", types: ["racket-sport"], env: "indoor", equip: ["uses-racket"], olympic: 1, popular: 1, sub: "racket", u: ["ping-pong", "asian-dominant", "small-table"], p: 78, desc: "A fast indoor racket sport on a small table." },
  { n: "Squash", cat: "individual", types: ["racket-sport", "ball-sport"], env: "indoor", equip: ["uses-racket", "uses-ball"], sub: "racket", u: ["court", "fast", "glass-court"], p: 60, desc: "An intense indoor racket sport in a walled court." },
  { n: "Racquetball", cat: "individual", types: ["racket-sport", "ball-sport"], env: "indoor", equip: ["uses-racket", "uses-ball"], sub: "racket", u: ["american", "court"], p: 50, desc: "An American indoor racket sport." },
  { n: "Padel", cat: "individual", types: ["racket-sport", "ball-sport"], env: "indoor", equip: ["uses-racket", "uses-ball"], sub: "racket", u: ["enclosed-court", "spanish-popular", "fast-growing"], p: 55, desc: "A fast-growing racket sport on an enclosed court." },
  { n: "Beach Tennis", cat: "individual", types: ["racket-sport"], env: "outdoor", equip: ["uses-racket"], sub: "racket", u: ["beach", "italian-popular"], p: 45, desc: "A beach variant of tennis." },
  { n: "Pickleball", cat: "individual", types: ["racket-sport", "ball-sport"], env: "both", equip: ["uses-racket", "uses-ball", "uses-net"], popular: 1, sub: "racket", u: ["paddle", "fast-growing", "wiffle-ball"], p: 65, desc: "The fastest-growing racket sport in America." },

  // ----- Water sports -----
  { n: "Swimming", cat: "individual", types: ["water-sport"], env: "indoor", olympic: 1, popular: 1, sub: "water-winter", u: ["pool", "lanes", "freestyle"], p: 82, desc: "Racing in water across multiple strokes." },
  { n: "Diving", cat: "individual", types: ["water-sport"], env: "indoor", olympic: 1, sub: "water-winter", u: ["springboard", "platform", "acrobatic"], p: 65, desc: "Acrobatic plunges into water from heights." },
  { n: "Surfing", cat: "individual", types: ["water-sport"], env: "outdoor", equip: ["uses-board"], olympic: 1, popular: 1, sub: "water-winter", u: ["waves", "beach", "ocean"], p: 75, desc: "Riding ocean waves on a board." },
  { n: "Sailing", cat: "individual", types: ["water-sport", "racing-sport"], env: "outdoor", equip: ["uses-boat"], olympic: 1, sub: "water-winter", u: ["wind", "expensive", "america-cup"], p: 60, desc: "Racing boats powered by wind." },
  { n: "Rowing", cat: "individual", types: ["water-sport", "racing-sport"], env: "outdoor", equip: ["uses-boat"], olympic: 1, sub: "water-winter", u: ["shells", "river", "oxbridge"], p: 60, desc: "Racing long boats with oars." },
  { n: "Canoeing", cat: "individual", types: ["water-sport"], env: "outdoor", equip: ["uses-boat"], olympic: 1, sub: "water-winter", u: ["paddle", "rapids", "kayak-vs-canoe"], p: 60, desc: "Paddling a canoe on flat or moving water." },
  { n: "Kayaking", cat: "individual", types: ["water-sport"], env: "outdoor", equip: ["uses-boat"], olympic: 1, sub: "water-winter", u: ["double-blade-paddle", "whitewater"], p: 60, desc: "Paddling a kayak with a double-bladed paddle." },
  { n: "Rafting", cat: "team", types: ["water-sport"], env: "outdoor", equip: ["uses-boat"], dangerous: 1, sub: "water-winter", u: ["rapids", "inflatable", "white-water"], p: 55, desc: "Navigating rapids on an inflatable raft." },
  { n: "Water Skiing", cat: "individual", types: ["water-sport"], env: "outdoor", equip: ["uses-vehicle"], dangerous: 1, sub: "water-winter", u: ["towed", "speed", "skis-on-water"], p: 50, desc: "Being towed on skis across water." },
  { n: "Wakeboarding", cat: "individual", types: ["water-sport"], env: "outdoor", equip: ["uses-board", "uses-vehicle"], sub: "water-winter", u: ["towed", "tricks", "snowboard-on-water"], p: 55, desc: "Towed on a board doing tricks behind a boat." },
  { n: "Kiteboarding", cat: "individual", types: ["water-sport"], env: "outdoor", equip: ["uses-board"], dangerous: 1, sub: "water-winter", u: ["kite", "wind", "tricks"], p: 55, desc: "Riding a board pulled by a large kite." },
  { n: "Windsurfing", cat: "individual", types: ["water-sport"], env: "outdoor", equip: ["uses-board", "uses-sail"], olympic: 1, sub: "water-winter", u: ["wind", "sail-on-board"], p: 55, desc: "Standing on a board with an attached sail." },
  { n: "Paddleboarding", cat: "individual", types: ["water-sport"], env: "outdoor", equip: ["uses-board"], sub: "water-winter", u: ["sup", "stand-up-paddle", "ocean-touring"], p: 55, desc: "Standing on a long board and paddling." },
  { n: "Artistic Swimming", cat: "team", types: ["water-sport"], env: "indoor", olympic: 1, sub: "water-winter", u: ["synchronized", "dance", "underwater"], p: 55, desc: "Synchronized aquatic dance routines." },
  { n: "Marathon Swimming", cat: "individual", types: ["water-sport"], env: "outdoor", olympic: 1, sub: "water-winter", u: ["long-distance", "open-water"], p: 50, desc: "Long-distance swimming in open water." },
  { n: "Underwater Hockey", cat: "team", types: ["water-sport"], env: "indoor", equip: ["uses-stick", "uses-puck"], sub: "water-winter", u: ["underwater", "niche", "breath-hold"], p: 35, desc: "Pushing a puck along a pool bottom." },
  { n: "Triathlon", cat: "individual", env: "outdoor", equip: ["uses-bike"], olympic: 1, popular: 1, sub: "water-winter", u: ["swim-bike-run", "endurance", "ironman"], p: 70, desc: "A swim-bike-run endurance race." },

  // ----- Winter sports -----
  { n: "Alpine Skiing", cat: "individual", types: ["winter-sport", "racing-sport"], env: "outdoor", equip: ["uses-skis"], olympic: 1, dangerous: 1, sub: "water-winter", u: ["downhill", "mountains", "slalom"], p: 70, desc: "Downhill skiing on snowy mountains." },
  { n: "Cross-country Skiing", cat: "individual", types: ["winter-sport"], env: "outdoor", equip: ["uses-skis"], olympic: 1, sub: "water-winter", u: ["endurance", "snow", "tracks"], p: 60, desc: "Long-distance skiing across snow." },
  { n: "Snowboarding", cat: "individual", types: ["winter-sport"], env: "outdoor", equip: ["uses-board"], olympic: 1, popular: 1, dangerous: 1, sub: "water-winter", u: ["halfpipe", "tricks", "slopestyle"], p: 72, desc: "Gliding and tricks on a single board." },
  { n: "Ski Jumping", cat: "individual", types: ["winter-sport"], env: "outdoor", equip: ["uses-skis"], olympic: 1, dangerous: 1, sub: "water-winter", u: ["flying", "scary", "large-hill"], p: 55, desc: "Launching off ramps to fly on skis." },
  { n: "Figure Skating", cat: "individual", types: ["winter-sport"], env: "indoor", equip: ["uses-skates"], olympic: 1, popular: 1, sub: "water-winter", u: ["ice", "dance", "art", "jumps"], p: 75, desc: "Graceful ice skating with jumps and spins." },
  { n: "Speed Skating", cat: "individual", types: ["winter-sport", "racing-sport"], env: "indoor", equip: ["uses-skates"], olympic: 1, sub: "water-winter", u: ["ice", "fast", "oval"], p: 55, desc: "Racing on ice skates around an oval." },
  { n: "Bobsleigh", cat: "team", types: ["winter-sport", "racing-sport"], env: "outdoor", equip: ["uses-vehicle"], olympic: 1, dangerous: 1, sub: "water-winter", u: ["ice-track", "fast", "sled"], p: 55, desc: "Racing a sled down an ice track." },
  { n: "Skeleton", cat: "individual", types: ["winter-sport", "racing-sport"], env: "outdoor", equip: ["uses-vehicle"], olympic: 1, dangerous: 1, sub: "water-winter", u: ["head-first", "scary", "small-sled"], p: 45, desc: "Head-first sled racing down ice." },
  { n: "Luge", cat: "individual", types: ["winter-sport", "racing-sport"], env: "outdoor", equip: ["uses-vehicle"], olympic: 1, dangerous: 1, sub: "water-winter", u: ["feet-first", "fast", "ice-tube"], p: 45, desc: "Feet-first sled racing down ice." },
  { n: "Curling", cat: "team", types: ["winter-sport"], env: "indoor", olympic: 1, sub: "water-winter", u: ["brooms", "stones", "scottish-origin", "ice"], p: 55, desc: "Sliding stones on ice while sweeping." },
  { n: "Biathlon", cat: "individual", types: ["winter-sport"], env: "outdoor", equip: ["uses-skis", "uses-gun"], olympic: 1, sub: "water-winter", u: ["ski-and-shoot", "norwegian-popular"], p: 50, desc: "Cross-country skiing combined with rifle shooting." },
  { n: "Freestyle Skiing", cat: "individual", types: ["winter-sport"], env: "outdoor", equip: ["uses-skis"], olympic: 1, dangerous: 1, sub: "water-winter", u: ["tricks", "moguls", "aerials"], p: 55, desc: "Acrobatic skiing with jumps and moguls." },
  { n: "Nordic Combined", cat: "individual", types: ["winter-sport"], env: "outdoor", equip: ["uses-skis"], olympic: 1, sub: "water-winter", u: ["jump-and-cross", "scandinavian"], p: 40, desc: "Ski jumping combined with cross-country skiing." },
  { n: "Speed Skiing", cat: "individual", types: ["winter-sport", "racing-sport"], env: "outdoor", equip: ["uses-skis"], dangerous: 1, sub: "water-winter", u: ["fastest-non-motor", "straight-line"], p: 35, desc: "Skiing in a straight line for maximum speed." },

  // ----- Combat sports -----
  { n: "Boxing", cat: "individual", types: ["combat-sport"], env: "indoor", equip: ["uses-gloves"], contact: 1, dangerous: 1, olympic: 1, popular: 1, sub: "combat", u: ["ring", "sweet-science", "punches"], p: 84, desc: "The sweet science of fist-fighting." },
  { n: "Wrestling (Freestyle)", cat: "individual", types: ["combat-sport"], env: "indoor", contact: 1, dangerous: 1, olympic: 1, sub: "combat", u: ["mat", "ancient", "takedowns"], p: 65, desc: "An ancient grappling combat sport." },
  { n: "Greco-Roman Wrestling", cat: "individual", types: ["combat-sport"], env: "indoor", contact: 1, dangerous: 1, olympic: 1, sub: "combat", u: ["upper-body-only", "ancient", "no-leg-attacks"], p: 55, desc: "A wrestling style using only the upper body." },
  { n: "Judo", cat: "individual", types: ["combat-sport"], env: "indoor", contact: 1, olympic: 1, popular: 1, sub: "combat", u: ["throws", "gi", "japanese", "kodokan"], p: 70, desc: "A Japanese martial art of throws and pins." },
  { n: "Karate", cat: "individual", types: ["combat-sport"], env: "indoor", contact: 1, olympic: 1, sub: "combat", u: ["strikes", "japanese", "belts", "kata"], p: 70, desc: "A striking martial art from Okinawa." },
  { n: "Taekwondo", cat: "individual", types: ["combat-sport"], env: "indoor", contact: 1, olympic: 1, popular: 1, sub: "combat", u: ["kicks", "korean", "high-kicks"], p: 65, desc: "A Korean martial art of high kicks." },
  { n: "Brazilian Jiu-Jitsu", cat: "individual", types: ["combat-sport"], env: "indoor", contact: 1, dangerous: 1, sub: "combat", u: ["ground", "submissions", "mma-base", "gracie"], p: 65, desc: "A ground-fighting martial art from Brazil." },
  { n: "Muay Thai", cat: "individual", types: ["combat-sport"], env: "indoor", contact: 1, dangerous: 1, popular: 1, sub: "combat", u: ["eight-limbs", "thai", "elbows", "knees"], p: 65, desc: "The art of eight limbs from Thailand." },
  { n: "Kickboxing", cat: "individual", types: ["combat-sport"], env: "indoor", contact: 1, dangerous: 1, sub: "combat", u: ["kicks-and-punches", "ring"], p: 60, desc: "A combat sport combining kicks and punches." },
  { n: "MMA", cat: "individual", types: ["combat-sport"], env: "indoor", contact: 1, dangerous: 1, popular: 1, sub: "combat", u: ["cage", "ufc", "mixed", "octagon"], p: 85, desc: "Mixed martial arts combat in a cage." },
  { n: "Fencing", cat: "individual", types: ["combat-sport"], env: "indoor", equip: ["uses-blade"], olympic: 1, sub: "combat", u: ["sword", "mask", "three-weapons", "foil-epee-sabre"], p: 55, desc: "Dueling with swords: foil, épée, sabre." },
  { n: "Kendo", cat: "individual", types: ["combat-sport"], env: "indoor", equip: ["uses-blade"], contact: 1, sub: "combat", u: ["bamboo-sword", "japanese", "armor", "shinai"], p: 50, desc: "Japanese sword-fighting with bamboo swords." },
  { n: "Sumo", cat: "individual", types: ["combat-sport"], env: "indoor", contact: 1, popular: 1, sub: "combat", u: ["japanese", "heavy", "ritual", "ring-pushout"], p: 60, desc: "A Japanese wrestling sport of massive athletes." },
  { n: "Krav Maga", cat: "individual", types: ["combat-sport"], env: "indoor", contact: 1, dangerous: 1, sub: "combat", u: ["israeli", "self-defense", "military-origin"], p: 55, desc: "An Israeli self-defense system." },
  { n: "Wushu", cat: "individual", types: ["combat-sport"], env: "indoor", sub: "combat", u: ["chinese", "acrobatic", "kung-fu"], p: 45, desc: "A Chinese acrobatic martial art." },
  { n: "Sambo", cat: "individual", types: ["combat-sport"], env: "indoor", contact: 1, sub: "combat", u: ["russian", "soviet-origin", "jacket-wrestling"], p: 45, desc: "A Russian jacket-wrestling martial art." },
  { n: "Aikido", cat: "individual", types: ["combat-sport"], env: "indoor", sub: "combat", u: ["throws", "peaceful", "japanese", "no-competition"], p: 50, desc: "A peaceful Japanese martial art of redirection." },

  // ----- Athletics -----
  { n: "Track and Field", cat: "individual", env: "outdoor", olympic: 1, popular: 1, sub: "individual", u: ["stadium", "multiple-events", "athletics"], p: 80, desc: "Running, jumping, and throwing events." },
  { n: "Marathon", cat: "individual", env: "outdoor", popular: 1, global: 1, sub: "individual", u: ["42km", "endurance", "running", "olympic-distance"], p: 78, desc: "A 42.2 km long-distance running race." },
  { n: "Sprint", cat: "individual", types: ["racing-sport"], env: "outdoor", olympic: 1, sub: "individual", u: ["100m", "fast", "explosive"], p: 75, desc: "Short-distance running at maximum speed." },
  { n: "Long Jump", cat: "individual", env: "outdoor", olympic: 1, sub: "individual", u: ["jumping", "sand-pit", "leap"], p: 60, desc: "Leaping for distance into a sand pit." },
  { n: "High Jump", cat: "individual", env: "outdoor", olympic: 1, sub: "individual", u: ["bar", "jumping", "fosbury-flop"], p: 55, desc: "Jumping over a horizontal bar." },
  { n: "Triple Jump", cat: "individual", env: "outdoor", olympic: 1, sub: "individual", u: ["hop-step-jump", "leap"], p: 50, desc: "A hop, step, and jump for distance." },
  { n: "Pole Vault", cat: "individual", env: "outdoor", olympic: 1, sub: "individual", u: ["pole", "height", "fiberglass"], p: 55, desc: "Vaulting over a high bar with a pole." },
  { n: "Shot Put", cat: "individual", env: "outdoor", olympic: 1, sub: "individual", u: ["heavy-ball", "throw", "iron-ball"], p: 55, desc: "Throwing a heavy iron ball for distance." },
  { n: "Discus Throw", cat: "individual", env: "outdoor", olympic: 1, sub: "individual", u: ["disc", "throw", "ancient-greek"], p: 50, desc: "Throwing a disc for distance, ancient Greek origin." },
  { n: "Javelin Throw", cat: "individual", env: "outdoor", olympic: 1, sub: "individual", u: ["spear", "throw", "hunting-origin"], p: 50, desc: "Throwing a spear for distance." },
  { n: "Hammer Throw", cat: "individual", env: "outdoor", olympic: 1, sub: "individual", u: ["wire-ball", "throw", "scottish-origin"], p: 45, desc: "Throwing a heavy ball on a wire." },
  { n: "Hurdles", cat: "individual", types: ["racing-sport"], env: "outdoor", olympic: 1, sub: "individual", u: ["barriers", "sprint", "110m"], p: 55, desc: "Sprinting over barriers." },
  { n: "Racewalking", cat: "individual", env: "outdoor", olympic: 1, sub: "individual", u: ["walk-fast", "awkward", "one-foot-rule"], p: 40, desc: "Fast walking with one foot on the ground." },
  { n: "Decathlon", cat: "individual", env: "outdoor", olympic: 1, sub: "individual", u: ["10-events", "two-days", "king-of-athletics"], p: 50, desc: "Ten events over two days for men." },
  { n: "Heptathlon", cat: "individual", env: "outdoor", olympic: 1, sub: "individual", u: ["7-events", "women", "multi-event"], p: 45, desc: "Seven events over two days for women." },
  { n: "Cross Country Running", cat: "individual", env: "outdoor", sub: "individual", u: ["mud", "hills", "nature-running"], p: 45, desc: "Long-distance running across natural terrain." },
  { n: "Ultramarathon", cat: "individual", env: "outdoor", dangerous: 1, sub: "individual", u: ["over-42km", "extreme-endurance", "mountain-trails"], p: 45, desc: "Any footrace longer than a marathon." },
  { n: "Trail Running", cat: "individual", env: "outdoor", sub: "individual", u: ["mountains", "nature", "off-road"], p: 55, desc: "Running on trails through nature." },
  { n: "Orienteering", cat: "individual", env: "outdoor", sub: "individual", u: ["navigation", "map", "compass", "forest"], p: 40, desc: "Navigating between checkpoints with a map." },

  // ----- Cycling -----
  { n: "Road Cycling", cat: "individual", types: ["cycling-sport", "racing-sport"], env: "outdoor", equip: ["uses-bike"], olympic: 1, popular: 1, sub: "individual", u: ["tour-de-france", "peloton", "yellow-jersey"], p: 75, desc: "Racing bicycles on paved roads." },
  { n: "Track Cycling", cat: "individual", types: ["cycling-sport", "racing-sport"], env: "indoor", equip: ["uses-bike"], olympic: 1, sub: "individual", u: ["velodrome", "fixed-gear", "banked-track"], p: 50, desc: "Racing fixed-gear bikes on a velodrome." },
  { n: "BMX", cat: "individual", types: ["cycling-sport"], env: "outdoor", equip: ["uses-bike"], olympic: 1, dangerous: 1, sub: "individual", u: ["ramps", "tricks", "dirt-jumps"], p: 60, desc: "Tricks and racing on small bikes." },
  { n: "Mountain Biking", cat: "individual", types: ["cycling-sport", "racing-sport"], env: "outdoor", equip: ["uses-bike"], olympic: 1, dangerous: 1, sub: "individual", u: ["trails", "off-road", "downhill"], p: 60, desc: "Racing bicycles on off-road trails." },
  { n: "Cycle Speedway", cat: "individual", types: ["cycling-sport", "racing-sport"], env: "outdoor", equip: ["uses-bike"], sub: "individual", u: ["short-track", "dirt", "four-laps"], p: 35, desc: "Short dirt-track bike racing." },
  { n: "Artistic Cycling", cat: "individual", types: ["cycling-sport"], env: "indoor", equip: ["uses-bike"], sub: "individual", u: ["gymnastics-on-bike", "niche", "german-origin"], p: 30, desc: "Gymnastics performed on a bicycle." },

  // ----- Motorsports -----
  { n: "Formula 1", cat: "individual", types: ["motorsport", "racing-sport"], env: "outdoor", equip: ["uses-vehicle"], dangerous: 1, popular: 1, global: 1, sub: "individual", u: ["cars", "expensive", "grand-prix", "open-wheel"], p: 86, desc: "The pinnacle of motorsport racing." },
  { n: "Rally Racing", cat: "individual", types: ["motorsport", "racing-sport"], env: "outdoor", equip: ["uses-vehicle"], dangerous: 1, sub: "individual", u: ["stages", "co-driver", "gravel-snow-tarmac"], p: 65, desc: "Time-stage racing on varied surfaces." },
  { n: "MotoGP", cat: "individual", types: ["motorsport", "racing-sport"], env: "outdoor", equip: ["uses-vehicle"], dangerous: 1, popular: 1, sub: "individual", u: ["motorcycles", "prototype-bikes", "lean-angle"], p: 70, desc: "Top-class motorcycle road racing." },
  { n: "NASCAR", cat: "individual", types: ["motorsport", "racing-sport"], env: "outdoor", equip: ["uses-vehicle"], dangerous: 1, popular: 1, sub: "individual", u: ["oval", "stock-cars", "american", "daytona"], p: 70, desc: "Oval-track stock car racing, American." },
  { n: "IndyCar", cat: "individual", types: ["motorsport", "racing-sport"], env: "outdoor", equip: ["uses-vehicle"], dangerous: 1, sub: "individual", u: ["open-wheel", "indianapolis-500", "american"], p: 60, desc: "American open-wheel racing." },
  { n: "Drag Racing", cat: "individual", types: ["motorsport", "racing-sport"], env: "outdoor", equip: ["uses-vehicle"], dangerous: 1, sub: "individual", u: ["straight-line", "fast", "quarter-mile"], p: 55, desc: "Acceleration races on a straight strip." },
  { n: "Endurance Racing", cat: "team", types: ["motorsport", "racing-sport"], env: "outdoor", equip: ["uses-vehicle"], dangerous: 1, sub: "individual", u: ["le-mans", "24-hours", "multi-driver"], p: 55, desc: "Long-duration car racing like Le Mans." },
  { n: "Speedway", cat: "individual", types: ["motorsport", "racing-sport"], env: "outdoor", equip: ["uses-vehicle"], dangerous: 1, sub: "individual", u: ["oval", "motorcycles", "dirt"], p: 45, desc: "Oval dirt-track motorcycle racing." },
  { n: "Motocross", cat: "individual", types: ["motorsport"], env: "outdoor", equip: ["uses-vehicle"], dangerous: 1, sub: "individual", u: ["dirt-bikes", "jumps", "off-road"], p: 60, desc: "Off-road motorcycle racing with jumps." },
  { n: "Supercross", cat: "individual", types: ["motorsport"], env: "indoor", equip: ["uses-vehicle"], dangerous: 1, sub: "individual", u: ["stadium-motocross", "man-made-track"], p: 55, desc: "Stadium-based motocross on man-made tracks." },
  { n: "Karting", cat: "individual", types: ["motorsport", "racing-sport"], env: "outdoor", equip: ["uses-vehicle"], sub: "individual", u: ["small-karts", "junior", "f1-feeder"], p: 55, desc: "Open-wheel racing in small karts." },
  { n: "Truck Racing", cat: "individual", types: ["motorsport", "racing-sport"], env: "outdoor", equip: ["uses-vehicle"], dangerous: 1, sub: "individual", u: ["heavy-trucks", "niche"], p: 35, desc: "Racing modified heavy trucks." },

  // ----- Equestrian -----
  { n: "Horse Racing", cat: "individual", types: ["equestrian-sport", "racing-sport"], env: "outdoor", equip: ["uses-horse"], popular: 1, sub: "individual", u: ["jockey", "betting", "fast", "derby"], p: 70, desc: "Thoroughbred horses racing with jockeys." },
  { n: "Show Jumping", cat: "individual", types: ["equestrian-sport"], env: "outdoor", equip: ["uses-horse"], olympic: 1, sub: "individual", u: ["jumps", "arena", "obstacles"], p: 55, desc: "Horse and rider clearing obstacles." },
  { n: "Dressage", cat: "individual", types: ["equestrian-sport"], env: "outdoor", equip: ["uses-horse"], olympic: 1, sub: "individual", u: ["horse-ballet", "precise-movements"], p: 50, desc: "Horse ballet — precise, graceful movements." },
  { n: "Eventing", cat: "individual", types: ["equestrian-sport"], env: "outdoor", equip: ["uses-horse"], olympic: 1, dangerous: 1, sub: "individual", u: ["triathlon-of-equestrian", "cross-country"], p: 45, desc: "The triathlon of equestrian sports." },
  { n: "Polo", cat: "team", types: ["equestrian-sport", "ball-sport"], env: "outdoor", equip: ["uses-horse", "uses-ball", "uses-stick"], contact: 1, popular: 1, sub: "team", u: ["horses", "expensive", "royal", "argentinian"], p: 55, desc: "A sport of kings played on horseback." },
  { n: "Rodeo", cat: "individual", types: ["equestrian-sport"], env: "outdoor", equip: ["uses-horse"], dangerous: 1, sub: "team", u: ["bull-riding", "western", "lasso", "american-west"], p: 55, desc: "Western riding events including bull riding." },
  { n: "Equestrian Vaulting", cat: "individual", types: ["equestrian-sport"], env: "outdoor", equip: ["uses-horse"], sub: "individual", u: ["gymnastics-on-horse", "niche"], p: 30, desc: "Gymnastics performed on a moving horse." },
  { n: "Reining", cat: "individual", types: ["equestrian-sport"], env: "outdoor", equip: ["uses-horse"], sub: "individual", u: ["western-dressage", "spins", "sliding-stops"], p: 35, desc: "Western riding with spins and stops." },

  // ----- Target sports -----
  { n: "Archery", cat: "individual", types: ["target-sport"], env: "outdoor", equip: ["uses-bow"], olympic: 1, sub: "individual", u: ["arrows", "ancient", "bullseye"], p: 60, desc: "Shooting arrows at a target with a bow." },
  { n: "Shooting (Sport)", cat: "individual", types: ["target-sport"], env: "both", equip: ["uses-gun"], olympic: 1, sub: "individual", u: ["pistol", "rifle", "precision"], p: 55, desc: "Precision target shooting with firearms." },
  { n: "Clay Pigeon Shooting", cat: "individual", types: ["target-sport"], env: "outdoor", equip: ["uses-gun"], sub: "individual", u: ["flying-targets", "shotgun", "olympic-trap"], p: 50, desc: "Shooting flying clay targets with a shotgun." },
  { n: "Darts", cat: "individual", types: ["target-sport"], env: "indoor", popular: 1, sub: "individual", u: ["board", "pub-game", "180", "british"], p: 65, desc: "Throwing darts at a numbered board." },
  { n: "Billiards", cat: "individual", types: ["target-sport"], env: "indoor", popular: 1, sub: "individual", u: ["cues", "balls", "table", "pool"], p: 65, desc: "Cue sports played on a felt table." },
  { n: "Snooker", cat: "individual", types: ["target-sport"], env: "indoor", popular: 1, sub: "individual", u: ["cues", "larger-table", "british", "red-color-balls"], p: 60, desc: "A cue sport with 21 balls on a large table." },
  { n: "Carrom", cat: "individual", types: ["target-sport"], env: "indoor", sub: "individual", u: ["flicking", "asian-board", "wooden-pieces"], p: 45, desc: "A South Asian board game of flicking disks." },
  { n: "Bowling", cat: "individual", types: ["target-sport", "ball-sport"], env: "indoor", popular: 1, sub: "individual", u: ["ball", "pins", "american", "ten-pin"], p: 70, desc: "Rolling a ball to knock down pins." },

  // ----- Climbing & Adventure -----
  { n: "Sport Climbing", cat: "individual", types: ["adventure-sport"], env: "both", olympic: 1, dangerous: 1, sub: "individual", u: ["routes", "harness", "rope"], p: 60, desc: "Climbing bolted rock routes with ropes." },
  { n: "Bouldering", cat: "individual", types: ["adventure-sport"], env: "both", olympic: 1, sub: "individual", u: ["short-routes", "no-rope", "crash-pad"], p: 60, desc: "Climbing short routes without ropes." },
  { n: "Mountaineering", cat: "individual", types: ["adventure-sport"], env: "outdoor", dangerous: 1, sub: "individual", u: ["mountains", "expedition", "everest"], p: 55, desc: "Climbing mountains, often to summits." },
  { n: "Hiking", cat: "individual", types: ["adventure-sport"], env: "outdoor", sub: "individual", u: ["trails", "walking", "popular", "nature"], p: 70, desc: "Long walks on trails through nature." },
  { n: "Skydiving", cat: "individual", types: ["adventure-sport"], env: "outdoor", dangerous: 1, sub: "individual", u: ["parachute", "plane", "free-fall"], p: 55, desc: "Jumping from a plane and free-falling." },
  { n: "Paragliding", cat: "individual", types: ["adventure-sport"], env: "outdoor", dangerous: 1, sub: "individual", u: ["parachute", "wind", "thermals"], p: 50, desc: "Gliding with a parachute-like wing." },
  { n: "Hang Gliding", cat: "individual", types: ["adventure-sport"], env: "outdoor", dangerous: 1, sub: "individual", u: ["glider", "wind", "rigid-wing"], p: 45, desc: "Gliding with a rigid wing frame." },
  { n: "BASE Jumping", cat: "individual", types: ["adventure-sport"], env: "outdoor", dangerous: 1, sub: "individual", u: ["extreme", "illegal-some-places", "buildings-antennas-spans-earth"], p: 40, desc: "Parachuting from fixed objects." },
  { n: "Bungee Jumping", cat: "individual", types: ["adventure-sport"], env: "outdoor", dangerous: 1, sub: "individual", u: ["elastic-cord", "extreme", "bridge"], p: 50, desc: "Jumping from heights on an elastic cord." },
  { n: "Parkour", cat: "individual", types: ["adventure-sport"], env: "outdoor", dangerous: 1, sub: "individual", u: ["freerunning", "urban", "vaults-and-jumps"], p: 55, desc: "Moving efficiently through urban obstacles." },

  // ----- Strength sports -----
  { n: "Weightlifting", cat: "individual", env: "indoor", olympic: 1, dangerous: 1, sub: "individual", u: ["barbell", "snatch", "clean-and-jerk"], p: 60, desc: "Lifting heavy barbells overhead." },
  { n: "Powerlifting", cat: "individual", env: "indoor", sub: "individual", u: ["squat", "bench-press", "deadlift"], p: 55, desc: "Three max lifts: squat, bench, deadlift." },
  { n: "Bodybuilding", cat: "individual", env: "indoor", sub: "individual", u: ["posing", "muscles", "arnold", "mr-olympia"], p: 60, desc: "Building muscle for aesthetic competition." },
  { n: "Arm Wrestling", cat: "individual", types: ["combat-sport"], env: "indoor", contact: 1, sub: "individual", u: ["arms", "table", "grip"], p: 50, desc: "Two opponents pinning each other's arms." },
  { n: "Tug of War", cat: "team", env: "outdoor", sub: "team", u: ["rope", "pulling", "olympic-historic"], p: 50, desc: "Two teams pulling opposite ends of a rope." },
  { n: "Strongman", cat: "individual", env: "both", sub: "individual", u: ["heavy-objects", "atlas-stones", "worlds-strongest"], p: 50, desc: "Tests of raw strength with odd objects." },

  // ----- Gymnastics -----
  { n: "Artistic Gymnastics", cat: "individual", types: ["gymnastics-sport"], env: "indoor", olympic: 1, popular: 1, sub: "individual", u: ["apparatus", "flips", "rings", "vault"], p: 65, desc: "Acrobatic routines on apparatus." },
  { n: "Rhythmic Gymnastics", cat: "individual", types: ["gymnastics-sport"], env: "indoor", olympic: 1, sub: "individual", u: ["ribbon", "ball", "hoops", "dance"], p: 55, desc: "Graceful routines with handheld apparatus." },
  { n: "Trampolining", cat: "individual", types: ["gymnastics-sport"], env: "indoor", olympic: 1, sub: "individual", u: ["bouncing", "flips", "trampoline"], p: 45, desc: "Acrobatic bouncing on a trampoline." },
  { n: "Acrobatic Gymnastics", cat: "team", types: ["gymnastics-sport"], env: "indoor", sub: "individual", u: ["partner-acrobatics", "balance"], p: 35, desc: "Partner acrobatics on the floor." },
  { n: "Aerobic Gymnastics", cat: "individual", types: ["gymnastics-sport"], env: "indoor", sub: "individual", u: ["high-energy", "routine", "cardio"], p: 30, desc: "High-energy choreographed routines." },

  // ----- Other / Skating / Board -----
  { n: "Golf", cat: "individual", types: ["ball-sport"], env: "outdoor", equip: ["uses-ball", "uses-club"], popular: 1, global: 1, sub: "individual", u: ["courses", "par", "expensive", "scenic"], p: 82, desc: "A precision club sport played on courses." },
  { n: "Disc Golf", cat: "individual", env: "outdoor", equip: ["uses-disc"], sub: "individual", u: ["frisbee", "baskets", "growing-sport"], p: 50, desc: "Throwing discs into baskets on a course." },
  { n: "Ultimate Frisbee", cat: "team", env: "outdoor", equip: ["uses-disc"], popular: 1, sub: "team", u: ["frisbee", "spirit-of-the-game", "self-refereed"], p: 60, desc: "A self-refereed team frisbee sport." },
  { n: "Skateboarding", cat: "individual", env: "outdoor", equip: ["uses-board"], olympic: 1, popular: 1, dangerous: 1, sub: "individual", u: ["tricks", "ramps", "street", "halfpipe"], p: 75, desc: "Tricks and street riding on a board." },
  { n: "Roller Skating", cat: "individual", env: "both", equip: ["uses-skates"], sub: "individual", u: ["quad-skates", "retro", "disco"], p: 50, desc: "Rolling on four-wheeled skates." },
  { n: "Inline Skating", cat: "individual", env: "outdoor", equip: ["uses-skates"], sub: "individual", u: ["inline", "fast", "rollerblades"], p: 50, desc: "Rollerblading with inline wheels." },
  { n: "Scootering", cat: "individual", env: "outdoor", equip: ["uses-board"], sub: "individual", u: ["kick-scooter", "tricks", "extreme"], p: 40, desc: "Doing tricks on a kick scooter." },
  { n: "Cheerleading", cat: "team", env: "both", dangerous: 1, sub: "team", u: ["stunts", "pom-poms", "american-origin"], p: 55, desc: "Stunt-based routines to support sports teams." },
  { n: "Dance Sport", cat: "individual", env: "indoor", sub: "individual", u: ["ballroom", "latin", "partnership"], p: 50, desc: "Competitive ballroom and Latin dancing." },
  { n: "Synchronized Skating", cat: "team", types: ["winter-sport"], env: "indoor", equip: ["uses-skates"], sub: "team", u: ["team-figure-skating", "patterns"], p: 35, desc: "Teams of skaters performing synchronized routines." },
  { n: "Modern Pentathlon", cat: "individual", env: "outdoor", equip: ["uses-horse", "uses-gun", "uses-blade"], olympic: 1, sub: "individual", u: ["5-events", "show-jumping-shooting-fencing-swim-run"], p: 40, desc: "Five events in one Olympic sport." },
  { n: "Chess", cat: "individual", env: "indoor", sub: "individual", u: ["board", "strategy", "intellectual", "world-chess-championship"], p: 75, desc: "The royal board game of strategy." },
  { n: "Bridge", cat: "team", env: "indoor", sub: "team", u: ["cards", "partnership", "trick-taking"], p: 45, desc: "A partnership trick-taking card game." },
  { n: "Go", cat: "individual", env: "indoor", sub: "individual", u: ["board", "asian", "ancient", "black-white-stones"], p: 50, desc: "An ancient Asian board game of territory." },
  { n: "Cycle Ball", cat: "team", types: ["ball-sport", "cycling-sport"], env: "indoor", equip: ["uses-bike", "uses-ball"], sub: "team", u: ["bicycles", "soccer-on-bikes"], p: 25, desc: "Playing soccer on bicycles." },
  { n: "Underwater Rugby", cat: "team", types: ["water-sport"], env: "indoor", equip: ["uses-ball"], sub: "team", u: ["underwater", "niche", "three-dimensions"], p: 25, desc: "A 3D team sport played underwater." },
  { n: "Rounders", cat: "team", types: ["ball-sport"], env: "outdoor", equip: ["uses-ball", "uses-bat"], sub: "team", u: ["british-baseball", "irish-origin"], p: 35, desc: "A bat-and-ball sport, baseball's ancestor." },
  { n: "Street Hockey", cat: "team", types: ["ball-sport"], env: "outdoor", equip: ["uses-stick", "uses-puck"], sub: "team", u: ["asphalt", "no-ice", "ball-or-puck"], p: 40, desc: "Hockey played on asphalt without ice." },
  { n: "Indoor Hockey", cat: "team", types: ["ball-sport"], env: "indoor", equip: ["uses-stick", "uses-ball"], sub: "team", u: ["halls", "side-boards"], p: 30, desc: "Field hockey adapted for indoor halls." },
  { n: "Shinty", cat: "team", types: ["ball-sport"], env: "outdoor", equip: ["uses-stick", "uses-ball"], sub: "team", u: ["scottish", "similar-to-hurling", "caman"], p: 25, desc: "A Scottish stick-and-ball sport." },
  { n: "Roll Ball", cat: "team", types: ["ball-sport"], env: "indoor", equip: ["uses-skates", "uses-ball"], sub: "team", u: ["skates", "basketball-like"], p: 25, desc: "A basketball-like sport on roller skates." },
  { n: "Footgolf", cat: "individual", types: ["ball-sport"], env: "outdoor", equip: ["uses-ball"], sub: "individual", u: ["soccer-meets-golf", "growing-sport"], p: 35, desc: "Kicking a soccer ball into golf-style holes." },
  { n: "Footvolley", cat: "team", types: ["ball-sport"], env: "outdoor", equip: ["uses-ball", "uses-net"], sub: "team", u: ["soccer-meets-volleyball", "brazilian", "beach"], p: 35, desc: "A beach sport combining soccer and volleyball." },
  { n: "Bossaball", cat: "team", types: ["ball-sport"], env: "outdoor", equip: ["uses-ball", "uses-net", "uses-board"], sub: "team", u: ["music", "trampolines", "belgian-origin"], p: 30, desc: "A volleyball-like sport on trampolines with music." },
  { n: "Tchoukball", cat: "team", types: ["ball-sport"], env: "indoor", equip: ["uses-ball"], sub: "team", u: ["frame", "no-contact", "swiss-origin"], p: 25, desc: "A no-contact indoor team sport." },
  { n: "Korfball", cat: "team", types: ["ball-sport"], env: "both", equip: ["uses-ball"], sub: "team", u: ["dutch", "mixed-gender", "no-running-with-ball"], p: 30, desc: "A Dutch mixed-gender team sport." },
  { n: "Pesäpallo", cat: "team", types: ["ball-sport"], env: "outdoor", equip: ["uses-ball", "uses-bat"], sub: "team", u: ["finnish-baseball", "national-sport-finland"], p: 25, desc: "Finnish baseball, Finland's national sport." },
  { n: "Bocce", cat: "individual", types: ["target-sport"], env: "outdoor", sub: "individual", u: ["balls", "italian", "lawn-game"], p: 50, desc: "An Italian lawn-bowling game." },
  { n: "Lawn Bowls", cat: "individual", types: ["target-sport"], env: "outdoor", sub: "individual", u: ["biased-balls", "british", "older-players"], p: 45, desc: "Rolling biased balls toward a jack." },
  { n: "Dodgeball", cat: "team", types: ["ball-sport"], env: "both", equip: ["uses-ball"], contact: 1, sub: "team", u: ["throw-dodge", "school-game", "american-comedy-film"], p: 55, desc: "Throwing balls to eliminate opponents." },
  { n: "Kickball", cat: "team", types: ["ball-sport"], env: "outdoor", equip: ["uses-ball"], sub: "team", u: ["soccer-meets-baseball", "schoolyard"], p: 50, desc: "A baseball-like game played by kicking." },
  { n: "Cycle Polo", cat: "team", types: ["ball-sport", "cycling-sport"], env: "outdoor", equip: ["uses-bike", "uses-stick", "uses-ball"], sub: "team", u: ["bikes-instead-of-horses", "niche"], p: 25, desc: "Polo played on bicycles instead of horses." },
  { n: "Auto Gymkhana", cat: "individual", types: ["motorsport"], env: "outdoor", equip: ["uses-vehicle"], sub: "individual", u: ["precision-driving", "cones", "timed-course"], p: 30, desc: "Timed precision driving around cones." },
  { n: "Drifting", cat: "individual", types: ["motorsport"], env: "outdoor", equip: ["uses-vehicle"], dangerous: 1, sub: "individual", u: ["tire-smoke", "style", "japanese-origin"], p: 55, desc: "Style-based controlled oversteer driving." },
  { n: "Snowmobile Racing", cat: "individual", types: ["motorsport", "winter-sport"], env: "outdoor", equip: ["uses-vehicle"], dangerous: 1, sub: "individual", u: ["snow", "fast", "skis-on-front"], p: 40, desc: "Racing motorized sleds on snow." },
  { n: "Jetsprint", cat: "individual", types: ["motorsport", "water-sport", "racing-sport"], env: "outdoor", equip: ["uses-boat"], dangerous: 1, sub: "individual", u: ["jet-boat", "narrow-channel", "new-zealand-origin"], p: 30, desc: "Racing jet boats through narrow channels." },
  { n: "Powerboating", cat: "individual", types: ["motorsport", "water-sport", "racing-sport"], env: "outdoor", equip: ["uses-boat"], dangerous: 1, sub: "individual", u: ["fast-boats", "offshore-racing"], p: 40, desc: "Racing motorized boats at high speeds." },
  { n: "Land Sailing", cat: "individual", types: ["racing-sport"], env: "outdoor", equip: ["uses-vehicle"], sub: "individual", u: ["wind-powered", "wheels", "dry-lakes"], p: 25, desc: "Racing wheeled vehicles powered by wind." },
  { n: "Ice Boat Racing", cat: "individual", types: ["winter-sport", "racing-sport"], env: "outdoor", equip: ["uses-vehicle", "uses-boat"], dangerous: 1, sub: "individual", u: ["ice", "wind", "skates-on-boats"], p: 25, desc: "Racing sail-driven boats over ice." },
];

async function restoreSports(): Promise<void> {
  console.log("\n[3/5] Restoring sports...");
  const cat = await db.category.findUnique({ where: { slug: "sports" } });
  if (!cat) {
    console.log("  sports category not found — skipping");
    return;
  }
  // Ensure subcategories exist; reuse existing ones (team, individual, water-winter, combat)
  // and add new ones for richer organization.
  const subDefs: { slug: string; name: string }[] = [
    { slug: "team", name: "Team Sports" },
    { slug: "individual", name: "Individual Sports" },
    { slug: "water-winter", name: "Water & Winter Sports" },
    { slug: "combat", name: "Combat Sports" },
    { slug: "racket", name: "Racket Sports" },
    { slug: "target", name: "Target Sports" },
    { slug: "adventure", name: "Adventure Sports" },
    { slug: "equestrian", name: "Equestrian Sports" },
    { slug: "motorsport", name: "Motorsports" },
    { slug: "gymnastics", name: "Gymnastics" },
    { slug: "athletics", name: "Athletics" },
    { slug: "cycling", name: "Cycling" },
    { slug: "strength", name: "Strength Sports" },
    { slug: "board", name: "Board & Skate Sports" },
  ];
  const subMap = new Map<string, string>();
  for (const sd of subDefs) {
    const id = await ensureSubcategory(cat.id, sd.name, sd.slug);
    subMap.set(sd.slug, id);
  }
  // For any sports whose sub slug isn't in our predefined list, default to individual.
  let created = 0;
  for (const s of SPORTS) {
    await ensureEntity({
      name: s.n,
      categoryId: cat.id,
      subcategoryId: subMap.get(s.sub) ?? subMap.get("individual") ?? null,
      tags: sportTags(s),
      description: s.desc,
      popularity: s.p ?? 50,
      difficulty: s.p && s.p < 50 ? 3 : s.p && s.p < 65 ? 2 : 1,
    });
    created++;
  }
  console.log(`  Processed ${created} sports.`);
}

// ============================================================
// 4. CATEGORY-SPECIFIC QUESTIONS (20-30 per category)
// ============================================================

const CATEGORY_QUESTIONS: Record<
  string,
  { text: string; tag: string; inverted?: boolean }[]
> = {
  animals: [
    { text: "Is it a mammal?", tag: "mammal" },
    { text: "Is it a bird?", tag: "bird" },
    { text: "Is it a reptile?", tag: "reptile" },
    { text: "Is it an amphibian?", tag: "amphibian" },
    { text: "Is it a fish?", tag: "fish" },
    { text: "Is it an insect?", tag: "insect" },
    { text: "Is it an arachnid?", tag: "arachnid" },
    { text: "Is it a carnivore (meat-eater)?", tag: "carnivore" },
    { text: "Is it a herbivore (plant-eater)?", tag: "herbivore" },
    { text: "Is it an omnivore?", tag: "omnivore" },
    { text: "Is it a wild animal?", tag: "wild" },
    { text: "Is it a domestic animal?", tag: "domestic" },
    { text: "Can it fly?", tag: "flying" },
    { text: "Can it swim?", tag: "swimming" },
    { text: "Is it a large animal?", tag: "large" },
    { text: "Is it a small animal?", tag: "small" },
    { text: "Is it a predator?", tag: "predator" },
    { text: "Is it considered fast?", tag: "fast" },
    { text: "Is it considered intelligent?", tag: "smart" },
    { text: "Is it native to Africa?", tag: "african-animal" },
    { text: "Is it native to Asia?", tag: "asian-animal" },
    { text: "Is it cold-blooded?", tag: "cold-blooded" },
    { text: "Is it venomous or poisonous?", tag: "venomous-possible" },
    { text: "Does it live in the ocean?", tag: "ocean" },
    { text: "Is it nocturnal?", tag: "nocturnal" },
    { text: "Does it hibernate?", tag: "hibernates" },
    { text: "Is it kept as a pet?", tag: "pet" },
    { text: "Does it have a shell?", tag: "shell" },
    { text: "Is it colorful?", tag: "colorful" },
    { text: "Is it a long-lived animal?", tag: "long-lived" },
  ],
  characters: [
    { text: "Is the character from an anime or manga?", tag: "anime" },
    { text: "Is the character from a comic book?", tag: "comics" },
    { text: "Is the character from a cartoon?", tag: "cartoon" },
    { text: "Is the character from a book or novel?", tag: "book-character" },
    { text: "Is the character from a video game?", tag: "video-game-character" },
    { text: "Is the character a superhero?", tag: "superhero" },
    { text: "Is the character a villain?", tag: "villain" },
    { text: "Does the character have superpowers?", tag: "powers" },
    { text: "Is the character from Disney?", tag: "disney" },
    { text: "Is the character associated with Nintendo?", tag: "nintendo" },
    { text: "Does the character use magic?", tag: "magic" },
    { text: "Does the character wield a sword?", tag: "sword" },
    { text: "Is the character male?", tag: "male" },
    { text: "Is the character female?", tag: "female" },
    { text: "Is the character young (child or teen)?", tag: "young" },
    { text: "Is the character funny?", tag: "funny" },
    { text: "Is the character cute?", tag: "cute" },
    { text: "Is the character a hero?", tag: "hero" },
    { text: "Is the character an animal or animal-like?", tag: "animal-like" },
    { text: "Is the character associated with pirates?", tag: "pirate" },
    { text: "Is the character a ninja or samurai?", tag: "ninja" },
    { text: "Is the character associated with royalty?", tag: "royal" },
    { text: "Is the character robotic or mechanical?", tag: "robot" },
    { text: "Does the character wear a mask or costume?", tag: "mask" },
    { text: "Is the character from a Marvel property?", tag: "marvel" },
    { text: "Is the character from DC Comics?", tag: "dc" },
    { text: "Is the character from Star Wars?", tag: "star-wars" },
    { text: "Is the character associated with space?", tag: "space" },
  ],
  countries: [
    { text: "Is it in Asia?", tag: "asian" },
    { text: "Is it in Europe?", tag: "european" },
    { text: "Is it in the Americas?", tag: "american" },
    { text: "Is it in Africa?", tag: "african" },
    { text: "Is it in Oceania?", tag: "oceanian" },
    { text: "Is it an island nation?", tag: "island" },
    { text: "Is it landlocked?", tag: "landlocked" },
    { text: "Is it a large country?", tag: "large" },
    { text: "Is it a small country?", tag: "small" },
    { text: "Is it a populous country?", tag: "populous" },
    { text: "Is it a developed country?", tag: "developed" },
    { text: "Is it a developing country?", tag: "developing" },
    { text: "Is it tropical?", tag: "tropical" },
    { text: "Is it a cold country?", tag: "cold" },
    { text: "Is it a hot country?", tag: "hot" },
    { text: "Is it a desert country?", tag: "desert" },
    { text: "Is it an ancient civilization?", tag: "ancient-place" },
    { text: "Is it English-speaking?", tag: "english-speaking" },
    { text: "Is it French-speaking?", tag: "french-speaking" },
    { text: "Is it Spanish-speaking?", tag: "spanish-speaking" },
    { text: "Is it Portuguese-speaking?", tag: "portuguese-speaking" },
    { text: "Is it Arabic-speaking?", tag: "arabic-speaking" },
    { text: "Is it a monarchy?", tag: "monarchy" },
    { text: "Is it known for technology?", tag: "tech-advanced" },
    { text: "Is it in the Middle East?", tag: "middle-east" },
    { text: "Is it in Central America?", tag: "central-america" },
    { text: "Is it in South America?", tag: "south-america" },
    { text: "Is it in the Caribbean?", tag: "caribbean" },
    { text: "Is it in North Africa?", tag: "north-africa" },
    { text: "Is it in Sub-Saharan Africa?", tag: "west-africa" },
    { text: "Is it in Southeast Asia?", tag: "southeast-asia" },
    { text: "Is it in East Asia?", tag: "east-asia" },
    { text: "Is it in South Asia?", tag: "south-asia" },
    { text: "Is it in Central Asia?", tag: "central-asia" },
    { text: "Is it in Western Europe?", tag: "western-europe" },
    { text: "Is it in Eastern Europe?", tag: "eastern-europe" },
    { text: "Is it in Scandinavia?", tag: "scandinavia" },
  ],
  movies: [
    { text: "Is it an animated movie?", tag: "animated" },
    { text: "Is it a Disney movie?", tag: "disney" },
    { text: "Is it a Pixar movie?", tag: "pixar" },
    { text: "Is it an action movie?", tag: "action" },
    { text: "Is it a comedy?", tag: "comedy" },
    { text: "Is it a drama?", tag: "drama" },
    { text: "Is it a horror movie?", tag: "horror" },
    { text: "Is it a sci-fi movie?", tag: "scifi" },
    { text: "Is it a fantasy movie?", tag: "fantasy" },
    { text: "Is it a superhero movie?", tag: "superhero" },
    { text: "Is it a romance?", tag: "romance" },
    { text: "Is it a thriller?", tag: "thriller" },
    { text: "Is it a crime movie?", tag: "crime" },
    { text: "Is it a blockbuster?", tag: "blockbuster" },
    { text: "Is it a classic (older) movie?", tag: "classic-movie" },
    { text: "Is it a modern (recent) movie?", tag: "modern-movie" },
    { text: "Is it family-friendly?", tag: "family" },
    { text: "Is it critically acclaimed?", tag: "critically-acclaimed" },
    { text: "Is it part of a franchise?", tag: "franchise" },
    { text: "Is it an anime movie?", tag: "anime-movie" },
    { text: "Is it a Japanese movie?", tag: "japanese-movie" },
    { text: "Is it an American movie?", tag: "american-movie" },
    { text: "Is it a British movie?", tag: "british-movie" },
    { text: "Is it a long movie?", tag: "long-movie" },
    { text: "Is it a musical?", tag: "musical" },
    { text: "Is it a Star Wars movie?", tag: "star-wars" },
    { text: "Is it a Marvel movie?", tag: "marvel" },
  ],
  "tv-shows": [
    { text: "Is it a sitcom?", tag: "sitcom" },
    { text: "Is it a crime or thriller drama?", tag: "crime-drama" },
    { text: "Is it an animated show?", tag: "animated-show" },
    { text: "Is it an anime?", tag: "anime-show" },
    { text: "Is it a streaming-era show?", tag: "modern-show" },
    { text: "Is it a classic (older) show?", tag: "classic-show" },
    { text: "Is it a long-running show?", tag: "long-running" },
    { text: "Is it a British show?", tag: "british-show" },
    { text: "Is it an American show?", tag: "american-show" },
    { text: "Is it a Korean show?", tag: "korean-show" },
    { text: "Is it a Spanish-language show?", tag: "spanish-show" },
    { text: "Is it a Japanese show?", tag: "japanese-show" },
    { text: "Is it dark or violent?", tag: "dark" },
    { text: "Is it a reality show?", tag: "reality" },
    { text: "Is it a sci-fi show?", tag: "scifi-drama" },
    { text: "Is it a fantasy show?", tag: "fantasy-drama" },
    { text: "Is it a comedy?", tag: "comedy" },
    { text: "Is it on Netflix?", tag: "netflix" },
    { text: "Is it a kids show?", tag: "kids" },
    { text: "Is it critically acclaimed?", tag: "acclaimed" },
    { text: "Is it a thriller drama?", tag: "thriller-drama" },
    { text: "Is it an anthology series?", tag: "anthology" },
    { text: "Is it supernatural?", tag: "supernatural" },
    { text: "Is it about drugs or crime?", tag: "drugs" },
    { text: "Does it have dragons or magic?", tag: "dragons" },
  ],
  "video-games": [
    { text: "Is it an RPG?", tag: "rpg" },
    { text: "Is it an action-adventure game?", tag: "action-adventure" },
    { text: "Is it a shooter?", tag: "shooter" },
    { text: "Is it a first-person shooter?", tag: "first-person" },
    { text: "Is it a puzzle game?", tag: "puzzle" },
    { text: "Is it a sports or racing game?", tag: "sports-game" },
    { text: "Is it an open-world game?", tag: "open-world" },
    { text: "Is it a retro or classic game?", tag: "retro-game" },
    { text: "Is it a modern game?", tag: "modern-game" },
    { text: "Is it a Nintendo game?", tag: "nintendo" },
    { text: "Is it multiplayer?", tag: "multiplayer" },
    { text: "Does it involve magic or fantasy?", tag: "fantasy" },
    { text: "Is it a sandbox or creative game?", tag: "sandbox" },
    { text: "Is it a platformer?", tag: "platformer" },
    { text: "Is it a battle royale?", tag: "battle-royale" },
    { text: "Is it a MOBA?", tag: "moba" },
    { text: "Is it a strategy game?", tag: "strategy" },
    { text: "Is it a horror game?", tag: "horror" },
    { text: "Is it a fighting game?", tag: "fighting-game" },
    { text: "Is it a racing game?", tag: "racing" },
    { text: "Is it a story-rich game?", tag: "story-rich" },
    { text: "Is it a PC game?", tag: "pc-game" },
    { text: "Is it a Japanese game (JRPG)?", tag: "japanese-game" },
    { text: "Is it a building or construction game?", tag: "building" },
    { text: "Is it a competitive esports game?", tag: "esports" },
    { text: "Is it a turn-based game?", tag: "turn-based" },
    { text: "Is it a board game?", tag: "board-game" },
  ],
  celebrities: [
    { text: "Is this person an actor or actress?", tag: "actor" },
    { text: "Is this person a musician or singer?", tag: "musician" },
    { text: "Is this person an athlete?", tag: "athlete" },
    { text: "Is this person an entrepreneur?", tag: "entrepreneur" },
    { text: "Is this person an influencer?", tag: "influencer" },
    { text: "Is this person male?", tag: "male" },
    { text: "Is this person female?", tag: "female" },
    { text: "Is this person still alive?", tag: "alive" },
    { text: "Is this person deceased?", tag: "dead" },
    { text: "Is this person American?", tag: "american" },
    { text: "Is this person British?", tag: "british" },
    { text: "Is this person Canadian?", tag: "canadian" },
    { text: "Is this person from Asia?", tag: "asian" },
    { text: "Is this person Argentinian?", tag: "argentinian" },
    { text: "Is this person Portuguese?", tag: "portuguese" },
    { text: "Is this person a pop star?", tag: "pop" },
    { text: "Is this person a rock musician?", tag: "rock" },
    { text: "Is this person a rapper?", tag: "rap" },
    { text: "Is this person an Oscar winner?", tag: "oscar-winner" },
    { text: "Is this person a soccer player?", tag: "soccer" },
    { text: "Is this person a basketball player?", tag: "basketball" },
    { text: "Is this person a tennis player?", tag: "tennis" },
    { text: "Is this person a tech billionaire?", tag: "tech-billionaire" },
    { text: "Is this person known for being kind?", tag: "kind" },
    { text: "Is this person controversial?", tag: "controversial" },
    { text: "Is this person a YouTuber?", tag: "youtube" },
    { text: "Is this person an environmentalist?", tag: "environmentalist" },
    { text: "Is this person young (under 35)?", tag: "young" },
  ],
  sports: [
    { text: "Is it a team sport?", tag: "team-sport" },
    { text: "Is it an individual sport?", tag: "individual-sport" },
    { text: "Is it a ball sport?", tag: "ball-sport" },
    { text: "Is it a racket sport?", tag: "racket-sport" },
    { text: "Is it a water sport?", tag: "water-sport" },
    { text: "Is it a winter sport?", tag: "winter-sport" },
    { text: "Is it a combat sport?", tag: "combat-sport" },
    { text: "Is it a motorsport?", tag: "motorsport" },
    { text: "Is it an equestrian sport?", tag: "equestrian-sport" },
    { text: "Is it a target sport?", tag: "target-sport" },
    { text: "Is it an Olympic sport?", tag: "olympic" },
    { text: "Is it a contact sport?", tag: "contact" },
    { text: "Is it played indoors?", tag: "indoor-sport" },
    { text: "Is it played outdoors?", tag: "outdoor-sport" },
    { text: "Is it a racing sport?", tag: "racing-sport" },
    { text: "Is it dangerous?", tag: "dangerous" },
    { text: "Is it a globally popular sport?", tag: "popular-sport" },
    { text: "Does it use a ball?", tag: "uses-ball" },
    { text: "Does it use a racket?", tag: "uses-racket" },
    { text: "Does it use a board?", tag: "uses-board" },
    { text: "Does it use a vehicle?", tag: "uses-vehicle" },
    { text: "Does it use skis?", tag: "uses-skis" },
    { text: "Does it use a gun?", tag: "uses-gun" },
    { text: "Does it use a horse?", tag: "uses-horse" },
    { text: "Does it use a stick?", tag: "uses-stick" },
    { text: "Does it use a bat?", tag: "uses-bat" },
    { text: "Does it use a club?", tag: "uses-club" },
    { text: "Does it use a net?", tag: "uses-net" },
    { text: "Is it a gymnastics sport?", tag: "gymnastics-sport" },
    { text: "Is it a strength sport?", tag: "strength-sport" },
    { text: "Is it an adventure sport?", tag: "adventure-sport" },
    { text: "Is it a cycling sport?", tag: "cycling-sport" },
  ],
  brands: [
    { text: "Is it a technology brand?", tag: "tech-brand" },
    { text: "Is it a food or drink brand?", tag: "food-brand" },
    { text: "Is it a fashion brand?", tag: "fashion-brand" },
    { text: "Is it a car brand?", tag: "car-brand" },
    { text: "Is it a luxury (expensive) brand?", tag: "luxury-brand" },
    { text: "Is it an American brand?", tag: "american-brand" },
    { text: "Is it a Japanese brand?", tag: "japanese-brand" },
    { text: "Is it a European brand?", tag: "european" },
    { text: "Is it a Korean brand?", tag: "korean-brand" },
    { text: "Is it a German brand?", tag: "german-brand" },
    { text: "Is it a French brand?", tag: "french-brand" },
    { text: "Is it an Italian brand?", tag: "italian-brand" },
    { text: "Is it a Swedish brand?", tag: "swedish-brand" },
    { text: "Is it a global (worldwide) brand?", tag: "global-brand" },
    { text: "Is it an old, established brand?", tag: "old-brand" },
    { text: "Is it a modern, recent brand?", tag: "modern-brand" },
    { text: "Does it make hardware (devices)?", tag: "hardware-brand" },
    { text: "Does it make software?", tag: "software-brand" },
    { text: "Is it a sportswear brand?", tag: "sportswear" },
    { text: "Is it a fast-food brand?", tag: "fast-food" },
    { text: "Is it a beverage brand?", tag: "drink-brand" },
    { text: "Is it a retail brand?", tag: "retail" },
    { text: "Is it a streaming service?", tag: "streaming" },
    { text: "Is it a furniture brand?", tag: "furniture" },
    { text: "Is it a coffee brand?", tag: "coffee" },
    { text: "Is it a shoe brand?", tag: "shoes" },
    { text: "Is it a gaming brand?", tag: "gaming" },
  ],
  objects: [
    { text: "Is it an electronic device?", tag: "electronic" },
    { text: "Is it a piece of furniture?", tag: "furniture" },
    { text: "Is it an item of clothing?", tag: "clothing" },
    { text: "Is it a tool?", tag: "tool" },
    { text: "Is it a kitchen item?", tag: "kitchen" },
    { text: "Is it an office or school item?", tag: "office" },
    { text: "Is it food or drink?", tag: "food" },
    { text: "Is it small (portable)?", tag: "small-object" },
    { text: "Is it large?", tag: "large-object" },
    { text: "Is it portable?", tag: "portable" },
    { text: "Does it have a screen?", tag: "screen" },
    { text: "Does it use electricity?", tag: "electric" },
    { text: "Is it soft?", tag: "soft" },
    { text: "Is it sharp?", tag: "sharp" },
    { text: "Is it a household item?", tag: "household" },
    { text: "Is it something you wear?", tag: "wearable" },
    { text: "Is it a vehicle?", tag: "vehicle" },
    { text: "Is it a toy?", tag: "toy" },
    { text: "Is it a book or paper item?", tag: "book" },
    { text: "Is it made of metal?", tag: "metal" },
    { text: "Is it made of plastic?", tag: "plastic" },
    { text: "Is it made of wood?", tag: "wood" },
    { text: "Does it have a battery?", tag: "battery" },
    { text: "Is it used for communication?", tag: "communication" },
    { text: "Is it used for entertainment?", tag: "entertainment" },
    { text: "Is it a modern invention?", tag: "modern-object" },
    { text: "Is it an old invention?", tag: "old-object" },
    { text: "Does it have wheels?", tag: "wheels" },
    { text: "Is it expensive?", tag: "expensive" },
  ],
  historical: [
    { text: "Is this person a scientist or inventor?", tag: "scientist" },
    { text: "Is this person a political leader?", tag: "leader" },
    { text: "Is this person a military leader?", tag: "military" },
    { text: "Is this person an artist or painter?", tag: "artist" },
    { text: "Is this person a writer?", tag: "writer" },
    { text: "Is this person a musician or composer?", tag: "musician" },
    { text: "Is this person male?", tag: "male" },
    { text: "Is this person female?", tag: "female" },
    { text: "Is this person American?", tag: "american" },
    { text: "Is this person British?", tag: "british" },
    { text: "Is this person German?", tag: "german" },
    { text: "Is this person French?", tag: "french" },
    { text: "Is this person Italian?", tag: "italian" },
    { text: "Is this person from ancient times?", tag: "ancient-era" },
    { text: "Is this person from the modern era (post-1800)?", tag: "modern-era" },
    { text: "Is this person from the Renaissance?", tag: "renaissance" },
    { text: "Is this person a US president?", tag: "president" },
    { text: "Is this person a king or queen?", tag: "royal" },
    { text: "Is this person a conqueror?", tag: "conqueror" },
    { text: "Is this person a Nobel Prize winner?", tag: "nobel" },
    { text: "Is this person known for physics?", tag: "physics" },
    { text: "Is this person known for biology?", tag: "biology" },
    { text: "Is this person known for being a genius?", tag: "genius" },
    { text: "Is this person a peace activist?", tag: "activist" },
    { text: "Is this person associated with WW2?", tag: "ww2" },
    { text: "Did this person live before 1500 AD?", tag: "old-era" },
    { text: "Was this person assassinated?", tag: "assassinated" },
  ],
};

async function restoreCategoryQuestions(): Promise<void> {
  console.log("\n[4/5] Restoring category-specific questions...");
  let totalAdded = 0;
  for (const [catSlug, qs] of Object.entries(CATEGORY_QUESTIONS)) {
    const cat = await db.category.findUnique({ where: { slug: catSlug } });
    if (!cat) {
      console.log(`  category '${catSlug}' not found — skipping`);
      continue;
    }
    let added = 0;
    for (const q of qs) {
      const existing = await db.question.findFirst({ where: { text: q.text } });
      if (existing) {
        // Ensure categoryId is set if it wasn't before.
        if (!existing.categoryId) {
          await db.question.update({
            where: { id: existing.id },
            data: { categoryId: cat.id },
          });
        }
        continue;
      }
      const tag = await ensureTag(q.tag);
      await db.question.create({
        data: {
          text: q.text,
          primaryTagId: tag.id,
          categoryId: cat.id,
          inverted: q.inverted ?? false,
        },
      });
      added++;
      totalAdded++;
    }
    console.log(
      `  ${catSlug.padEnd(12)} +${added} new (total ${qs.length} ensured)`
    );
  }
  console.log(`  Total new category questions added: ${totalAdded}`);
}

// ============================================================
// 5. AGE QUESTIONS — 25+ life-stage questions
// ============================================================

type AgeQuestionSpec = {
  text: string;
  tag: string;
  category: string;
  yesMin: number;
  yesMax: number;
  noMin: number;
  noMax: number;
};

const AGE_QUESTIONS: AgeQuestionSpec[] = [
  // Education / school
  { text: "Are you currently a student (in school or university)?", tag: "in-school", category: "education", yesMin: 5, yesMax: 28, noMin: 0, noMax: 100 },
  { text: "Are you in primary or secondary school?", tag: "k-12-student", category: "education", yesMin: 5, yesMax: 18, noMin: 0, noMax: 100 },
  { text: "Are you a university student?", tag: "university-student", category: "education", yesMin: 17, yesMax: 30, noMin: 0, noMax: 100 },
  { text: "Have you graduated from university?", tag: "university-graduate", category: "education", yesMin: 22, yesMax: 100, noMin: 0, noMax: 25 },
  { text: "Did you attend kindergarten?", tag: "kindergarten", category: "education", yesMin: 5, yesMax: 100, noMin: 0, noMax: 6 },

  // Career / work
  { text: "Do you have a full-time job?", tag: "full-time-job", category: "career", yesMin: 22, yesMax: 70, noMin: 0, noMax: 100 },
  { text: "Are you retired?", tag: "retired", category: "career", yesMin: 60, yesMax: 100, noMin: 0, noMax: 65 },
  { text: "Can you legally work in most countries (age 14+)?", tag: "can-work", category: "career", yesMin: 14, yesMax: 100, noMin: 0, noMax: 14 },
  { text: "Are you self-employed or a freelancer?", tag: "self-employed", category: "career", yesMin: 18, yesMax: 70, noMin: 0, noMax: 100 },
  { text: "Do you own your own home?", tag: "homeowner", category: "career", yesMin: 28, yesMax: 100, noMin: 0, noMax: 35 },
  { text: "Have you retired from a long career?", tag: "long-career-retired", category: "career", yesMin: 65, yesMax: 100, noMin: 0, noMax: 65 },

  // Tech generation markers
  { text: "Did you grow up with smartphones?", tag: "smartphone-generation", category: "tech", yesMin: 10, yesMax: 32, noMin: 25, noMax: 100 },
  { text: "Did you grow up with the internet?", tag: "internet-generation", category: "tech", yesMin: 15, yesMax: 45, noMin: 30, noMax: 100 },
  { text: "Did you use a rotary phone growing up?", tag: "rotary-phone-era", category: "tech", yesMin: 55, yesMax: 100, noMin: 0, noMax: 55 },
  { text: "Did you use dial-up internet?", tag: "dial-up-era", category: "tech", yesMin: 30, yesMax: 65, noMin: 0, noMax: 100 },
  { text: "Did you watch TV in black and white?", tag: "bw-tv-era", category: "tech", yesMin: 60, yesMax: 100, noMin: 0, noMax: 60 },
  { text: "Did you grow up with social media?", tag: "social-media-generation", category: "tech", yesMin: 12, yesMax: 35, noMin: 25, noMax: 100 },

  // Legal milestones
  { text: "Can you legally drive a car (in most countries)?", tag: "can-drive", category: "legal", yesMin: 16, yesMax: 100, noMin: 0, noMax: 17 },
  { text: "Can you legally vote in most countries?", tag: "can-vote", category: "legal", yesMin: 18, yesMax: 100, noMin: 0, noMax: 18 },
  { text: "Can you legally drink alcohol in the US?", tag: "can-drink-us", category: "legal", yesMin: 21, yesMax: 100, noMin: 0, noMax: 21 },
  { text: "Are you old enough to sign contracts?", tag: "can-sign-contracts", category: "legal", yesMin: 18, yesMax: 100, noMin: 0, noMax: 18 },

  // Family / life-stage
  { text: "Are you married?", tag: "married", category: "family", yesMin: 22, yesMax: 100, noMin: 0, noMax: 100 },
  { text: "Do you have children?", tag: "has-children", category: "family", yesMin: 25, yesMax: 100, noMin: 0, noMax: 100 },
  { text: "Are you a teenager (13-19)?", tag: "teenager", category: "life-stage", yesMin: 13, yesMax: 19, noMin: 0, noMax: 100 },
  { text: "Are you a toddler (1-4)?", tag: "toddler", category: "life-stage", yesMin: 1, yesMax: 4, noMin: 0, noMax: 100 },
  { text: "Are you a child (5-12)?", tag: "child", category: "life-stage", yesMin: 5, yesMax: 12, noMin: 0, noMax: 100 },
  { text: "Are you a senior citizen (65+)?", tag: "senior", category: "life-stage", yesMin: 65, yesMax: 100, noMin: 0, noMax: 65 },
  { text: "Are you over 50 years old?", tag: "over-50", category: "life-stage", yesMin: 50, yesMax: 100, noMin: 0, noMax: 50 },
  { text: "Are you in your 20s?", tag: "twenties", category: "life-stage", yesMin: 20, yesMax: 29, noMin: 0, noMax: 100 },
  { text: "Are you in your 30s?", tag: "thirties", category: "life-stage", yesMin: 30, yesMax: 39, noMin: 0, noMax: 100 },
  { text: "Are you in your 40s?", tag: "forties", category: "life-stage", yesMin: 40, yesMax: 49, noMin: 0, noMax: 100 },

  // Historical markers
  { text: "Were you alive during World War II?", tag: "ww2-alive", category: "history", yesMin: 80, yesMax: 100, noMin: 0, noMax: 80 },
  { text: "Were you born after the year 2000?", tag: "born-after-2000", category: "history", yesMin: 5, yesMax: 25, noMin: 25, noMax: 100 },
  { text: "Do you remember the events of 9/11?", tag: "remembers-911", category: "history", yesMin: 25, yesMax: 100, noMin: 0, noMax: 25 },
  { text: "Were you a child in the 1980s?", tag: "child-80s", category: "history", yesMin: 45, yesMax: 100, noMin: 0, noMax: 100 },
  { text: "Were you a child in the 1990s?", tag: "child-90s", category: "history", yesMin: 35, yesMax: 100, noMin: 0, noMax: 100 },
  { text: "Were you a child in the 2000s?", tag: "child-2000s", category: "history", yesMin: 25, yesMax: 100, noMin: 0, noMax: 100 },
];

async function restoreAgeQuestions(): Promise<void> {
  console.log("\n[5/5] Restoring age questions...");
  let added = 0;
  for (const q of AGE_QUESTIONS) {
    // AgeQuestion.tag is indexed but not unique — use findFirst to locate.
    const existing = await db.ageQuestion.findFirst({ where: { tag: q.tag } });
    if (existing) {
      // Update ranges to keep them in sync with our spec.
      await db.ageQuestion.update({
        where: { id: existing.id },
        data: {
          text: q.text,
          category: q.category,
          yesMin: q.yesMin,
          yesMax: q.yesMax,
          noMin: q.noMin,
          noMax: q.noMax,
          isActive: true,
        },
      });
      continue;
    }
    await db.ageQuestion.create({
      data: {
        text: q.text,
        tag: q.tag,
        category: q.category,
        yesMin: q.yesMin,
        yesMax: q.yesMax,
        noMin: q.noMin,
        noMax: q.noMax,
        isActive: true,
      },
    });
    added++;
  }
  console.log(`  Processed ${AGE_QUESTIONS.length} age questions (+${added} new).`);
}

// ============================================================
// Main runner
// ============================================================

async function main(): Promise<void> {
  console.log("=== RESTORE-1: Database Restoration ===");
  console.log(`Started at ${new Date().toISOString()}`);

  await cleanAnimals();
  await restoreCountries();
  await restoreSports();
  await restoreCategoryQuestions();
  await restoreAgeQuestions();

  // Summary counts.
  console.log("\n=== SUMMARY ===");
  const entities = await db.entity.count();
  const tags = await db.tag.count();
  const questions = await db.question.count();
  const ageQ = await db.ageQuestion.count();
  const entityTags = await db.entityTag.count();

  const cats = await db.category.findMany({
    include: { _count: { select: { entities: true, questions: true } } },
    orderBy: { sortOrder: "asc" },
  });
  console.log(`Total entities:     ${entities}`);
  console.log(`Total entity-tags:  ${entityTags}`);
  console.log(`Total tags:         ${tags}`);
  console.log(`Total questions:    ${questions}`);
  console.log(`Total age questions: ${ageQ}`);
  console.log("\nPer-category breakdown:");
  for (const c of cats) {
    console.log(
      `  ${c.slug.padEnd(14)} entities=${String(c._count.entities).padStart(4)}  questions=${String(c._count.questions).padStart(3)}`
    );
  }
  console.log(`\nFinished at ${new Date().toISOString()}`);
}

main()
  .catch((e) => {
    console.error("Restore failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
