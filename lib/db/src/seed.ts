import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import {
  categories, subcategories, entities, entityTags, tags, questions, settings,
} from "./schema";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

type EntitySeed = { name: string; sub?: string; tags: string[]; description?: string; difficulty?: number; popularity?: number; };
type CategorySeed = { name: string; slug: string; icon: string; color: string; description: string; subs: { name: string; slug: string }[]; entities: EntitySeed[]; };
type QuestionSeed = { text: string; tag: string; inverted?: boolean; category?: string; };

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const CATEGORIES: CategorySeed[] = [
  {
    name: "Jobs & Professions", slug: "jobs", icon: "Briefcase", color: "#f59e0b",
    description: "Think of any job or profession — doctor, pilot, chef, and more.",
    subs: [{ name: "Healthcare", slug: "healthcare" }, { name: "Technology", slug: "technology" }, { name: "Education", slug: "education" }, { name: "Arts & Media", slug: "arts-media" }, { name: "Trades & Labor", slug: "trades" }, { name: "Business & Law", slug: "business-law" }],
    entities: [
      { name: "Doctor", sub: "healthcare", tags: ["profession", "healthcare", "degree", "science", "indoor", "high_income", "people_focused", "uniform"], description: "A medical professional.", popularity: 95 },
      { name: "Nurse", sub: "healthcare", tags: ["profession", "healthcare", "degree", "indoor", "people_focused", "uniform", "caregiving"], description: "A healthcare worker.", popularity: 88 },
      { name: "Surgeon", sub: "healthcare", tags: ["profession", "healthcare", "degree", "science", "indoor", "high_income", "people_focused", "precise"], description: "A doctor who performs operations.", popularity: 80 },
      { name: "Dentist", sub: "healthcare", tags: ["profession", "healthcare", "degree", "science", "indoor", "high_income", "people_focused"], description: "A doctor specializing in teeth.", popularity: 72 },
      { name: "Veterinarian", sub: "healthcare", tags: ["profession", "healthcare", "degree", "science", "animal_care", "people_focused"], description: "A doctor for animals.", popularity: 70 },
      { name: "Pharmacist", sub: "healthcare", tags: ["profession", "healthcare", "degree", "science", "indoor", "people_focused"], description: "Dispenses medications.", popularity: 65 },
      { name: "Psychologist", sub: "healthcare", tags: ["profession", "healthcare", "degree", "science", "indoor", "people_focused", "mental_health"], description: "Studies and treats mental health.", popularity: 68 },
      { name: "Software Engineer", sub: "technology", tags: ["profession", "technology", "degree", "indoor", "high_income", "machine_focused", "creative", "industry-technology"], description: "Builds software and applications.", popularity: 90 },
      { name: "Data Scientist", sub: "technology", tags: ["profession", "technology", "degree", "science", "indoor", "high_income", "machine_focused", "industry-technology"], description: "Analyzes data to find insights.", popularity: 75 },
      { name: "Web Developer", sub: "technology", tags: ["profession", "technology", "degree", "indoor", "high_income", "machine_focused", "creative", "industry-technology"], description: "Builds websites and web apps.", popularity: 78 },
      { name: "Cybersecurity Analyst", sub: "technology", tags: ["profession", "technology", "degree", "indoor", "high_income", "machine_focused", "industry-technology"], description: "Protects systems from threats.", popularity: 65 },
      { name: "Teacher", sub: "education", tags: ["profession", "education", "degree", "indoor", "people_focused", "caregiving", "industry-education"], description: "Educates students in a school.", popularity: 92 },
      { name: "Professor", sub: "education", tags: ["profession", "education", "degree", "science", "indoor", "people_focused", "high_income", "industry-education"], description: "A university academic and lecturer.", popularity: 76 },
      { name: "Librarian", sub: "education", tags: ["profession", "education", "degree", "indoor", "people_focused", "quiet", "industry-education"], description: "Manages libraries and knowledge.", popularity: 62 },
      { name: "Actor", sub: "arts-media", tags: ["profession", "arts", "creative", "famous_possible", "people_focused", "indoor", "industry-arts"], description: "Performs roles in film, TV, or theatre.", popularity: 85 },
      { name: "Musician", sub: "arts-media", tags: ["profession", "arts", "creative", "famous_possible", "people_focused", "industry-arts"], description: "Creates and performs music.", popularity: 82 },
      { name: "Painter", sub: "arts-media", tags: ["profession", "arts", "creative", "indoor", "solo", "industry-arts"], description: "Creates visual art on canvas.", popularity: 60 },
      { name: "Chef", sub: "arts-media", tags: ["profession", "arts", "creative", "indoor", "physical", "food", "industry-hospitality"], description: "Cooks professionally in a kitchen.", popularity: 80 },
      { name: "Writer", sub: "arts-media", tags: ["profession", "arts", "creative", "indoor", "solo", "industry-arts"], description: "Authors books, articles, or scripts.", popularity: 70 },
      { name: "Photographer", sub: "arts-media", tags: ["profession", "arts", "creative", "outdoor", "indoor", "industry-arts"], description: "Captures photos professionally.", popularity: 68 },
      { name: "Electrician", sub: "trades", tags: ["profession", "trades", "physical", "dangerous", "machine_focused", "indoor", "outdoor"], description: "Installs and repairs electrical systems.", popularity: 65 },
      { name: "Plumber", sub: "trades", tags: ["profession", "trades", "physical", "indoor", "outdoor"], description: "Installs and repairs piping.", popularity: 63 },
      { name: "Carpenter", sub: "trades", tags: ["profession", "trades", "physical", "creative", "indoor", "outdoor", "tool"], description: "Works with wood to build structures.", popularity: 62 },
      { name: "Mechanic", sub: "trades", tags: ["profession", "trades", "physical", "machine_focused", "indoor"], description: "Repairs vehicles and engines.", popularity: 68 },
      { name: "Farmer", sub: "trades", tags: ["profession", "trades", "physical", "outdoor", "animal_care", "early_riser", "industry-agriculture"], description: "Cultivates crops and raises livestock.", popularity: 66 },
      { name: "Construction Worker", sub: "trades", tags: ["profession", "trades", "physical", "outdoor", "dangerous", "uniform", "industry-construction"], description: "Builds structures and infrastructure.", popularity: 64 },
      { name: "Lawyer", sub: "business-law", tags: ["profession", "law", "degree", "indoor", "high_income", "people_focused", "industry-legal"], description: "Practices law and represents clients.", popularity: 84 },
      { name: "Accountant", sub: "business-law", tags: ["profession", "finance", "degree", "indoor", "machine_focused", "industry-finance"], description: "Manages financial records and taxes.", popularity: 72 },
      { name: "Pilot", sub: "business-law", tags: ["profession", "transport", "degree", "high_income", "uniform", "machine_focused", "dangerous", "industry-transportation"], description: "Flies aircraft for a living.", popularity: 82 },
      { name: "Police Officer", sub: "business-law", tags: ["profession", "law", "uniform", "physical", "dangerous", "people_focused", "outdoor", "industry-government"], description: "Enforces the law and protects citizens.", popularity: 80 },
      { name: "Firefighter", sub: "business-law", tags: ["profession", "uniform", "physical", "dangerous", "people_focused", "outdoor", "industry-government"], description: "Extinguishes fires and rescues people.", popularity: 78 },
      { name: "Marketing Manager", sub: "business-law", tags: ["profession", "business", "degree", "indoor", "creative", "industry-business"], description: "Plans marketing strategies.", popularity: 65 },
      { name: "Financial Analyst", sub: "business-law", tags: ["profession", "finance", "degree", "indoor", "high_income", "machine_focused", "industry-finance"], description: "Analyzes financial data.", popularity: 62 },
    ],
  },
  {
    name: "Animals", slug: "animals", icon: "PawPrint", color: "#22c55e",
    description: "Think of any animal — mammal, bird, reptile, fish, or insect.",
    subs: [{ name: "Mammals", slug: "mammals" }, { name: "Birds", slug: "birds" }, { name: "Reptiles & Amphibians", slug: "reptiles" }, { name: "Fish & Sea Life", slug: "sea-life" }, { name: "Insects & Bugs", slug: "insects" }],
    entities: [
      { name: "Lion", sub: "mammals", tags: ["animal", "mammal", "carnivore", "wild", "large", "predator", "african_animal", "fast"], description: "The king of the jungle.", popularity: 92 },
      { name: "Tiger", sub: "mammals", tags: ["animal", "mammal", "carnivore", "wild", "large", "predator", "asian_animal", "fast"], description: "The largest cat species.", popularity: 90 },
      { name: "Elephant", sub: "mammals", tags: ["animal", "mammal", "herbivore", "wild", "large", "african_animal", "asian_animal", "smart"], description: "The largest land animal.", popularity: 88 },
      { name: "Dog", sub: "mammals", tags: ["animal", "mammal", "carnivore", "domestic", "pet", "loyal", "small", "pack"], description: "Man's best friend.", popularity: 96 },
      { name: "Cat", sub: "mammals", tags: ["animal", "mammal", "carnivore", "domestic", "pet", "small", "solo", "independent"], description: "A common house pet.", popularity: 95 },
      { name: "Horse", sub: "mammals", tags: ["animal", "mammal", "herbivore", "domestic", "large", "fast", "farm"], description: "A domesticated rideable animal.", popularity: 85 },
      { name: "Cow", sub: "mammals", tags: ["animal", "mammal", "herbivore", "domestic", "farm", "large"], description: "A farm animal raised for milk.", popularity: 80 },
      { name: "Wolf", sub: "mammals", tags: ["animal", "mammal", "carnivore", "wild", "predator", "pack", "forest_animal"], description: "The wild ancestor of dogs.", popularity: 82 },
      { name: "Bear", sub: "mammals", tags: ["animal", "mammal", "carnivore", "wild", "large", "predator", "forest_animal"], description: "A large powerful forest mammal.", popularity: 84 },
      { name: "Monkey", sub: "mammals", tags: ["animal", "mammal", "herbivore", "wild", "smart", "climbing", "tropical"], description: "An agile tree-dwelling primate.", popularity: 80 },
      { name: "Rabbit", sub: "mammals", tags: ["animal", "mammal", "herbivore", "domestic", "pet", "small", "fast"], description: "A fluffy hopping mammal.", popularity: 78 },
      { name: "Fox", sub: "mammals", tags: ["animal", "mammal", "carnivore", "wild", "small", "fast", "smart", "forest_animal"], description: "A clever small wild mammal.", popularity: 76 },
      { name: "Giraffe", sub: "mammals", tags: ["animal", "mammal", "herbivore", "wild", "large", "african_animal"], description: "The tallest land animal.", popularity: 84 },
      { name: "Gorilla", sub: "mammals", tags: ["animal", "mammal", "omnivore", "wild", "large", "smart", "african_animal"], description: "The largest primate.", popularity: 82 },
      { name: "Eagle", sub: "birds", tags: ["animal", "bird", "carnivore", "wild", "flying", "predator", "large", "fast"], description: "A powerful bird of prey.", popularity: 82 },
      { name: "Penguin", sub: "birds", tags: ["animal", "bird", "carnivore", "wild", "swimming", "cold", "flightless"], description: "A flightless bird of cold climates.", popularity: 85 },
      { name: "Owl", sub: "birds", tags: ["animal", "bird", "carnivore", "wild", "flying", "predator", "nocturnal"], description: "A nocturnal bird of prey.", popularity: 75 },
      { name: "Parrot", sub: "birds", tags: ["animal", "bird", "herbivore", "tropical", "flying", "colorful", "pet", "smart"], description: "A colorful tropical bird.", popularity: 72 },
      { name: "Duck", sub: "birds", tags: ["animal", "bird", "omnivore", "flying", "swimming", "farm", "small"], description: "A waterfowl that quacks.", popularity: 70 },
      { name: "Snake", sub: "reptiles", tags: ["animal", "reptile", "carnivore", "wild", "predator", "legless", "cold_blooded"], description: "A legless slithering reptile.", popularity: 78 },
      { name: "Turtle", sub: "reptiles", tags: ["animal", "reptile", "herbivore", "wild", "pet", "shell", "slow", "swimming", "cold_blooded", "long_lived"], description: "A reptile with a protective shell.", popularity: 74 },
      { name: "Crocodile", sub: "reptiles", tags: ["animal", "reptile", "carnivore", "wild", "predator", "large", "swimming", "cold_blooded"], description: "A large aquatic predatory reptile.", popularity: 76 },
      { name: "Frog", sub: "reptiles", tags: ["animal", "amphibian", "carnivore", "wild", "small", "jumping", "swimming", "cold_blooded"], description: "A hopping amphibian.", popularity: 70 },
      { name: "Shark", sub: "sea-life", tags: ["animal", "fish", "carnivore", "wild", "predator", "large", "swimming", "ocean"], description: "The apex predator of the seas.", popularity: 85 },
      { name: "Dolphin", sub: "sea-life", tags: ["animal", "mammal", "carnivore", "wild", "swimming", "ocean", "smart", "friendly", "fast"], description: "An intelligent marine mammal.", popularity: 84 },
      { name: "Whale", sub: "sea-life", tags: ["animal", "mammal", "wild", "swimming", "ocean", "large", "long_lived"], description: "The largest ocean mammal.", popularity: 82 },
      { name: "Goldfish", sub: "sea-life", tags: ["animal", "fish", "omnivore", "domestic", "pet", "small", "swimming"], description: "A common pet fish.", popularity: 68 },
      { name: "Octopus", sub: "sea-life", tags: ["animal", "cephalopod", "carnivore", "wild", "swimming", "ocean", "smart"], description: "An intelligent eight-armed sea creature.", popularity: 72 },
      { name: "Butterfly", sub: "insects", tags: ["animal", "insect", "herbivore", "wild", "flying", "small", "colorful"], description: "A colorful flying insect.", popularity: 72 },
      { name: "Bee", sub: "insects", tags: ["animal", "insect", "herbivore", "wild", "flying", "small", "stinging", "useful"], description: "A honey-making flying insect.", popularity: 70 },
      { name: "Ant", sub: "insects", tags: ["animal", "insect", "omnivore", "wild", "small", "industrious", "colony"], description: "A tiny social colony insect.", popularity: 65 },
      { name: "Spider", sub: "insects", tags: ["animal", "arachnid", "carnivore", "wild", "small", "web", "eight_legs"], description: "An eight-legged web-spinning arachnid.", popularity: 68 },
    ],
  },
  {
    name: "Countries", slug: "countries", icon: "Globe", color: "#06b6d4",
    description: "Think of any country in the world.",
    subs: [{ name: "Asia", slug: "asia" }, { name: "Europe", slug: "europe" }, { name: "Americas", slug: "americas" }, { name: "Africa", slug: "africa" }, { name: "Oceania", slug: "oceania" }],
    entities: [
      { name: "Japan", sub: "asia", tags: ["place", "country", "asian", "island", "developed", "populous", "tech_advanced", "mountainous"], description: "An island nation in East Asia.", popularity: 95 },
      { name: "China", sub: "asia", tags: ["place", "country", "asian", "large", "populous", "developing", "old_country"], description: "The world's most populous country.", popularity: 92 },
      { name: "India", sub: "asia", tags: ["place", "country", "asian", "large", "populous", "developing", "tropical", "ancient_place"], description: "A populous South Asian nation.", popularity: 90 },
      { name: "South Korea", sub: "asia", tags: ["place", "country", "asian", "developed", "tech_advanced", "small"], description: "A tech-forward East Asian nation.", popularity: 85 },
      { name: "Thailand", sub: "asia", tags: ["place", "country", "asian", "tropical", "developing", "beaches"], description: "A Southeast Asian kingdom.", popularity: 78 },
      { name: "Indonesia", sub: "asia", tags: ["place", "country", "asian", "island", "tropical", "large", "populous", "developing"], description: "The world's largest archipelago.", popularity: 76 },
      { name: "United Kingdom", sub: "europe", tags: ["place", "country", "european", "island", "developed", "royal", "old_country", "english_speaking"], description: "A nation of four countries in NW Europe.", popularity: 93 },
      { name: "France", sub: "europe", tags: ["place", "country", "european", "developed", "romantic", "old_country", "wine"], description: "A Western European nation.", popularity: 92 },
      { name: "Germany", sub: "europe", tags: ["place", "country", "european", "developed", "old_country", "cars"], description: "A central European economic powerhouse.", popularity: 90 },
      { name: "Italy", sub: "europe", tags: ["place", "country", "european", "developed", "romantic", "old_country", "mediterranean"], description: "A Mediterranean European nation.", popularity: 90 },
      { name: "Spain", sub: "europe", tags: ["place", "country", "european", "developed", "mediterranean", "sunny", "old_country"], description: "A sunny southwestern European nation.", popularity: 85 },
      { name: "Russia", sub: "europe", tags: ["place", "country", "european", "asian", "large", "cold", "old_country"], description: "The largest country, spanning two continents.", popularity: 88 },
      { name: "Netherlands", sub: "europe", tags: ["place", "country", "european", "developed", "small", "flat"], description: "A low-lying Northwestern European nation.", popularity: 78 },
      { name: "Sweden", sub: "europe", tags: ["place", "country", "european", "developed", "cold", "small", "tech_advanced"], description: "A Scandinavian Nordic nation.", popularity: 78 },
      { name: "United States", sub: "americas", tags: ["place", "country", "american", "large", "developed", "populous", "diverse", "powerful", "english_speaking"], description: "A large federal republic in North America.", popularity: 97 },
      { name: "Canada", sub: "americas", tags: ["place", "country", "american", "large", "developed", "cold", "english_speaking"], description: "A large northern North American nation.", popularity: 88 },
      { name: "Brazil", sub: "americas", tags: ["place", "country", "american", "large", "developing", "tropical", "soccer", "rainforest"], description: "The largest South American nation.", popularity: 86 },
      { name: "Mexico", sub: "americas", tags: ["place", "country", "american", "developing", "sunny", "spicy_food"], description: "A North American nation south of the US.", popularity: 84 },
      { name: "Argentina", sub: "americas", tags: ["place", "country", "american", "developing", "soccer", "large"], description: "A large South American nation.", popularity: 78 },
      { name: "Egypt", sub: "africa", tags: ["place", "country", "african", "developing", "desert", "ancient_place", "hot"], description: "A North African nation of ancient wonders.", popularity: 85 },
      { name: "South Africa", sub: "africa", tags: ["place", "country", "african", "developing", "diverse", "sunny"], description: "The southernmost African nation.", popularity: 78 },
      { name: "Nigeria", sub: "africa", tags: ["place", "country", "african", "populous", "developing", "tropical"], description: "The most populous African nation.", popularity: 72 },
      { name: "Kenya", sub: "africa", tags: ["place", "country", "african", "developing", "safari", "sunny"], description: "An East African nation known for safaris.", popularity: 70 },
      { name: "Morocco", sub: "africa", tags: ["place", "country", "african", "developing", "desert", "hot", "mediterranean"], description: "A North African kingdom.", popularity: 72 },
      { name: "Australia", sub: "oceania", tags: ["place", "country", "oceanian", "island", "large", "developed", "desert", "english_speaking", "southern_hemisphere"], description: "A continent-country in the Southern Hemisphere.", popularity: 90 },
      { name: "New Zealand", sub: "oceania", tags: ["place", "country", "oceanian", "island", "developed", "scenic", "southern_hemisphere", "small"], description: "A scenic island nation in the Pacific.", popularity: 80 },
    ],
  },
  {
    name: "Sports", slug: "sports", icon: "Trophy", color: "#ef4444",
    description: "Think of any sport — team, individual, ball, or racing.",
    subs: [{ name: "Team Sports", slug: "team" }, { name: "Individual Sports", slug: "individual" }, { name: "Water & Winter", slug: "water-winter" }, { name: "Combat & Racing", slug: "combat" }],
    entities: [
      { name: "Soccer", sub: "team", tags: ["sport", "team_sport", "ball_sport", "outdoor_sport", "olympic", "global_sport", "popular_sport", "foot"], description: "The world's most popular sport.", popularity: 96 },
      { name: "Basketball", sub: "team", tags: ["sport", "team_sport", "ball_sport", "indoor_sport", "olympic", "popular_sport", "tall", "american"], description: "A team sport of hoops.", popularity: 92 },
      { name: "American Football", sub: "team", tags: ["sport", "team_sport", "ball_sport", "outdoor_sport", "contact", "american", "popular_sport", "helmet"], description: "The NFL contact sport.", popularity: 90 },
      { name: "Baseball", sub: "team", tags: ["sport", "team_sport", "ball_sport", "outdoor_sport", "american", "bat", "popular_sport"], description: "America's pastime.", popularity: 85 },
      { name: "Cricket", sub: "team", tags: ["sport", "team_sport", "ball_sport", "outdoor_sport", "bat", "popular_sport", "long_game", "commonwealth"], description: "A bat-and-ball sport loved by millions.", popularity: 88 },
      { name: "Volleyball", sub: "team", tags: ["sport", "team_sport", "ball_sport", "outdoor_sport", "indoor_sport", "olympic", "net"], description: "A net sport of sets and spikes.", popularity: 80 },
      { name: "Rugby", sub: "team", tags: ["sport", "team_sport", "ball_sport", "outdoor_sport", "contact", "tough"], description: "A tough contact team sport.", popularity: 78 },
      { name: "Tennis", sub: "individual", tags: ["sport", "individual_sport", "ball_sport", "outdoor_sport", "olympic", "racket", "popular_sport", "net"], description: "A racket sport of aces.", popularity: 88 },
      { name: "Golf", sub: "individual", tags: ["sport", "individual_sport", "ball_sport", "outdoor_sport", "club", "precision", "slow", "expensive"], description: "A precision club sport.", popularity: 82 },
      { name: "Athletics", sub: "individual", tags: ["sport", "individual_sport", "outdoor_sport", "olympic", "running", "jumping", "throwing"], description: "Track and field events.", popularity: 80 },
      { name: "Cycling", sub: "individual", tags: ["sport", "individual_sport", "outdoor_sport", "olympic", "bike", "endurance"], description: "Racing on bicycles.", popularity: 78 },
      { name: "Swimming", sub: "water-winter", tags: ["sport", "individual_sport", "water_sport", "indoor_sport", "olympic", "endurance", "pool"], description: "Racing in water.", popularity: 82 },
      { name: "Surfing", sub: "water-winter", tags: ["sport", "individual_sport", "water_sport", "outdoor_sport", "olympic", "waves", "board", "beach"], description: "Riding ocean waves.", popularity: 75 },
      { name: "Skiing", sub: "water-winter", tags: ["sport", "individual_sport", "winter_sport", "outdoor_sport", "olympic", "snow", "mountain", "fast"], description: "Gliding on snow.", popularity: 78 },
      { name: "Ice Hockey", sub: "water-winter", tags: ["sport", "team_sport", "winter_sport", "indoor_sport", "olympic", "ice", "contact", "fast"], description: "Fast team sport on ice.", popularity: 82 },
      { name: "Snowboarding", sub: "water-winter", tags: ["sport", "individual_sport", "winter_sport", "outdoor_sport", "olympic", "snow", "board"], description: "Riding a board on snow.", popularity: 72 },
      { name: "Boxing", sub: "combat", tags: ["sport", "individual_sport", "combat_sport", "contact", "olympic", "gloves", "fighting", "ring"], description: "The sweet science of fist-fighting.", popularity: 84 },
      { name: "MMA", sub: "combat", tags: ["sport", "individual_sport", "combat_sport", "contact", "mixed", "fighting", "cage", "tough"], description: "Mixed martial arts combat.", popularity: 85 },
      { name: "Formula 1", sub: "combat", tags: ["sport", "individual_sport", "racing", "motorsport", "outdoor_sport", "fast", "cars", "expensive"], description: "The pinnacle of motorsport.", popularity: 86 },
      { name: "Gymnastics", sub: "individual", tags: ["sport", "individual_sport", "indoor_sport", "olympic", "acrobatic", "flexibility"], description: "An acrobatic sport.", popularity: 76 },
      { name: "Badminton", sub: "individual", tags: ["sport", "individual_sport", "team_sport", "ball_sport", "indoor_sport", "olympic", "racket", "net", "fast"], description: "A shuttlecock racket sport.", popularity: 74 },
    ],
  },
  {
    name: "Age", slug: "age", icon: "Cake", color: "#a855f7",
    description: "Think of your own age — answer questions and the AI will guess it.",
    subs: [],
    entities: [],
  },
];

const QUESTIONS: QuestionSeed[] = [
  { text: "Is it a job or profession?", tag: "profession" },
  { text: "Is it an animal?", tag: "animal" },
  { text: "Is it a country or place?", tag: "place" },
  { text: "Is it a sport?", tag: "sport" },
  { text: "Does the job require a university degree?", tag: "degree", category: "jobs" },
  { text: "Is it a healthcare job?", tag: "healthcare", category: "jobs" },
  { text: "Is it a technology job?", tag: "technology", category: "jobs" },
  { text: "Is it in education?", tag: "education", category: "jobs" },
  { text: "Is it a creative or arts job?", tag: "arts", category: "jobs" },
  { text: "Is it a trade (manual labor)?", tag: "trades", category: "jobs" },
  { text: "Is it a well-paid job?", tag: "high_income", category: "jobs" },
  { text: "Does the job involve working with people?", tag: "people_focused", category: "jobs" },
  { text: "Does the job involve working with machines or computers?", tag: "machine_focused", category: "jobs" },
  { text: "Does the job involve science?", tag: "science", category: "jobs" },
  { text: "Is the job mostly indoors?", tag: "indoor", category: "jobs" },
  { text: "Is the job mostly outdoors?", tag: "outdoor", category: "jobs" },
  { text: "Does the job involve a uniform?", tag: "uniform", category: "jobs" },
  { text: "Is the job physically demanding?", tag: "physical", category: "jobs" },
  { text: "Is the job dangerous?", tag: "dangerous", category: "jobs" },
  { text: "Is it a law-related job?", tag: "law", category: "jobs" },
  { text: "Is it in finance?", tag: "finance", category: "jobs" },
  { text: "Is it in transportation?", tag: "transport", category: "jobs" },
  { text: "Is it in healthcare?", tag: "industry-healthcare", category: "jobs" },
  { text: "Is it a tech industry job?", tag: "industry-technology", category: "jobs" },
  { text: "Is it in agriculture or farming?", tag: "industry-agriculture", category: "jobs" },
  { text: "Is it in construction?", tag: "industry-construction", category: "jobs" },
  { text: "Is it a legal profession?", tag: "industry-legal", category: "jobs" },
  { text: "Is it in arts or entertainment?", tag: "industry-arts", category: "jobs" },
  { text: "Is it in the hospitality industry?", tag: "industry-hospitality", category: "jobs" },
  { text: "Is it a government or public service job?", tag: "industry-government", category: "jobs" },
  { text: "Is it a finance industry job?", tag: "industry-finance", category: "jobs" },
  { text: "Is it a transportation job?", tag: "industry-transportation", category: "jobs" },
  { text: "Is it a business job?", tag: "industry-business", category: "jobs" },
  { text: "Is it a mammal?", tag: "mammal", category: "animals" },
  { text: "Is it a bird?", tag: "bird", category: "animals" },
  { text: "Is it a reptile or amphibian?", tag: "reptile", category: "animals" },
  { text: "Is it a fish or sea creature?", tag: "fish", category: "animals" },
  { text: "Is it an insect or bug?", tag: "insect", category: "animals" },
  { text: "Is it a carnivore (meat-eater)?", tag: "carnivore", category: "animals" },
  { text: "Is it a herbivore (plant-eater)?", tag: "herbivore", category: "animals" },
  { text: "Is it a wild animal?", tag: "wild", category: "animals" },
  { text: "Is it a domestic or pet animal?", tag: "domestic", category: "animals" },
  { text: "Can it fly?", tag: "flying", category: "animals" },
  { text: "Can it swim?", tag: "swimming", category: "animals" },
  { text: "Is it a large animal?", tag: "large", category: "animals" },
  { text: "Is it a small animal?", tag: "small", category: "animals" },
  { text: "Is it a predator?", tag: "predator", category: "animals" },
  { text: "Is it considered smart or intelligent?", tag: "smart", category: "animals" },
  { text: "Is it from Africa?", tag: "african_animal", category: "animals" },
  { text: "Is it from Asia?", tag: "asian_animal", category: "animals" },
  { text: "Is it found in the ocean?", tag: "ocean", category: "animals" },
  { text: "Does it live in forests or jungles?", tag: "forest_animal", category: "animals" },
  { text: "Is it nocturnal?", tag: "nocturnal", category: "animals" },
  { text: "Is it in Asia?", tag: "asian", category: "countries" },
  { text: "Is it in Europe?", tag: "european", category: "countries" },
  { text: "Is it in the Americas?", tag: "american", category: "countries" },
  { text: "Is it in Africa?", tag: "african", category: "countries" },
  { text: "Is it an island nation?", tag: "island", category: "countries" },
  { text: "Is it a large country?", tag: "large", category: "countries" },
  { text: "Is it a populous country?", tag: "populous", category: "countries" },
  { text: "Is it a developed country?", tag: "developed", category: "countries" },
  { text: "Is it a tropical country?", tag: "tropical", category: "countries" },
  { text: "Is it a cold country?", tag: "cold", category: "countries" },
  { text: "Is it an ancient civilization?", tag: "ancient_place", category: "countries" },
  { text: "Is it English-speaking?", tag: "english_speaking", category: "countries" },
  { text: "Is it known for technology?", tag: "tech_advanced", category: "countries" },
  { text: "Is it in the Southern Hemisphere?", tag: "southern_hemisphere", category: "countries" },
  { text: "Is it a small country?", tag: "small", category: "countries" },
  { text: "Is it a team sport?", tag: "team_sport", category: "sports" },
  { text: "Is it an individual sport?", tag: "individual_sport", category: "sports" },
  { text: "Is it a ball sport?", tag: "ball_sport", category: "sports" },
  { text: "Is it an Olympic sport?", tag: "olympic", category: "sports" },
  { text: "Is it a water sport?", tag: "water_sport", category: "sports" },
  { text: "Is it a winter sport?", tag: "winter_sport", category: "sports" },
  { text: "Is it a contact or combat sport?", tag: "contact", category: "sports" },
  { text: "Is it played indoors?", tag: "indoor_sport", category: "sports" },
  { text: "Is it played outdoors?", tag: "outdoor_sport", category: "sports" },
  { text: "Is it a motorsport?", tag: "motorsport", category: "sports" },
  { text: "Is it a globally popular sport?", tag: "popular_sport", category: "sports" },
  { text: "Does it use a racket?", tag: "racket", category: "sports" },
  { text: "Does it involve racing?", tag: "racing", category: "sports" },
  { text: "Does it involve snow or ice?", tag: "snow", category: "sports" },
];

const DEFAULT_SETTINGS = [
  { key: "weightYes", value: "15", type: "number", group: "game", label: "Yes weight" },
  { key: "weightProbably", value: "8", type: "number", group: "game", label: "Probably weight" },
  { key: "weightDontKnow", value: "0", type: "number", group: "game", label: "Don't know weight" },
  { key: "weightProbablyNot", value: "8", type: "number", group: "game", label: "Probably not weight" },
  { key: "weightNo", value: "15", type: "number", group: "game", label: "No weight" },
  { key: "initialScore", value: "100", type: "number", group: "game", label: "Initial score" },
  { key: "minQuestions", value: "8", type: "number", group: "game", label: "Min questions before guess" },
  { key: "maxQuestions", value: "28", type: "number", group: "game", label: "Max questions" },
  { key: "confidenceThreshold", value: "1.45", type: "number", group: "game", label: "Confidence threshold" },
  { key: "scoreGapThreshold", value: "55", type: "number", group: "game", label: "Score gap threshold" },
  { key: "candidatePoolSize", value: "200", type: "number", group: "game", label: "Candidate pool size" },
  { key: "maxGuesses", value: "3", type: "number", group: "game", label: "Max wrong guesses before giving up" },
  { key: "siteName", value: "GUESS MY ANYTHING", type: "string", group: "site", label: "Site name" },
];

async function seed() {
  console.log("Seeding GUESS MY ANYTHING (Drizzle)...");
  const { eq } = await import("drizzle-orm");

  const existingCats = await db.select({ id: categories.id }).from(categories).limit(1);
  if (existingCats.length > 0) { console.log("Already seeded, skipping."); return; }

  const tagMap = new Map<string, string>();

  async function ensureTag(name: string): Promise<string> {
    const slug = slugify(name);
    if (tagMap.has(slug)) return tagMap.get(slug)!;
    const existing = await db.select({ id: tags.id }).from(tags).where(eq(tags.slug, slug)).limit(1);
    if (existing[0]) { tagMap.set(slug, existing[0].id); return existing[0].id; }
    const rows = await db.insert(tags).values({ name, slug }).returning({ id: tags.id });
    tagMap.set(slug, rows[0].id);
    return rows[0].id;
  }

  let catOrder = 0;
  for (const cat of CATEGORIES) {
    const catRows = await db.insert(categories).values({ name: cat.name, slug: cat.slug, description: cat.description, icon: cat.icon, color: cat.color, sortOrder: catOrder++ }).returning({ id: categories.id });
    const catId = catRows[0].id;
    const subMap = new Map<string, string>();
    let subOrder = 0;
    for (const sub of cat.subs) {
      const subRows = await db.insert(subcategories).values({ name: sub.name, slug: sub.slug, categoryId: catId, sortOrder: subOrder++ }).returning({ id: subcategories.id });
      subMap.set(sub.slug, subRows[0].id);
    }
    for (const e of cat.entities) {
      const tagIds: string[] = [];
      const tagSlugs: string[] = [];
      for (const t of e.tags) {
        const tid = await ensureTag(t);
        tagIds.push(tid);
        tagSlugs.push(slugify(t));
      }
      const eRows = await db.insert(entities).values({
        name: e.name, slug: slugify(e.name), description: e.description ?? null, categoryId: catId,
        subcategoryId: e.sub ? (subMap.get(e.sub) ?? null) : null,
        difficulty: e.difficulty ?? 1.0, popularity: e.popularity ?? 50, tagCache: tagSlugs.join(","),
      }).returning({ id: entities.id });
      const eid = eRows[0].id;
      for (const tid of tagIds) {
        await db.insert(entityTags).values({ entityId: eid, tagId: tid, weight: 1.0 }).onConflictDoNothing();
      }
    }
    console.log(`  ${cat.name}: ${cat.entities.length} entities`);
  }

  let qCount = 0;
  for (const q of QUESTIONS) {
    const tagId = await ensureTag(q.tag);
    let catId: string | null = null;
    if (q.category) {
      const cRows = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, q.category)).limit(1);
      catId = cRows[0]?.id ?? null;
    }
    await db.insert(questions).values({ text: q.text, primaryTagId: tagId, categoryId: catId, inverted: q.inverted ?? false, sortOrder: qCount });
    qCount++;
  }
  console.log(`  ${qCount} questions created.`);

  for (const s of DEFAULT_SETTINGS) {
    await db.insert(settings).values(s).onConflictDoNothing();
  }
  console.log(`  ${DEFAULT_SETTINGS.length} settings created.`);
  console.log("Seed complete!");
}

seed().catch((e) => { console.error(e); process.exit(1); }).finally(() => pool.end());
