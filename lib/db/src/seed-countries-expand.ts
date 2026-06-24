import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { eq } from "drizzle-orm";
import { categories, subcategories, entities, entityTags, tags } from "./schema";

const { Pool } = pg;

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function seedCountriesExpand(db: ReturnType<typeof drizzle>, pool: InstanceType<typeof Pool>) {
  const catRows = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, "countries")).limit(1);
  if (!catRows[0]) { console.log("Countries category not found"); return; }
  const catId = catRows[0].id;

  const subSlugs = ["africa", "asia", "europe", "americas", "oceania"];
  const subMap = new Map<string, string>();
  for (const slug of subSlugs) {
    const r = await db.select({ id: subcategories.id }).from(subcategories).where(eq(subcategories.slug, slug)).limit(1);
    if (r[0]) subMap.set(slug, r[0].id);
  }
  const newSubs = [
    { name: "Middle East", slug: "middle-east", sort: 5 },
    { name: "Caribbean", slug: "caribbean", sort: 6 },
    { name: "Central America", slug: "central-america", sort: 7 },
  ];
  for (const s of newSubs) {
    let r = await db.select({ id: subcategories.id }).from(subcategories).where(eq(subcategories.slug, s.slug)).limit(1);
    if (!r[0]) r = await db.insert(subcategories).values({ name: s.name, slug: s.slug, categoryId: catId, sortOrder: s.sort }).returning({ id: subcategories.id });
    subMap.set(s.slug, r[0].id);
  }

  const tagCache = new Map<string, string>();
  async function ensureTag(name: string) {
    const slug = slugify(name);
    if (tagCache.has(slug)) return tagCache.get(slug)!;
    let r = await db.select({ id: tags.id }).from(tags).where(eq(tags.slug, slug)).limit(1);
    if (!r[0]) r = await db.insert(tags).values({ name, slug }).returning({ id: tags.id });
    tagCache.set(slug, r[0].id);
    return r[0].id;
  }

  async function addC(name: string, sub: string, tagNames: string[], desc?: string, pop = 55) {
    const slug = slugify(name);
    const ex = await db.select({ id: entities.id }).from(entities).where(eq(entities.slug, slug)).limit(1);
    if (ex[0]) return;
    const tagIds = await Promise.all(tagNames.map(ensureTag));
    const eR = await db.insert(entities).values({
      name, slug, description: desc ?? null, categoryId: catId,
      subcategoryId: subMap.get(sub) ?? null, difficulty: 1.0, popularity: pop,
      tagCache: tagNames.map(slugify).join(","),
    }).returning({ id: entities.id });
    for (const tid of tagIds)
      await db.insert(entityTags).values({ entityId: eR[0].id, tagId: tid, weight: 1.0 }).onConflictDoNothing();
  }

  // FORMAT: name, sub_slug, tags[], description, popularity
  const DATA: [string, string, string[], string, number][] = [
    // ── AFRICA ───────────────────────────────────────────────────────────────
    ["Algeria",          "africa", ["african","north_african","large","desert_climate","arabic_speaking","coastal_country","developing_nation"], "Largest country in Africa", 72],
    ["Angola",           "africa", ["african","southern_african","large","tropical_climate","portuguese_speaking","coastal_country","developing_nation","oil_rich_country"], "Southern African oil state", 60],
    ["Benin",            "africa", ["african","west_african","small","tropical_climate","french_speaking","coastal_country","developing_nation"], "Small West African country", 52],
    ["Botswana",         "africa", ["african","southern_african","medium","desert_climate","english_speaking","landlocked_country","developing_nation"], "Diamond-rich Southern African country", 58],
    ["Burkina Faso",     "africa", ["african","west_african","small","tropical_climate","french_speaking","landlocked_country","developing_nation"], "Landlocked West African country", 50],
    ["Burundi",          "africa", ["african","east_african","country_tiny","tropical_climate","landlocked_country","developing_nation"], "Small East African country", 45],
    ["Cabo Verde",       "africa", ["african","west_african","country_tiny","tropical_climate","portuguese_speaking","island_nation","developing_nation"], "Atlantic island nation off West Africa", 52],
    ["Cameroon",         "africa", ["african","central_african","small","tropical_climate","french_speaking","coastal_country","developing_nation"], "Central African gateway country", 60],
    ["Central African Republic","africa",["african","central_african","medium","tropical_climate","french_speaking","landlocked_country","developing_nation"], "Landlocked Central African country", 40],
    ["Chad",             "africa", ["african","central_african","large","desert_climate","french_speaking","landlocked_country","developing_nation"], "Large landlocked Saharan country", 45],
    ["Comoros",          "africa", ["african","east_african","country_tiny","tropical_climate","arabic_speaking","island_nation","developing_nation"], "Island nation off East Africa", 42],
    ["Congo (DRC)",      "africa", ["african","central_african","large","tropical_climate","large_population","french_speaking","coastal_country","developing_nation"], "Largest sub-Saharan African country", 62],
    ["Congo (Republic)", "africa", ["african","central_african","small","tropical_climate","french_speaking","coastal_country","developing_nation","oil_rich_country"], "Central African republic", 48],
    ["Djibouti",         "africa", ["african","east_african","country_tiny","desert_climate","arabic_speaking","coastal_country","developing_nation"], "Small Horn of Africa state", 48],
    ["Equatorial Guinea","africa", ["african","central_african","country_tiny","tropical_climate","coastal_country","developing_nation","oil_rich_country"], "Oil-rich tiny Central African state", 45],
    ["Eritrea",          "africa", ["african","east_african","small","desert_climate","coastal_country","developing_nation"], "East African Red Sea country", 45],
    ["Eswatini",         "africa", ["african","southern_african","country_tiny","temperate_climate","landlocked_country","developing_nation","monarchy_country"], "Small southern African kingdom", 45],
    ["Ethiopia",         "africa", ["african","east_african","large","tropical_climate","large_population","landlocked_country","developing_nation","ancient_place","mountainous_country"], "Horn of Africa powerhouse", 75],
    ["Gabon",            "africa", ["african","central_african","small","tropical_climate","french_speaking","coastal_country","developing_nation","oil_rich_country"], "Oil-rich Central African country", 52],
    ["Gambia",           "africa", ["african","west_african","country_tiny","tropical_climate","english_speaking","coastal_country","developing_nation"], "Smallest mainland African country", 48],
    ["Ghana",            "africa", ["african","west_african","small","tropical_climate","english_speaking","coastal_country","developing_nation"], "West African democracy", 70],
    ["Guinea",           "africa", ["african","west_african","small","tropical_climate","french_speaking","coastal_country","developing_nation"], "West African coastal country", 50],
    ["Lesotho",          "africa", ["african","southern_african","country_tiny","temperate_climate","landlocked_country","developing_nation","mountainous_country"], "Mountain kingdom in Southern Africa", 45],
    ["Liberia",          "africa", ["african","west_african","small","tropical_climate","english_speaking","coastal_country","developing_nation"], "West African republic", 48],
    ["Libya",            "africa", ["african","north_african","large","desert_climate","arabic_speaking","coastal_country","developing_nation","oil_rich_country"], "North African oil state", 62],
    ["Madagascar",       "africa", ["african","island_nation","large","tropical_climate","coastal_country","developing_nation"], "World's fourth largest island", 68],
    ["Malawi",           "africa", ["african","southern_african","country_tiny","tropical_climate","english_speaking","landlocked_country","developing_nation"], "Warm heart of Africa", 48],
    ["Mali",             "africa", ["african","west_african","large","desert_climate","french_speaking","landlocked_country","developing_nation"], "Large landlocked Saharan country", 52],
    ["Mauritania",       "africa", ["african","north_african","west_african","large","desert_climate","arabic_speaking","coastal_country","developing_nation"], "Vast Saharan country", 48],
    ["Mauritius",        "africa", ["african","island_nation","country_tiny","tropical_climate","island_nation","developing_nation"], "Indian Ocean island nation", 60],
    ["Mozambique",       "africa", ["african","southern_african","medium","tropical_climate","portuguese_speaking","coastal_country","developing_nation"], "Southern African coastal country", 55],
    ["Namibia",          "africa", ["african","southern_african","large","desert_climate","english_speaking","coastal_country","developing_nation"], "Desert country in southern Africa", 58],
    ["Niger",            "africa", ["african","west_african","large","desert_climate","french_speaking","landlocked_country","developing_nation"], "Saharan West African country", 48],
    ["Rwanda",           "africa", ["african","east_african","country_tiny","tropical_climate","landlocked_country","developing_nation"], "Land of a thousand hills", 60],
    ["Sao Tome and Principe","africa",["african","central_african","country_tiny","tropical_climate","portuguese_speaking","island_nation","developing_nation"], "Tiny island nation in Gulf of Guinea", 42],
    ["Senegal",          "africa", ["african","west_african","small","tropical_climate","french_speaking","coastal_country","developing_nation"], "West African coastal country", 62],
    ["Seychelles",       "africa", ["african","island_nation","country_tiny","tropical_climate","coastal_country","developing_nation"], "Tiny Indian Ocean island nation", 58],
    ["Sierra Leone",     "africa", ["african","west_african","small","tropical_climate","english_speaking","coastal_country","developing_nation"], "West African coastal country", 48],
    ["Somalia",          "africa", ["african","east_african","medium","desert_climate","arabic_speaking","coastal_country","developing_nation"], "Horn of Africa nation", 50],
    ["South Sudan",      "africa", ["african","east_african","medium","tropical_climate","landlocked_country","developing_nation"], "World's newest country", 42],
    ["Sudan",            "africa", ["african","north_african","east_african","large","desert_climate","arabic_speaking","developing_nation"], "Large northeastern African country", 58],
    ["Tanzania",         "africa", ["african","east_african","medium","tropical_climate","english_speaking","coastal_country","developing_nation"], "East African country with Kilimanjaro", 70],
    ["Togo",             "africa", ["african","west_african","country_tiny","tropical_climate","french_speaking","coastal_country","developing_nation"], "Thin West African country", 48],
    ["Tunisia",          "africa", ["african","north_african","small","mediterranean_climate","arabic_speaking","coastal_country","developing_nation"], "North African Mediterranean country", 65],
    ["Uganda",           "africa", ["african","east_african","small","tropical_climate","english_speaking","landlocked_country","developing_nation"], "Pearl of Africa", 60],
    ["Zambia",           "africa", ["african","southern_african","medium","tropical_climate","english_speaking","landlocked_country","developing_nation"], "Southern African landlocked country", 50],
    ["Zimbabwe",         "africa", ["african","southern_african","small","tropical_climate","english_speaking","landlocked_country","developing_nation"], "Southern African country", 55],

    // ── ASIA (non-Middle-East) ───────────────────────────────────────────────
    ["Afghanistan",   "asia", ["asian","south_asian","central_asian","medium","mountainous_country","landlocked_country","developing_nation","desert_climate"], "Landlocked South/Central Asian country", 65],
    ["Armenia",       "asia", ["asian","central_asian","small","mountainous_country","landlocked_country","developing_nation","temperate_climate"], "Caucasus mountain country", 55],
    ["Azerbaijan",    "asia", ["asian","central_asian","small","temperate_climate","coastal_country","developing_nation","oil_rich_country"], "Caucasus oil country on Caspian Sea", 58],
    ["Bangladesh",    "asia", ["asian","south_asian","small","tropical_climate","large_population","coastal_country","developing_nation"], "Densely populated South Asian delta country", 70],
    ["Bhutan",        "asia", ["asian","south_asian","small","mountainous_country","landlocked_country","developing_nation","monarchy_country"], "Himalayan Buddhist kingdom", 60],
    ["Brunei",        "asia", ["asian","southeast_asian","country_tiny","tropical_climate","coastal_country","oil_rich_country","monarchy_country","developed_nation"], "Tiny wealthy Bornean sultanate", 55],
    ["Cambodia",      "asia", ["asian","southeast_asian","small","tropical_climate","coastal_country","developing_nation","ancient_place"], "Southeast Asian country", 62],
    ["Georgia",       "asia", ["asian","central_asian","small","temperate_climate","mountainous_country","coastal_country","developing_nation"], "Caucasus country on Black Sea", 60],
    ["Kazakhstan",    "asia", ["asian","central_asian","massive","cold_climate","large_population","landlocked_country","emerging_nation","oil_rich_country"], "Largest landlocked country in the world", 70],
    ["Kiribati",      "oceania",["oceanian","pacific_island","country_tiny","tropical_climate","island_nation","developing_nation"], "Low-lying Pacific atoll nation", 40],
    ["Korea (North)", "asia", ["asian","east_asian","small","temperate_climate","coastal_country","developing_nation","nuclear_country"], "Isolated East Asian state", 68],
    ["Kyrgyzstan",    "asia", ["asian","central_asian","small","cold_climate","landlocked_country","mountainous_country","developing_nation"], "Central Asian mountain country", 48],
    ["Laos",          "asia", ["asian","southeast_asian","small","tropical_climate","landlocked_country","developing_nation"], "Landlocked Southeast Asian country", 52],
    ["Malaysia",      "asia", ["asian","southeast_asian","medium","tropical_climate","coastal_country","emerging_nation"], "Southeast Asian emerging economy", 78],
    ["Maldives",      "asia", ["asian","south_asian","country_tiny","tropical_climate","island_nation","developing_nation"], "Low-lying Indian Ocean island nation", 62],
    ["Mongolia",      "asia", ["asian","east_asian","large","cold_climate","landlocked_country","developing_nation"], "Vast landlocked steppe country", 60],
    ["Myanmar",       "asia", ["asian","southeast_asian","medium","tropical_climate","coastal_country","developing_nation"], "Southeast Asian country also known as Burma", 60],
    ["Nepal",         "asia", ["asian","south_asian","small","mountainous_country","landlocked_country","developing_nation"], "Himalayan landlocked country", 65],
    ["Pakistan",      "asia", ["asian","south_asian","large","desert_climate","large_population","coastal_country","developing_nation","nuclear_country"], "South Asian nuclear state", 78],
    ["Philippines",   "asia", ["asian","southeast_asian","medium","tropical_climate","large_population","island_nation","coastal_country","developing_nation"], "Southeast Asian island archipelago", 80],
    ["Singapore",     "asia", ["asian","southeast_asian","country_tiny","tropical_climate","island_nation","developed_nation","coastal_country","tech_advanced"], "Ultra-developed city-state", 82],
    ["Sri Lanka",     "asia", ["asian","south_asian","small","tropical_climate","island_nation","coastal_country","developing_nation"], "Teardrop island of South Asia", 68],
    ["Tajikistan",    "asia", ["asian","central_asian","small","cold_climate","landlocked_country","mountainous_country","developing_nation"], "Central Asian mountain country", 45],
    ["Turkmenistan",  "asia", ["asian","central_asian","medium","desert_climate","landlocked_country","developing_nation","oil_rich_country"], "Central Asian desert country", 48],
    ["Uzbekistan",    "asia", ["asian","central_asian","medium","desert_climate","large_population","landlocked_country","developing_nation"], "Central Asian country", 52],
    ["Vietnam",       "asia", ["asian","southeast_asian","medium","tropical_climate","large_population","coastal_country","developing_nation"], "Southeast Asian country", 78],

    // ── MIDDLE EAST ──────────────────────────────────────────────────────────
    ["Bahrain",              "middle-east",["asian","middle_eastern","country_tiny","desert_climate","arabic_speaking","island_nation","oil_rich_country","monarchy_country","developed_nation"], "Small Gulf island kingdom", 65],
    ["Iran",                 "middle-east",["asian","middle_eastern","large","desert_climate","coastal_country","oil_rich_country","developing_nation","ancient_place"], "Major Middle Eastern country", 82],
    ["Iraq",                 "middle-east",["asian","middle_eastern","medium","desert_climate","arabic_speaking","coastal_country","oil_rich_country","developing_nation","ancient_place"], "Mesopotamian country", 72],
    ["Israel",               "middle-east",["asian","middle_eastern","small","mediterranean_climate","coastal_country","developed_nation","tech_advanced"], "Middle Eastern state", 80],
    ["Jordan",               "middle-east",["asian","middle_eastern","small","desert_climate","arabic_speaking","developing_nation","monarchy_country"], "Hashemite Kingdom", 65],
    ["Kuwait",               "middle-east",["asian","middle_eastern","country_tiny","desert_climate","arabic_speaking","coastal_country","oil_rich_country","monarchy_country","developed_nation"], "Wealthy Gulf state", 65],
    ["Lebanon",              "middle-east",["asian","middle_eastern","country_tiny","mediterranean_climate","arabic_speaking","coastal_country","developing_nation"], "Mediterranean Middle Eastern country", 62],
    ["Oman",                 "middle-east",["asian","middle_eastern","medium","desert_climate","arabic_speaking","coastal_country","oil_rich_country","monarchy_country","developing_nation"], "Gulf sultanate on Arabian Sea", 62],
    ["Palestine",            "middle-east",["asian","middle_eastern","country_tiny","mediterranean_climate","arabic_speaking","developing_nation"], "Palestinian territories", 55],
    ["Qatar",                "middle-east",["asian","middle_eastern","country_tiny","desert_climate","arabic_speaking","coastal_country","oil_rich_country","monarchy_country","developed_nation","g20_country"], "Wealthy Gulf state host of World Cup 2022", 72],
    ["Saudi Arabia",         "middle-east",["asian","middle_eastern","large","desert_climate","arabic_speaking","coastal_country","oil_rich_country","monarchy_country","developed_nation","g20_country"], "Largest Arab country and oil giant", 85],
    ["Syria",                "middle-east",["asian","middle_eastern","small","mediterranean_climate","arabic_speaking","coastal_country","developing_nation"], "Middle Eastern country", 60],
    ["Turkey",               "middle-east",["asian","middle_eastern","large","mediterranean_climate","large_population","coastal_country","emerging_nation","g20_country"], "Transcontinental country bridging Europe and Asia", 85],
    ["United Arab Emirates", "middle-east",["asian","middle_eastern","small","desert_climate","arabic_speaking","coastal_country","oil_rich_country","monarchy_country","developed_nation","g20_country"], "UAE — wealthy Gulf federation", 85],
    ["Yemen",                "middle-east",["asian","middle_eastern","medium","desert_climate","arabic_speaking","coastal_country","developing_nation"], "War-torn Middle Eastern country", 52],

    // ── EUROPE ───────────────────────────────────────────────────────────────
    ["Albania",              "europe",["european","southern_european","small","mediterranean_climate","coastal_country","developing_nation"], "Adriatic Balkan country", 52],
    ["Andorra",              "europe",["european","southern_european","country_tiny","mountainous_country","landlocked_country","developed_nation","temperate_climate"], "Tiny Pyrenean microstate", 52],
    ["Armenia",              "asia",  ["asian","central_asian","small","mountainous_country","landlocked_country","developing_nation","temperate_climate"], "Caucasus mountain country", 55], // already covered above
    ["Austria",              "europe",["european","western_european","medium","temperate_climate","landlocked_country","developed_nation","mountainous_country","g20_country"], "Alpine Central European country", 80],
    ["Azerbaijan",           "asia",  ["asian","central_asian","small","temperate_climate","coastal_country","developing_nation","oil_rich_country"], "Caucasus oil country", 58],
    ["Belarus",              "europe",["european","eastern_european","medium","cold_climate","landlocked_country","developing_nation"], "Eastern European landlocked country", 58],
    ["Belgium",              "europe",["european","western_european","small","temperate_climate","coastal_country","developed_nation","g7_country"], "Western European country and EU hub", 78],
    ["Bosnia and Herzegovina","europe",["european","southern_european","small","temperate_climate","coastal_country","developing_nation"], "Balkan country in southeastern Europe", 52],
    ["Bulgaria",             "europe",["european","eastern_european","medium","temperate_climate","coastal_country","developing_nation"], "Eastern European Black Sea country", 62],
    ["Croatia",              "europe",["european","southern_european","small","mediterranean_climate","coastal_country","developed_nation"], "Adriatic European country", 68],
    ["Cyprus",               "europe",["european","southern_european","country_tiny","mediterranean_climate","island_nation","coastal_country","developed_nation"], "Mediterranean island nation", 62],
    ["Czech Republic",       "europe",["european","eastern_european","small","temperate_climate","landlocked_country","developed_nation"], "Central European landlocked country", 72],
    ["Denmark",              "europe",["european","northern_european","small","cold_climate","coastal_country","developed_nation","monarchy_country"], "Scandinavian country", 78],
    ["Estonia",              "europe",["european","northern_european","country_tiny","cold_climate","coastal_country","developed_nation","tech_advanced"], "Baltic state in Northern Europe", 60],
    ["Finland",              "europe",["european","northern_european","large","cold_climate","coastal_country","developed_nation"], "Nordic country of forests and lakes", 75],
    ["Greece",               "europe",["european","southern_european","medium","mediterranean_climate","coastal_country","developed_nation","ancient_place"], "Mediterranean European country with ancient history", 82],
    ["Hungary",              "europe",["european","eastern_european","medium","temperate_climate","landlocked_country","developed_nation"], "Central European landlocked country", 70],
    ["Iceland",              "europe",["european","northern_european","medium","cold_climate","island_nation","coastal_country","developed_nation"], "North Atlantic volcanic island nation", 68],
    ["Ireland",              "europe",["european","northern_european","small","temperate_climate","island_nation","coastal_country","developed_nation","english_speaking"], "Island nation west of Great Britain", 75],
    ["Israel",               "middle-east",["asian","middle_eastern","small","mediterranean_climate","coastal_country","developed_nation","tech_advanced"], "Middle Eastern state", 80],
    ["Latvia",               "europe",["european","northern_european","small","cold_climate","coastal_country","developed_nation"], "Baltic state in Northern Europe", 58],
    ["Liechtenstein",        "europe",["european","western_european","country_tiny","temperate_climate","landlocked_country","developed_nation","mountainous_country"], "Tiny Alpine microstate between Switzerland and Austria", 50],
    ["Lithuania",            "europe",["european","northern_european","small","cold_climate","coastal_country","developed_nation"], "Baltic state in Northern Europe", 60],
    ["Luxembourg",           "europe",["european","western_european","country_tiny","temperate_climate","landlocked_country","developed_nation"], "Tiny wealthy European duchy", 60],
    ["Malta",                "europe",["european","southern_european","country_tiny","mediterranean_climate","island_nation","coastal_country","developed_nation"], "Tiny Mediterranean island state", 58],
    ["Moldova",              "europe",["european","eastern_european","country_tiny","temperate_climate","landlocked_country","developing_nation"], "Small Eastern European landlocked country", 48],
    ["Monaco",               "europe",["european","western_european","country_tiny","mediterranean_climate","coastal_country","developed_nation","monarchy_country"], "Tiny principality on the French Riviera", 62],
    ["Montenegro",           "europe",["european","southern_european","country_tiny","mediterranean_climate","coastal_country","developing_nation"], "Small Adriatic country", 50],
    ["North Macedonia",      "europe",["european","southern_european","country_tiny","temperate_climate","landlocked_country","developing_nation"], "Landlocked Balkan country", 48],
    ["Norway",               "europe",["european","northern_european","medium","cold_climate","coastal_country","developed_nation","oil_rich_country","monarchy_country"], "Wealthy Nordic country", 80],
    ["Poland",               "europe",["european","eastern_european","medium","temperate_climate","large_population","coastal_country","developed_nation","g20_country"], "Large Eastern European country", 82],
    ["Portugal",             "europe",["european","western_european","small","mediterranean_climate","coastal_country","developed_nation","portuguese_speaking"], "Western Iberian peninsula country", 75],
    ["Romania",              "europe",["european","eastern_european","medium","temperate_climate","large_population","coastal_country","developing_nation"], "Eastern European country on the Black Sea", 70],
    ["San Marino",           "europe",["european","southern_european","country_tiny","temperate_climate","landlocked_country","developed_nation","mountainous_country"], "Tiny republic within Italy", 50],
    ["Serbia",               "europe",["european","southern_european","small","temperate_climate","landlocked_country","developing_nation"], "Balkan landlocked country", 58],
    ["Slovakia",             "europe",["european","eastern_european","small","temperate_climate","landlocked_country","developed_nation"], "Central European landlocked country", 60],
    ["Slovenia",             "europe",["european","southern_european","country_tiny","temperate_climate","coastal_country","developed_nation"], "Small Adriatic Central European country", 60],
    ["Switzerland",          "europe",["european","western_european","small","temperate_climate","landlocked_country","developed_nation","mountainous_country"], "Neutral Alpine country", 82],
    ["Ukraine",              "europe",["european","eastern_european","large","temperate_climate","large_population","coastal_country","developing_nation","nuclear_country"], "Large Eastern European country", 78],
    ["Vatican City",         "europe",["european","southern_european","country_tiny","mediterranean_climate","landlocked_country","developed_nation"], "World's smallest country — seat of the Catholic Church", 72],

    // ── AMERICAS – North ─────────────────────────────────────────────────────
    ["Belize",    "central-america",["central_american","small","tropical_climate","english_speaking","coastal_country","developing_nation"], "Central American English-speaking country", 50],
    ["Costa Rica","central-america",["central_american","small","tropical_climate","coastal_country","developing_nation","spanish_speaking"], "Peaceful Central American country", 68],
    ["El Salvador","central-america",["central_american","country_tiny","tropical_climate","coastal_country","developing_nation","spanish_speaking"], "Smallest Central American country", 52],
    ["Guatemala", "central-america",["central_american","small","tropical_climate","large_population","coastal_country","developing_nation","spanish_speaking"], "Largest Central American country", 62],
    ["Honduras",  "central-america",["central_american","small","tropical_climate","coastal_country","developing_nation","spanish_speaking"], "Central American country", 52],
    ["Nicaragua", "central-america",["central_american","medium","tropical_climate","coastal_country","developing_nation","spanish_speaking"], "Central American country with two coasts", 52],
    ["Panama",    "central-america",["central_american","small","tropical_climate","coastal_country","developing_nation","spanish_speaking"], "Central American canal country", 65],

    // ── AMERICAS – Caribbean ─────────────────────────────────────────────────
    ["Antigua and Barbuda",        "caribbean",["caribbean","island_nation","country_tiny","tropical_climate","coastal_country","developing_nation","english_speaking"], "Twin-island Caribbean nation", 48],
    ["Bahamas",                    "caribbean",["caribbean","island_nation","small","tropical_climate","coastal_country","developing_nation","english_speaking"], "Caribbean island chain nation", 60],
    ["Barbados",                   "caribbean",["caribbean","island_nation","country_tiny","tropical_climate","coastal_country","developing_nation","english_speaking"], "Eastern Caribbean island", 55],
    ["Cuba",                       "caribbean",["caribbean","island_nation","small","tropical_climate","large_population","coastal_country","developing_nation","spanish_speaking"], "Largest Caribbean island", 75],
    ["Dominica",                   "caribbean",["caribbean","island_nation","country_tiny","tropical_climate","coastal_country","developing_nation","english_speaking"], "Nature island of the Caribbean", 42],
    ["Dominican Republic",         "caribbean",["caribbean","island_nation","small","tropical_climate","large_population","coastal_country","developing_nation","spanish_speaking"], "Caribbean island nation", 68],
    ["Grenada",                    "caribbean",["caribbean","island_nation","country_tiny","tropical_climate","coastal_country","developing_nation","english_speaking"], "Spice island of the Caribbean", 45],
    ["Haiti",                      "caribbean",["caribbean","island_nation","country_tiny","tropical_climate","large_population","coastal_country","developing_nation"], "Western Hispaniola nation", 55],
    ["Jamaica",                    "caribbean",["caribbean","island_nation","small","tropical_climate","coastal_country","developing_nation","english_speaking"], "Reggae island in the Caribbean", 70],
    ["Saint Kitts and Nevis",      "caribbean",["caribbean","island_nation","country_tiny","tropical_climate","coastal_country","developing_nation","english_speaking"], "Smallest nation in the Americas", 42],
    ["Saint Lucia",                "caribbean",["caribbean","island_nation","country_tiny","tropical_climate","coastal_country","developing_nation","english_speaking"], "Eastern Caribbean island", 48],
    ["Saint Vincent and the Grenadines","caribbean",["caribbean","island_nation","country_tiny","tropical_climate","coastal_country","developing_nation","english_speaking"], "Eastern Caribbean island chain", 42],
    ["Trinidad and Tobago",        "caribbean",["caribbean","island_nation","country_tiny","tropical_climate","coastal_country","developing_nation","english_speaking","oil_rich_country"], "Southernmost Caribbean nation", 58],

    // ── AMERICAS – South ─────────────────────────────────────────────────────
    ["Bolivia",   "americas",["south_american","medium","tropical_climate","large_population","landlocked_country","developing_nation","spanish_speaking","mountainous_country"], "Andean landlocked country", 60],
    ["Chile",     "americas",["south_american","large","temperate_climate","large_population","coastal_country","emerging_nation","spanish_speaking","mountainous_country"], "Long narrow South American country", 80],
    ["Colombia",  "americas",["south_american","medium","tropical_climate","large_population","coastal_country","emerging_nation","spanish_speaking","g20_country"], "Northwestern South American country", 78],
    ["Ecuador",   "americas",["south_american","small","tropical_climate","large_population","coastal_country","developing_nation","spanish_speaking"], "Equatorial South American country", 68],
    ["Paraguay",  "americas",["south_american","small","tropical_climate","large_population","landlocked_country","developing_nation","spanish_speaking"], "Landlocked South American country", 55],
    ["Peru",      "americas",["south_american","large","tropical_climate","large_population","coastal_country","developing_nation","spanish_speaking","mountainous_country","ancient_place"], "Andean South American country", 78],
    ["Suriname",  "americas",["south_american","small","tropical_climate","coastal_country","developing_nation"], "Small South American country", 45],
    ["Uruguay",   "americas",["south_american","small","temperate_climate","coastal_country","emerging_nation","spanish_speaking"], "Small southern South American country", 62],
    ["Venezuela", "americas",["south_american","medium","tropical_climate","large_population","coastal_country","developing_nation","spanish_speaking","oil_rich_country"], "Oil-rich South American country", 65],

    // ── OCEANIA ──────────────────────────────────────────────────────────────
    ["Fiji",             "oceania",["oceanian","pacific_island","small","tropical_climate","island_nation","coastal_country","developing_nation"], "Melanesian island nation", 62],
    ["Marshall Islands", "oceania",["oceanian","pacific_island","country_tiny","tropical_climate","island_nation","coastal_country","developing_nation"], "Micronesian island nation", 40],
    ["Micronesia",       "oceania",["oceanian","pacific_island","country_tiny","tropical_climate","island_nation","coastal_country","developing_nation"], "Pacific island federation", 40],
    ["Nauru",            "oceania",["oceanian","pacific_island","country_tiny","tropical_climate","island_nation","coastal_country","developing_nation"], "World's smallest island nation by area", 40],
    ["Palau",            "oceania",["oceanian","pacific_island","country_tiny","tropical_climate","island_nation","coastal_country","developing_nation"], "Micronesian island nation", 45],
    ["Papua New Guinea", "oceania",["oceanian","pacific_island","medium","tropical_climate","large_population","island_nation","coastal_country","developing_nation"], "Melanesian island nation", 55],
    ["Samoa",            "oceania",["oceanian","pacific_island","country_tiny","tropical_climate","island_nation","coastal_country","developing_nation"], "Polynesian island nation", 48],
    ["Solomon Islands",  "oceania",["oceanian","pacific_island","small","tropical_climate","island_nation","coastal_country","developing_nation"], "Melanesian island chain", 42],
    ["Tonga",            "oceania",["oceanian","pacific_island","country_tiny","tropical_climate","island_nation","coastal_country","developing_nation","monarchy_country"], "Polynesian kingdom", 48],
    ["Tuvalu",           "oceania",["oceanian","pacific_island","country_tiny","tropical_climate","island_nation","coastal_country","developing_nation"], "Tiny Pacific atoll nation threatened by rising seas", 40],
    ["Vanuatu",          "oceania",["oceanian","pacific_island","small","tropical_climate","island_nation","coastal_country","developing_nation"], "Melanesian island nation", 42],
  ];

  // De-duplicate (Armenia and Azerbaijan appear twice above from copy — addC skips anyway)
  let added = 0;
  for (const [name, sub, tagArr, desc, pop] of DATA) {
    const before = await db.select({ id: entities.id }).from(entities).where(eq(entities.slug, slugify(name))).limit(1);
    if (!before[0]) added++;
    await addC(name, sub, tagArr, desc, pop);
  }
  console.log(`  Countries expand: ~${added} new entries`);
}
