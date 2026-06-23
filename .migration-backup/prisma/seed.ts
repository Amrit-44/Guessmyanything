/**
 * GUESS MY ANYTHING — Seed knowledge base
 *
 * A curated, internally-consistent dataset across 13 categories.
 * Tags are shared vocabulary so questions can probe membership.
 *
 * Run: bun run prisma/seed.ts
 */

import { db } from "../src/lib/db";

type EntitySeed = {
  name: string;
  sub?: string;
  tags: string[];
  description?: string;
  difficulty?: number;
  popularity?: number;
};

type CategorySeed = {
  name: string;
  slug: string;
  icon: string;
  color: string;
  description: string;
  subs: { name: string; slug: string }[];
  entities: EntitySeed[];
};

type QuestionSeed = {
  text: string;
  tag: string;
  inverted?: boolean;
  category?: string;
};

// ------------------------------------------------------------
// KNOWLEDGE BASE
// ------------------------------------------------------------

const CATEGORIES: CategorySeed[] = [
  {
    name: "Jobs & Professions",
    slug: "jobs",
    icon: "Briefcase",
    color: "#f59e0b",
    description: "Think of any job or profession — doctor, pilot, chef, and more.",
    subs: [
      { name: "Healthcare", slug: "healthcare" },
      { name: "Technology", slug: "technology" },
      { name: "Education", slug: "education" },
      { name: "Arts & Media", slug: "arts-media" },
      { name: "Trades & Labor", slug: "trades" },
      { name: "Business & Law", slug: "business-law" },
    ],
    entities: [
      { name: "Doctor", sub: "healthcare", tags: ["profession", "healthcare", "degree", "science", "indoor", "high_income", "people_focused", "uniform"], description: "A medical professional who diagnoses and treats patients.", popularity: 95 },
      { name: "Nurse", sub: "healthcare", tags: ["profession", "healthcare", "degree", "indoor", "people_focused", "uniform", "caregiving"], description: "A healthcare worker who cares for patients.", popularity: 88 },
      { name: "Surgeon", sub: "healthcare", tags: ["profession", "healthcare", "degree", "science", "indoor", "high_income", "people_focused", "precise"], description: "A doctor who performs operations.", popularity: 80 },
      { name: "Dentist", sub: "healthcare", tags: ["profession", "healthcare", "degree", "science", "indoor", "high_income", "people_focused"], description: "A doctor specializing in teeth.", popularity: 72 },
      { name: "Veterinarian", sub: "healthcare", tags: ["profession", "healthcare", "degree", "science", "animal_care", "people_focused"], description: "A doctor for animals.", popularity: 70 },
      { name: "Software Engineer", sub: "technology", tags: ["profession", "technology", "degree", "indoor", "high_income", "machine_focused", "creative"], description: "Builds software and applications.", popularity: 90 },
      { name: "Data Scientist", sub: "technology", tags: ["profession", "technology", "degree", "science", "indoor", "high_income", "machine_focused"], description: "Analyzes data to find insights.", popularity: 75 },
      { name: "Web Developer", sub: "technology", tags: ["profession", "technology", "degree", "indoor", "high_income", "machine_focused", "creative"], description: "Builds websites and web apps.", popularity: 78 },
      { name: "Teacher", sub: "education", tags: ["profession", "education", "degree", "indoor", "people_focused", "caregiving"], description: "Educates students in a school.", popularity: 92 },
      { name: "Professor", sub: "education", tags: ["profession", "education", "degree", "science", "indoor", "people_focused", "high_income"], description: "A university academic and lecturer.", popularity: 76 },
      { name: "Actor", sub: "arts-media", tags: ["profession", "arts", "creative", "famous_possible", "people_focused", "indoor"], description: "Performs roles in film, TV, or theatre.", popularity: 85 },
      { name: "Musician", sub: "arts-media", tags: ["profession", "arts", "creative", "famous_possible", "people_focused"], description: "Creates and performs music.", popularity: 82 },
      { name: "Painter", sub: "arts-media", tags: ["profession", "arts", "creative", "indoor", "solo"], description: "Creates visual art on canvas.", popularity: 60 },
      { name: "Chef", sub: "arts-media", tags: ["profession", "arts", "creative", "indoor", "physical", "food"], description: "Cooks professionally in a kitchen.", popularity: 80 },
      { name: "Writer", sub: "arts-media", tags: ["profession", "arts", "creative", "indoor", "solo"], description: "Authors books, articles, or scripts.", popularity: 70 },
      { name: "Electrician", sub: "trades", tags: ["profession", "trades", "physical", "dangerous", "machine_focused", "indoor", "outdoor"], description: "Installs and repairs electrical systems.", popularity: 65 },
      { name: "Plumber", sub: "trades", tags: ["profession", "trades", "physical", "indoor", "outdoor"], description: "Installs and repairs piping.", popularity: 63 },
      { name: "Carpenter", sub: "trades", tags: ["profession", "trades", "physical", "creative", "indoor", "outdoor", "tool"], description: "Works with wood to build structures.", popularity: 62 },
      { name: "Mechanic", sub: "trades", tags: ["profession", "trades", "physical", "machine_focused", "indoor"], description: "Repairs vehicles and engines.", popularity: 68 },
      { name: "Farmer", sub: "trades", tags: ["profession", "trades", "physical", "outdoor", "animal_care", "early_riser"], description: "Cultivates crops and raises livestock.", popularity: 66 },
      { name: "Lawyer", sub: "business-law", tags: ["profession", "law", "degree", "indoor", "high_income", "people_focused"], description: "Practices law and represents clients.", popularity: 84 },
      { name: "Accountant", sub: "business-law", tags: ["profession", "finance", "degree", "indoor", "machine_focused"], description: "Manages financial records and taxes.", popularity: 72 },
      { name: "Pilot", sub: "business-law", tags: ["profession", "transport", "degree", "high_income", "uniform", "machine_focused", "dangerous"], description: "Flies aircraft for a living.", popularity: 82 },
      { name: "Police Officer", sub: "business-law", tags: ["profession", "law", "uniform", "physical", "dangerous", "people_focused", "outdoor"], description: "Enforces the law and protects citizens.", popularity: 80 },
      { name: "Firefighter", sub: "business-law", tags: ["profession", "uniform", "physical", "dangerous", "people_focused", "outdoor"], description: "Extinguishes fires and rescues people.", popularity: 78 },
    ],
  },
  {
    name: "Characters",
    slug: "characters",
    icon: "Drama",
    color: "#ec4899",
    description: "Think of any fictional character from anime, comics, cartoons, or books.",
    subs: [
      { name: "Anime & Manga", slug: "anime" },
      { name: "Comics & Superheroes", slug: "comics" },
      { name: "Cartoons", slug: "cartoons" },
      { name: "Books & Literature", slug: "books" },
      { name: "Video Game Characters", slug: "game-chars" },
    ],
    entities: [
      { name: "Monkey D. Luffy", sub: "anime", tags: ["fictional_character", "anime", "pirate", "male", "powers", "hero", "leader", "rubber"], description: "The rubber-bodied captain of the Straw Hat Pirates.", popularity: 88 },
      { name: "Naruto Uzumaki", sub: "anime", tags: ["fictional_character", "anime", "ninja", "male", "powers", "hero", "leader", "blonde"], description: "A ninja who dreams of becoming Hokage.", popularity: 90 },
      { name: "Goku", sub: "anime", tags: ["fictional_character", "anime", "fighter", "male", "powers", "hero", "alien", "martial_arts"], description: "The Saiyan warrior from Dragon Ball.", popularity: 92 },
      { name: "Pikachu", sub: "anime", tags: ["fictional_character", "anime", "animal_like", "powers", "small", "yellow", "cute", "electric"], description: "The electric mouse Pokémon.", popularity: 95 },
      { name: "Light Yagami", sub: "anime", tags: ["fictional_character", "anime", "male", "villain", "smart", "student", "dark"], description: "The protagonist of Death Note.", popularity: 70 },
      { name: "Superman", sub: "comics", tags: ["fictional_character", "comics", "superhero", "male", "powers", "hero", "flying", "strong", "alien", "american_comic"], description: "The Man of Steel from DC Comics.", popularity: 95 },
      { name: "Batman", sub: "comics", tags: ["fictional_character", "comics", "superhero", "male", "hero", "rich", "dark", "gadget", "american_comic", "human"], description: "The Dark Knight of Gotham.", popularity: 96 },
      { name: "Spider-Man", sub: "comics", tags: ["fictional_character", "comics", "superhero", "male", "hero", "powers", "flying", "young", "american_comic"], description: "The web-slinging hero of Marvel.", popularity: 94 },
      { name: "Wonder Woman", sub: "comics", tags: ["fictional_character", "comics", "superhero", "female", "hero", "powers", "warrior", "royal", "american_comic"], description: "The Amazonian princess and warrior.", popularity: 88 },
      { name: "The Joker", sub: "comics", tags: ["fictional_character", "comics", "villain", "male", "dark", "smart", "american_comic", "human"], description: "Batman's chaotic nemesis.", popularity: 90 },
      { name: "Mickey Mouse", sub: "cartoons", tags: ["fictional_character", "cartoon", "animal_like", "male", "hero", "cute", "old_character", "disney", "mouse"], description: "Disney's iconic mascot mouse.", popularity: 93 },
      { name: "SpongeBob SquarePants", sub: "cartoons", tags: ["fictional_character", "cartoon", "male", "hero", "cute", "funny", "underwater", "yellow"], description: "The optimistic sea sponge of Bikini Bottom.", popularity: 89 },
      { name: "Homer Simpson", sub: "cartoons", tags: ["fictional_character", "cartoon", "male", "funny", "american", "father", "yellow"], description: "The bumbling patriarch of The Simpsons.", popularity: 85 },
      { name: "Shrek", sub: "cartoons", tags: ["fictional_character", "cartoon", "male", "hero", "ogre", "green", "funny", "movie_character"], description: "The grumpy green ogre.", popularity: 82 },
      { name: "Harry Potter", sub: "books", tags: ["fictional_character", "book_character", "male", "hero", "magic", "young", "glasses", "british", "wizard"], description: "The boy wizard of Hogwarts.", popularity: 95 },
      { name: "Sherlock Holmes", sub: "books", tags: ["fictional_character", "book_character", "male", "hero", "smart", "british", "detective", "old_character"], description: "The brilliant detective of Baker Street.", popularity: 90 },
      { name: "Frodo Baggins", sub: "books", tags: ["fictional_character", "book_character", "male", "hero", "magic", "small", "hobbit", "ring"], description: "The hobbit who carried the One Ring.", popularity: 80 },
      { name: "Hermione Granger", sub: "books", tags: ["fictional_character", "book_character", "female", "hero", "magic", "smart", "young", "british", "wizard"], description: "The brilliant witch and Harry's friend.", popularity: 88 },
      { name: "Mario", sub: "game-chars", tags: ["fictional_character", "video_game_character", "male", "hero", "plumber", "italian", "cute", "nintendo", "jumping"], description: "Nintendo's mustachioed plumber hero.", popularity: 97 },
      { name: "Link", sub: "game-chars", tags: ["fictional_character", "video_game_character", "male", "hero", "sword", "magic", "elf_like", "nintendo", "silent"], description: "The hero of Hyrule in The Legend of Zelda.", popularity: 85 },
      { name: "Lara Croft", sub: "game-chars", tags: ["fictional_character", "video_game_character", "female", "hero", "gun", "rich", "smart", "explorer", "british"], description: "The tomb-raiding archaeologist.", popularity: 78 },
    ],
  },
  {
    name: "Animals",
    slug: "animals",
    icon: "PawPrint",
    color: "#22c55e",
    description: "Think of any animal — mammal, bird, reptile, fish, or insect.",
    subs: [
      { name: "Mammals", slug: "mammals" },
      { name: "Birds", slug: "birds" },
      { name: "Reptiles & Amphibians", slug: "reptiles" },
      { name: "Fish & Sea Life", slug: "sea-life" },
      { name: "Insects & Bugs", slug: "insects" },
    ],
    entities: [
      { name: "Lion", sub: "mammals", tags: ["animal", "mammal", "carnivore", "wild", "large", "predator", "african_animal", "mane", "fast"], description: "The king of the jungle.", popularity: 92 },
      { name: "Tiger", sub: "mammals", tags: ["animal", "mammal", "carnivore", "wild", "large", "predator", "asian_animal", "striped", "fast"], description: "The largest cat species, striped and fierce.", popularity: 90 },
      { name: "Elephant", sub: "mammals", tags: ["animal", "mammal", "herbivore", "wild", "large", "african_animal", "asian_animal", "trunk", "slow", "smart"], description: "The largest land animal.", popularity: 88 },
      { name: "Dog", sub: "mammals", tags: ["animal", "mammal", "carnivore", "domestic", "pet", "loyal", "small", "medium", "pack"], description: "Man's best friend.", popularity: 96 },
      { name: "Cat", sub: "mammals", tags: ["animal", "mammal", "carnivore", "domestic", "pet", "small", "solo", "independent"], description: "A common house pet and skilled hunter.", popularity: 95 },
      { name: "Horse", sub: "mammals", tags: ["animal", "mammal", "herbivore", "domestic", "large", "fast", "farm", "riding"], description: "A domesticated rideable animal.", popularity: 85 },
      { name: "Cow", sub: "mammals", tags: ["animal", "mammal", "herbivore", "domestic", "farm", "large", "slow", "milk"], description: "A farm animal raised for milk and meat.", popularity: 80 },
      { name: "Wolf", sub: "mammals", tags: ["animal", "mammal", "carnivore", "wild", "predator", "pack", "howling", "forest_animal"], description: "The wild ancestor of dogs.", popularity: 82 },
      { name: "Bear", sub: "mammals", tags: ["animal", "mammal", "carnivore", "wild", "large", "predator", "forest_animal", "hibernates"], description: "A large powerful forest mammal.", popularity: 84 },
      { name: "Monkey", sub: "mammals", tags: ["animal", "mammal", "herbivore", "wild", "smart", "climbing", "tropical", "tail"], description: "An agile tree-dwelling primate.", popularity: 80 },
      { name: "Eagle", sub: "birds", tags: ["animal", "bird", "carnivore", "wild", "flying", "predator", "large", "fast", "keen_sight"], description: "A powerful bird of prey.", popularity: 82 },
      { name: "Penguin", sub: "birds", tags: ["animal", "bird", "carnivore", "wild", "swimming", "cold", "flightless", "black_white", "antarctic"], description: "A flightless bird of cold climates.", popularity: 85 },
      { name: "Owl", sub: "birds", tags: ["animal", "bird", "carnivore", "wild", "flying", "predator", "nocturnal", "wise"], description: "A nocturnal bird of prey.", popularity: 75 },
      { name: "Parrot", sub: "birds", tags: ["animal", "bird", "herbivore", "tropical", "flying", "colorful", "pet", "talking", "smart"], description: "A colorful tropical bird that can mimic speech.", popularity: 72 },
      { name: "Duck", sub: "birds", tags: ["animal", "bird", "omnivore", "flying", "swimming", "farm", "small", "yellow"], description: "A waterfowl that quacks.", popularity: 70 },
      { name: "Snake", sub: "reptiles", tags: ["animal", "reptile", "carnivore", "wild", "predator", "legless", "venomous_possible", "cold_blooded"], description: "A legless slithering reptile.", popularity: 78 },
      { name: "Turtle", sub: "reptiles", tags: ["animal", "reptile", "herbivore", "wild", "pet", "shell", "slow", "swimming", "cold_blooded", "long_lived"], description: "A reptile with a protective shell.", popularity: 74 },
      { name: "Crocodile", sub: "reptiles", tags: ["animal", "reptile", "carnivore", "wild", "predator", "large", "swimming", "cold_blooded", "ancient_animal"], description: "A large aquatic predatory reptile.", popularity: 76 },
      { name: "Frog", sub: "reptiles", tags: ["animal", "amphibian", "carnivore", "wild", "small", "jumping", "swimming", "green", "cold_blooded"], description: "A hopping amphibian.", popularity: 70 },
      { name: "Shark", sub: "sea-life", tags: ["animal", "fish", "carnivore", "wild", "predator", "large", "swimming", "ocean", "apex", "teeth"], description: "The apex predator of the seas.", popularity: 85 },
      { name: "Dolphin", sub: "sea-life", tags: ["animal", "mammal", "carnivore", "wild", "swimming", "ocean", "smart", "friendly", "fast"], description: "An intelligent marine mammal.", popularity: 84 },
      { name: "Whale", sub: "sea-life", tags: ["animal", "mammal", "wild", "swimming", "ocean", "large", "singing", "long_lived"], description: "The largest ocean mammal.", popularity: 82 },
      { name: "Goldfish", sub: "sea-life", tags: ["animal", "fish", "omnivore", "domestic", "pet", "small", "swimming", "orange", "freshwater"], description: "A common pet fish.", popularity: 68 },
      { name: "Octopus", sub: "sea-life", tags: ["animal", "cephalopod", "carnivore", "wild", "swimming", "ocean", "smart", "tentacles", "camouflage"], description: "An intelligent eight-armed sea creature.", popularity: 72 },
      { name: "Butterfly", sub: "insects", tags: ["animal", "insect", "herbivore", "wild", "flying", "small", "colorful", "transforming"], description: "A colorful flying insect.", popularity: 72 },
      { name: "Bee", sub: "insects", tags: ["animal", "insect", "herbivore", "wild", "flying", "small", "stinging", "honey", "striped", "useful"], description: "A honey-making flying insect.", popularity: 70 },
      { name: "Ant", sub: "insects", tags: ["animal", "insect", "omnivore", "wild", "small", "industrious", "colony", "strong"], description: "A tiny social colony insect.", popularity: 65 },
      { name: "Spider", sub: "insects", tags: ["animal", "arachnid", "carnivore", "wild", "small", "web", "eight_legs", "venomous_possible"], description: "An eight-legged web-spinning arachnid.", popularity: 68 },
    ],
  },
  {
    name: "Countries",
    slug: "countries",
    icon: "Globe",
    color: "#06b6d4",
    description: "Think of any country in the world.",
    subs: [
      { name: "Asia", slug: "asia" },
      { name: "Europe", slug: "europe" },
      { name: "Americas", slug: "americas" },
      { name: "Africa", slug: "africa" },
      { name: "Oceania", slug: "oceania" },
    ],
    entities: [
      { name: "Japan", sub: "asia", tags: ["place", "country", "asian", "island", "developed", "populous", "tech_advanced", "mountainous", "sushi", "anime_origin"], description: "An island nation in East Asia.", popularity: 95 },
      { name: "China", sub: "asia", tags: ["place", "country", "asian", "large", "populous", "developing", "old_country", "communist", "great_wall"], description: "The world's most populous country.", popularity: 92 },
      { name: "India", sub: "asia", tags: ["place", "country", "asian", "large", "populous", "developing", "tropical", "spicy_food", "ancient_place"], description: "A populous South Asian nation.", popularity: 90 },
      { name: "South Korea", sub: "asia", tags: ["place", "country", "asian", "developed", "tech_advanced", "kpop", "small"], description: "A tech-forward East Asian nation.", popularity: 85 },
      { name: "Thailand", sub: "asia", tags: ["place", "country", "asian", "tropical", "developing", "buddhist", "beaches", "spicy_food"], description: "A Southeast Asian kingdom.", popularity: 78 },
      { name: "United Kingdom", sub: "europe", tags: ["place", "country", "european", "island", "developed", "royal", "old_country", "english_speaking", "tea"], description: "A nation of four countries in NW Europe.", popularity: 93 },
      { name: "France", sub: "europe", tags: ["place", "country", "european", "developed", "romantic", "old_country", "wine", "fashion", "eiffel"], description: "A Western European nation famed for culture.", popularity: 92 },
      { name: "Germany", sub: "europe", tags: ["place", "country", "european", "developed", "old_country", "cars", "beer", "efficient"], description: "A central European economic powerhouse.", popularity: 90 },
      { name: "Italy", sub: "europe", tags: ["place", "country", "european", "developed", "romantic", "old_country", "pasta", "fashion", "mediterranean"], description: "A Mediterranean European nation.", popularity: 90 },
      { name: "Spain", sub: "europe", tags: ["place", "country", "european", "developed", "mediterranean", "sunny", "fiesta", "old_country"], description: "A sunny southwestern European nation.", popularity: 85 },
      { name: "Russia", sub: "europe", tags: ["place", "country", "european", "asian", "large", "cold", "vodka", "old_country", "largest_country"], description: "The largest country, spanning two continents.", popularity: 88 },
      { name: "United States", sub: "americas", tags: ["place", "country", "american", "large", "developed", "populous", "diverse", "powerful", "english_speaking", "capitalist"], description: "A large federal republic in North America.", popularity: 97 },
      { name: "Canada", sub: "americas", tags: ["place", "country", "american", "large", "developed", "cold", "polite", "maple", "english_speaking"], description: "A large northern North American nation.", popularity: 88 },
      { name: "Brazil", sub: "americas", tags: ["place", "country", "american", "large", "developing", "tropical", "soccer", "carnival", "portuguese_speaking", "rainforest"], description: "The largest South American nation.", popularity: 86 },
      { name: "Mexico", sub: "americas", tags: ["place", "country", "american", "developing", "sunny", "spicy_food", "spanish_speaking", "old_country"], description: "A North American nation south of the US.", popularity: 84 },
      { name: "Egypt", sub: "africa", tags: ["place", "country", "african", "developing", "desert", "ancient_place", "pyramids", "hot", "arabic_speaking"], description: "A North African nation of ancient wonders.", popularity: 85 },
      { name: "South Africa", sub: "africa", tags: ["place", "country", "african", "developing", "diverse", "safari", "sunny", "diamonds"], description: "The southernmost African nation.", popularity: 78 },
      { name: "Nigeria", sub: "africa", tags: ["place", "country", "african", "populous", "developing", "tropical", "oil"], description: "The most populous African nation.", popularity: 72 },
      { name: "Kenya", sub: "africa", tags: ["place", "country", "african", "developing", "safari", "wildlife", "sunny", "runner"], description: "An East African nation known for safaris.", popularity: 70 },
      { name: "Australia", sub: "oceania", tags: ["place", "country", "oceanian", "island", "large", "developed", "desert", "kangaroo", "english_speaking", "southern_hemisphere"], description: "A continent-country in the Southern Hemisphere.", popularity: 90 },
      { name: "New Zealand", sub: "oceania", tags: ["place", "country", "oceanian", "island", "developed", "scenic", "sheep", "southern_hemisphere", "small"], description: "A scenic island nation in the Pacific.", popularity: 80 },
    ],
  },
  {
    name: "Movies",
    slug: "movies",
    icon: "Film",
    color: "#a855f7",
    description: "Think of any famous movie.",
    subs: [
      { name: "Action & Adventure", slug: "action" },
      { name: "Animation", slug: "animation" },
      { name: "Sci-Fi & Fantasy", slug: "scifi-fantasy" },
      { name: "Drama & Comedy", slug: "drama-comedy" },
      { name: "Horror", slug: "horror" },
    ],
    entities: [
      { name: "The Avengers", sub: "action", tags: ["movie", "action", "superhero", "blockbuster", "marvel", "modern_movie", "ensemble"], description: "Marvel's team of superheroes.", popularity: 90 },
      { name: "The Dark Knight", sub: "action", tags: ["movie", "action", "superhero", "dark", "blockbuster", "dc_comics", "modern_movie", "critically_acclaimed"], description: "Batman faces the Joker.", popularity: 92 },
      { name: "Jurassic Park", sub: "action", tags: ["movie", "action", "scifi", "dinosaur", "blockbuster", "classic_movie", "spielberg"], description: "Dinosaurs return in a theme park.", popularity: 88 },
      { name: "Star Wars: A New Hope", sub: "scifi-fantasy", tags: ["movie", "scifi", "space", "classic_movie", "blockbuster", "franchise", "lucas"], description: "The original space opera.", popularity: 93 },
      { name: "The Lion King", sub: "animation", tags: ["movie", "animated", "disney", "family", "animal_movie", "musical", "classic_movie", "african_setting"], description: "Disney's animated savanna epic.", popularity: 92 },
      { name: "Frozen", sub: "animation", tags: ["movie", "animated", "disney", "family", "musical", "modern_movie", "ice", "princess", "female_lead"], description: "Disney's icy princess tale.", popularity: 90 },
      { name: "Toy Story", sub: "animation", tags: ["movie", "animated", "pixar", "family", "toys", "classic_movie", "buddy"], description: "Pixar's toy adventure.", popularity: 91 },
      { name: "Spirited Away", sub: "animation", tags: ["movie", "animated", "anime_movie", "ghibli", "magical", "japanese_movie", "critically_acclaimed"], description: "Miyazaki's magical anime film.", popularity: 82 },
      { name: "The Matrix", sub: "scifi-fantasy", tags: ["movie", "scifi", "action", "modern_movie", "cyberpunk", "philosophical", "blockbuster"], description: "Reality is a simulation.", popularity: 88 },
      { name: "Avatar", sub: "scifi-fantasy", tags: ["movie", "scifi", "fantasy", "blockbuster", "modern_movie", "aliens", "3d", "blue"], description: "James Cameron's blue alien epic.", popularity: 84 },
      { name: "Harry Potter and the Sorcerer's Stone", sub: "scifi-fantasy", tags: ["movie", "fantasy", "magic", "family", "franchise", "british_movie", "wizard"], description: "The boy wizard's first film.", popularity: 88 },
      { name: "The Lord of the Rings", sub: "scifi-fantasy", tags: ["movie", "fantasy", "epic", "classic_movie", "franchise", "magic", "sword", "long_movie"], description: "Tolkien's epic on screen.", popularity: 90 },
      { name: "Titanic", sub: "drama-comedy", tags: ["movie", "drama", "romance", "blockbuster", "classic_movie", "ship", "tragic", "cameron"], description: "A romance aboard the doomed ship.", popularity: 88 },
      { name: "Forrest Gump", sub: "drama-comedy", tags: ["movie", "drama", "comedy", "classic_movie", "american_movie", "heartwarming", "historical_movie"], description: "Life is like a box of chocolates.", popularity: 86 },
      { name: "The Godfather", sub: "drama-comedy", tags: ["movie", "drama", "crime", "classic_movie", "mafia", "italian_american", "critically_acclaimed", "long_movie"], description: "The Corleone crime family saga.", popularity: 88 },
      { name: "Pulp Fiction", sub: "drama-comedy", tags: ["movie", "drama", "crime", "classic_movie", "tarantino", "nonlinear", "cult"], description: "Tarantino's crime anthology.", popularity: 84 },
      { name: "The Shawshank Redemption", sub: "drama-comedy", tags: ["movie", "drama", "classic_movie", "prison", "hope", "critically_acclaimed", "american_movie"], description: "A prison tale of hope.", popularity: 87 },
      { name: "Halloween", sub: "horror", tags: ["movie", "horror", "slasher", "classic_movie", "scary", "mask", "serial_killer"], description: "Michael Myers stalks the night.", popularity: 72 },
      { name: "The Exorcist", sub: "horror", tags: ["movie", "horror", "supernatural", "classic_movie", "scary", "possession", "religious"], description: "A demonic possession classic.", popularity: 70 },
      { name: "Get Out", sub: "horror", tags: ["movie", "horror", "thriller", "modern_movie", "social_commentary", "critically_acclaimed"], description: "A modern social horror.", popularity: 78 },
    ],
  },
  {
    name: "TV Shows",
    slug: "tv-shows",
    icon: "Tv",
    color: "#8b5cf6",
    description: "Think of any popular television series.",
    subs: [
      { name: "Drama", slug: "drama" },
      { name: "Comedy & Sitcom", slug: "comedy" },
      { name: "Crime & Thriller", slug: "crime" },
      { name: "Animation & Anime", slug: "animation" },
      { name: "Reality & Sci-Fi", slug: "reality-scifi" },
    ],
    entities: [
      { name: "Breaking Bad", sub: "crime", tags: ["tv_show", "crime_drama", "modern_show", "acclaimed", "drugs", "american_show", "dark", "chemistry"], description: "A teacher turns meth kingpin.", popularity: 93 },
      { name: "Game of Thrones", sub: "drama", tags: ["tv_show", "fantasy_drama", "modern_show", "dragons", "medieval_setting", "acclaimed", "violent"], description: "A medieval fantasy power struggle.", popularity: 92 },
      { name: "Stranger Things", sub: "drama", tags: ["tv_show", "scifi_drama", "modern_show", "streaming", "netflix", "80s_setting", "supernatural", "kids"], description: "80s kids face the Upside Down.", popularity: 90 },
      { name: "Friends", sub: "comedy", tags: ["tv_show", "sitcom", "classic_show", "comedy", "american_show", "ensemble", "90s"], description: "Six friends in NYC.", popularity: 94 },
      { name: "The Office", sub: "comedy", tags: ["tv_show", "sitcom", "comedy", "mockumentary", "american_show", "office", "cringe_comedy"], description: "A paper company's office life.", popularity: 95 },
      { name: "The Simpsons", sub: "animation", tags: ["tv_show", "animated_show", "cartoon", "comedy", "long_running", "family", "yellow", "american_show"], description: "America's longest animated family.", popularity: 90 },
      { name: "Avatar: The Last Airbender", sub: "animation", tags: ["tv_show", "animated_show", "anime_style", "fantasy", "kids", "acclaimed", "elemental_powers"], description: "A young avatar masters the elements.", popularity: 88 },
      { name: "Pokemon", sub: "animation", tags: ["tv_show", "animated_show", "anime_show", "kids", "long_running", "japanese_show", "creatures", "adventure"], description: "Ash and Pikachu's adventures.", popularity: 89 },
      { name: "Sherlock", sub: "crime", tags: ["tv_show", "crime_drama", "british_show", "modern_show", "detective", "smart", "acclaimed"], description: "A modern Sherlock Holmes.", popularity: 85 },
      { name: "The Witcher", sub: "drama", tags: ["tv_show", "fantasy_drama", "modern_show", "streaming", "monsters", "magic", "sword"], description: "A monster hunter's saga.", popularity: 80 },
      { name: "Money Heist", sub: "crime", tags: ["tv_show", "crime_drama", "modern_show", "streaming", "spanish_show", "heist", "masks", "red_jumpsuits"], description: "A daring bank heist crew.", popularity: 82 },
      { name: "Squid Game", sub: "drama", tags: ["tv_show", "thriller_drama", "modern_show", "streaming", "korean_show", "deadly_games", "social_commentary"], description: "Deadly children's games for cash.", popularity: 84 },
      { name: "Lost", sub: "reality-scifi", tags: ["tv_show", "scifi_drama", "island", "mystery", "ensemble", "plane_crash", "supernatural"], description: "Survivors of a plane crash on a mysterious island.", popularity: 78 },
      { name: "Black Mirror", sub: "reality-scifi", tags: ["tv_show", "scifi_drama", "anthology", "modern_show", "dark", "technology", "british_show"], description: "Dark tech-parable anthologies.", popularity: 80 },
      { name: "Keeping Up with the Kardashians", sub: "reality-scifi", tags: ["tv_show", "reality", "american_show", "celebrity", "long_running", "drama"], description: "A famous family's reality saga.", popularity: 70 },
    ],
  },
  {
    name: "Video Games",
    slug: "video-games",
    icon: "Gamepad2",
    color: "#10b981",
    description: "Think of any popular video game.",
    subs: [
      { name: "Action & Adventure", slug: "action" },
      { name: "RPG", slug: "rpg" },
      { name: "Platformer & Puzzle", slug: "platformer" },
      { name: "Sports & Racing", slug: "sports" },
      { name: "Shooter & Strategy", slug: "shooter" },
    ],
    entities: [
      { name: "Minecraft", sub: "action", tags: ["video_game", "sandbox", "blocky", "creative", "modern_game", "multiplayer", "pc_game", "popular", "building"], description: "Build anything in a blocky world.", popularity: 96 },
      { name: "The Legend of Zelda: Breath of the Wild", sub: "action", tags: ["video_game", "action_adventure", "open_world", "nintendo", "modern_game", "fantasy", "sword", "exploration"], description: "Explore a vast open Hyrule.", popularity: 90 },
      { name: "Grand Theft Auto V", sub: "action", tags: ["video_game", "action_adventure", "open_world", "modern_game", "crime", "multiplayer", "controversial", "blockbuster_game"], description: "An open-world crime epic.", popularity: 92 },
      { name: "Fortnite", sub: "action", tags: ["video_game", "battle_royale", "multiplayer", "modern_game", "shooter", "building", "colorful", "popular"], description: "A building battle royale.", popularity: 90 },
      { name: "The Witcher 3", sub: "rpg", tags: ["video_game", "rpg", "open_world", "modern_game", "fantasy", "mature", "story_rich", "sword", "magic"], description: "A monster-hunter RPG epic.", popularity: 88 },
      { name: "Skyrim", sub: "rpg", tags: ["video_game", "rpg", "open_world", "modern_game", "fantasy", "magic", "dragons", "moddable", "pc_game"], description: "An open-world dragon fantasy.", popularity: 89 },
      { name: "Pokémon Red/Blue", sub: "rpg", tags: ["video_game", "rpg", "retro_game", "nintendo", "creatures", "turn_based", "collecting", "classic_game"], description: "Gotta catch 'em all.", popularity: 88 },
      { name: "Final Fantasy VII", sub: "rpg", tags: ["video_game", "rpg", "retro_game", "japanese_game", "fantasy", "scifi", "story_rich", "sword"], description: "A JRPG classic.", popularity: 84 },
      { name: "Super Mario Bros.", sub: "platformer", tags: ["video_game", "platformer", "retro_game", "nintendo", "classic_game", "jumping", "family", "arcade"], description: "The plumber's classic adventure.", popularity: 95 },
      { name: "Tetris", sub: "platformer", tags: ["video_game", "puzzle", "retro_game", "classic_game", "simple", "arcade", "blocks", "russian_origin"], description: "The iconic block puzzle.", popularity: 92 },
      { name: "Portal", sub: "platformer", tags: ["video_game", "puzzle", "modern_game", "first_person", "science", "witty", "portal_gun"], description: "A portal-based puzzle game.", popularity: 85 },
      { name: "Mario Kart", sub: "sports", tags: ["video_game", "racing", "nintendo", "multiplayer", "family", "colorful", "items", "fun"], description: "Nintendo's kart racer.", popularity: 90 },
      { name: "FIFA", sub: "sports", tags: ["video_game", "sports_game", "soccer", "multiplayer", "yearly_release", "realistic", "popular"], description: "The soccer simulation series.", popularity: 88 },
      { name: "Call of Duty", sub: "shooter", tags: ["video_game", "shooter", "first_person", "multiplayer", "modern_game", "military", "war", "popular"], description: "A military FPS franchise.", popularity: 89 },
      { name: "Counter-Strike", sub: "shooter", tags: ["video_game", "shooter", "first_person", "multiplayer", "pc_game", "tactical", "terrorists", "competitive"], description: "A tactical FPS classic.", popularity: 84 },
      { name: "League of Legends", sub: "shooter", tags: ["video_game", "moba", "multiplayer", "pc_game", "competitive", "fantasy", "team_based", "esports"], description: "A team-based MOBA.", popularity: 87 },
      { name: "Chess", sub: "shooter", tags: ["game", "board_game", "strategy", "classic_game", "two_player", "thinking", "royal", "old_game"], description: "The royal board game.", popularity: 85 },
    ],
  },
  {
    name: "Celebrities",
    slug: "celebrities",
    icon: "Star",
    color: "#eab308",
    description: "Think of any famous real person — actor, musician, athlete, or icon.",
    subs: [
      { name: "Actors", slug: "actors" },
      { name: "Musicians", slug: "musicians" },
      { name: "Athletes", slug: "athletes" },
      { name: "Business & Tech", slug: "business" },
      { name: "Influencers", slug: "influencers" },
    ],
    entities: [
      { name: "Leonardo DiCaprio", sub: "actors", tags: ["real_person", "celebrity", "actor", "male", "alive", "american", "famous", "oscar_winner", "environmentalist"], description: "An acclaimed American actor.", popularity: 92 },
      { name: "Tom Hanks", sub: "actors", tags: ["real_person", "celebrity", "actor", "male", "alive", "american", "famous", "oscar_winner", "likable"], description: "America's everyman actor.", popularity: 90 },
      { name: "Scarlett Johansson", sub: "actors", tags: ["real_person", "celebrity", "actor", "female", "alive", "american", "famous", "marvel"], description: "A versatile American actress.", popularity: 88 },
      { name: "Keanu Reeves", sub: "actors", tags: ["real_person", "celebrity", "actor", "male", "alive", "canadian", "famous", "action_star", "kind", "matrix"], description: "The beloved action star.", popularity: 91 },
      { name: "Morgan Freeman", sub: "actors", tags: ["real_person", "celebrity", "actor", "male", "alive", "american", "famous", "voice", "oscar_winner", "narrator"], description: "The iconic voice actor.", popularity: 85 },
      { name: "Michael Jackson", sub: "musicians", tags: ["real_person", "celebrity", "musician", "male", "dead", "american", "famous", "pop", "dancer", "king_of_pop"], description: "The King of Pop.", popularity: 93 },
      { name: "Taylor Swift", sub: "musicians", tags: ["real_person", "celebrity", "musician", "female", "alive", "american", "famous", "pop", "songwriter", "fans"], description: "A pop superstar songwriter.", popularity: 95 },
      { name: "Beyoncé", sub: "musicians", tags: ["real_person", "celebrity", "musician", "female", "alive", "american", "famous", "pop", "rnb", "diva"], description: "A pop and R&B icon.", popularity: 92 },
      { name: "Eminem", sub: "musicians", tags: ["real_person", "celebrity", "musician", "male", "alive", "american", "famous", "rap", "fast_lyrics"], description: "A rap legend.", popularity: 88 },
      { name: "Freddie Mercury", sub: "musicians", tags: ["real_person", "celebrity", "musician", "male", "dead", "british", "famous", "rock", "queen_band", "singer"], description: "Queen's legendary frontman.", popularity: 90 },
      { name: "Lionel Messi", sub: "athletes", tags: ["real_person", "celebrity", "athlete", "male", "alive", "argentinian", "famous", "soccer", "goat", "small"], description: "An Argentine soccer legend.", popularity: 94 },
      { name: "Cristiano Ronaldo", sub: "athletes", tags: ["real_person", "celebrity", "athlete", "male", "alive", "portuguese", "famous", "soccer", "fit", "rich"], description: "A Portuguese soccer superstar.", popularity: 94 },
      { name: "Michael Jordan", sub: "athletes", tags: ["real_person", "celebrity", "athlete", "male", "alive", "american", "famous", "basketball", "goat", "brand"], description: "A basketball legend.", popularity: 93 },
      { name: "Serena Williams", sub: "athletes", tags: ["real_person", "celebrity", "athlete", "female", "alive", "american", "famous", "tennis", "champion"], description: "A tennis great.", popularity: 86 },
      { name: "Usain Bolt", sub: "athletes", tags: ["real_person", "celebrity", "athlete", "male", "alive", "jamaican", "famous", "sprint", "fastest", "olympic"], description: "The fastest man alive.", popularity: 85 },
      { name: "Elon Musk", sub: "business", tags: ["real_person", "celebrity", "entrepreneur", "male", "alive", "american", "famous", "tech_billionaire", "twitter_owner", "spacex", "tesla", "controversial"], description: "A tech billionaire entrepreneur.", popularity: 94 },
      { name: "Steve Jobs", sub: "business", tags: ["real_person", "celebrity", "entrepreneur", "male", "dead", "american", "famous", "apple", "visionary", "tech"], description: "Apple's visionary co-founder.", popularity: 92 },
      { name: "Bill Gates", sub: "business", tags: ["real_person", "celebrity", "entrepreneur", "male", "alive", "american", "famous", "microsoft", "philanthropist", "tech_billionaire"], description: "Microsoft's co-founder.", popularity: 88 },
      { name: "Mark Zuckerberg", sub: "business", tags: ["real_person", "celebrity", "entrepreneur", "male", "alive", "american", "famous", "facebook", "meta", "tech_billionaire"], description: "Facebook/Meta's founder.", popularity: 84 },
      { name: "MrBeast", sub: "influencers", tags: ["real_person", "celebrity", "influencer", "male", "alive", "american", "famous", "youtube", "philanthropist", "young"], description: "A mega YouTube creator.", popularity: 90 },
    ],
  },
  {
    name: "Sports",
    slug: "sports",
    icon: "Trophy",
    color: "#ef4444",
    description: "Think of any sport — team, individual, ball, or racing.",
    subs: [
      { name: "Team Sports", slug: "team" },
      { name: "Individual Sports", slug: "individual" },
      { name: "Water & Winter", slug: "water-winter" },
      { name: "Combat & Extreme", slug: "combat" },
    ],
    entities: [
      { name: "Soccer", sub: "team", tags: ["sport", "team_sport", "ball_sport", "outdoor_sport", "olympic", "global_sport", "popular_sport", "foot"], description: "The world's most popular sport.", popularity: 96 },
      { name: "Basketball", sub: "team", tags: ["sport", "team_sport", "ball_sport", "indoor_sport", "olympic", "popular_sport", "tall", "american"], description: "A team sport of hoops.", popularity: 92 },
      { name: "American Football", sub: "team", tags: ["sport", "team_sport", "ball_sport", "outdoor_sport", "contact", "american", "popular_sport", "helmet"], description: "The NFL contact sport.", popularity: 90 },
      { name: "Baseball", sub: "team", tags: ["sport", "team_sport", "ball_sport", "outdoor_sport", "american", "bat", "popular_sport", "classic_sport"], description: "America's pastime.", popularity: 85 },
      { name: "Cricket", sub: "team", tags: ["sport", "team_sport", "ball_sport", "outdoor_sport", "bat", "british_origin", "popular_sport", "long_game", "commonwealth"], description: "A bat-and-ball sport loved by millions.", popularity: 88 },
      { name: "Volleyball", sub: "team", tags: ["sport", "team_sport", "ball_sport", "outdoor_sport", "indoor_sport", "olympic", "net", "teamwork"], description: "A net sport of sets and spikes.", popularity: 80 },
      { name: "Rugby", sub: "team", tags: ["sport", "team_sport", "ball_sport", "outdoor_sport", "contact", "british_origin", "tough", "no_pads"], description: "A tough contact team sport.", popularity: 78 },
      { name: "Tennis", sub: "individual", tags: ["sport", "individual_sport", "ball_sport", "outdoor_sport", "olympic", "racket", "popular_sport", "net"], description: "A racket sport of aces.", popularity: 88 },
      { name: "Golf", sub: "individual", tags: ["sport", "individual_sport", "ball_sport", "outdoor_sport", "club", "precision", "slow", "expensive", "scenic"], description: "A precision club sport.", popularity: 82 },
      { name: "Athletics", sub: "individual", tags: ["sport", "individual_sport", "outdoor_sport", "olympic", "running", "jumping", "throwing", "track"], description: "Track and field events.", popularity: 80 },
      { name: "Cycling", sub: "individual", tags: ["sport", "individual_sport", "outdoor_sport", "olympic", "bike", "endurance", "tour"], description: "Racing on bicycles.", popularity: 78 },
      { name: "Swimming", sub: "water-winter", tags: ["sport", "individual_sport", "water_sport", "indoor_sport", "olympic", "endurance", "pool"], description: "Racing in water.", popularity: 82 },
      { name: "Surfing", sub: "water-winter", tags: ["sport", "individual_sport", "water_sport", "outdoor_sport", "olympic", "waves", "board", "beach"], description: "Riding ocean waves.", popularity: 75 },
      { name: "Skiing", sub: "water-winter", tags: ["sport", "individual_sport", "winter_sport", "outdoor_sport", "olympic", "snow", "mountain", "fast"], description: "Gliding on snow.", popularity: 78 },
      { name: "Ice Hockey", sub: "water-winter", tags: ["sport", "team_sport", "winter_sport", "indoor_sport", "olympic", "ice", "puck", "contact", "fast"], description: "Fast team sport on ice.", popularity: 82 },
      { name: "Boxing", sub: "combat", tags: ["sport", "individual_sport", "combat_sport", "contact", "olympic", "gloves", "fighting", "ring", "tough"], description: "The sweet science of fist-fighting.", popularity: 84 },
      { name: "MMA", sub: "combat", tags: ["sport", "individual_sport", "combat_sport", "contact", "mixed", "fighting", "cage", "tough", "modern_sport"], description: "Mixed martial arts combat.", popularity: 85 },
      { name: "Formula 1", sub: "combat", tags: ["sport", "individual_sport", "racing", "motorsport", "outdoor_sport", "fast", "cars", "expensive", "global_sport"], description: "The pinnacle of motorsport.", popularity: 86 },
    ],
  },
  {
    name: "Brands",
    slug: "brands",
    icon: "ShoppingBag",
    color: "#f97316",
    description: "Think of any well-known brand or company.",
    subs: [
      { name: "Technology", slug: "tech" },
      { name: "Food & Drink", slug: "food-drink" },
      { name: "Fashion & Luxury", slug: "fashion" },
      { name: "Automotive", slug: "auto" },
      { name: "Retail & Services", slug: "retail" },
    ],
    entities: [
      { name: "Apple", sub: "tech", tags: ["brand", "tech_brand", "global_brand", "luxury_brand", "software_brand", "hardware_brand", "american_brand", "modern_brand", "premium"], description: "Maker of the iPhone and Mac.", popularity: 96 },
      { name: "Google", sub: "tech", tags: ["brand", "tech_brand", "software_brand", "global_brand", "american_brand", "modern_brand", "search", "ads"], description: "The search giant.", popularity: 95 },
      { name: "Microsoft", sub: "tech", tags: ["brand", "tech_brand", "software_brand", "hardware_brand", "global_brand", "american_brand", "old_brand", "os"], description: "Windows and Office maker.", popularity: 93 },
      { name: "Samsung", sub: "tech", tags: ["brand", "tech_brand", "hardware_brand", "global_brand", "korean_brand", "electronics", "diverse"], description: "A Korean electronics conglomerate.", popularity: 90 },
      { name: "Sony", sub: "tech", tags: ["brand", "tech_brand", "hardware_brand", "global_brand", "japanese_brand", "old_brand", "electronics", "gaming", "entertainment"], description: "A Japanese entertainment-tech giant.", popularity: 90 },
      { name: "Coca-Cola", sub: "food-drink", tags: ["brand", "drink_brand", "global_brand", "american_brand", "old_brand", "soda", "sweet", "red"], description: "The iconic soda brand.", popularity: 94 },
      { name: "McDonald's", sub: "food-drink", tags: ["brand", "food_brand", "global_brand", "american_brand", "fast_food", "old_brand", "burgers", "yellow"], description: "The golden arches fast food.", popularity: 93 },
      { name: "Starbucks", sub: "food-drink", tags: ["brand", "drink_brand", "global_brand", "american_brand", "modern_brand", "coffee", "premium"], description: "The global coffee chain.", popularity: 90 },
      { name: "Nike", sub: "fashion", tags: ["brand", "fashion_brand", "global_brand", "american_brand", "sportswear", "shoes", "swoosh", "modern_brand"], description: "The swoosh sportswear brand.", popularity: 93 },
      { name: "Adidas", sub: "fashion", tags: ["brand", "fashion_brand", "global_brand", "german_brand", "sportswear", "shoes", "stripes"], description: "The three-stripe sportswear brand.", popularity: 88 },
      { name: "Louis Vuitton", sub: "fashion", tags: ["brand", "fashion_brand", "luxury_brand", "global_brand", "french_brand", "old_brand", "bags", "expensive"], description: "A French luxury house.", popularity: 85 },
      { name: "Gucci", sub: "fashion", tags: ["brand", "fashion_brand", "luxury_brand", "global_brand", "italian_brand", "old_brand", "expensive", "logo_heavy"], description: "An Italian luxury fashion brand.", popularity: 84 },
      { name: "Toyota", sub: "auto", tags: ["brand", "car_brand", "global_brand", "japanese_brand", "old_brand", "reliable", "mass_market"], description: "A reliable Japanese automaker.", popularity: 90 },
      { name: "Tesla", sub: "auto", tags: ["brand", "car_brand", "tech_brand", "american_brand", "modern_brand", "electric", "innovative", "premium"], description: "An electric car innovator.", popularity: 89 },
      { name: "Ferrari", sub: "auto", tags: ["brand", "car_brand", "luxury_brand", "global_brand", "italian_brand", "old_brand", "sports_car", "expensive", "red"], description: "An Italian sports car maker.", popularity: 87 },
      { name: "BMW", sub: "auto", tags: ["brand", "car_brand", "luxury_brand", "global_brand", "german_brand", "old_brand", "premium", "sporty"], description: "A German premium automaker.", popularity: 86 },
      { name: "Amazon", sub: "retail", tags: ["brand", "tech_brand", "global_brand", "american_brand", "modern_brand", "ecommerce", "cloud", "delivery"], description: "The everything store.", popularity: 94 },
      { name: "Walmart", sub: "retail", tags: ["brand", "global_brand", "american_brand", "old_brand", "retail", "discount", "mass_market"], description: "A discount retail giant.", popularity: 88 },
      { name: "IKEA", sub: "retail", tags: ["brand", "global_brand", "swedish_brand", "old_brand", "furniture", "flat_pack", "affordable"], description: "Flat-pack furniture retailer.", popularity: 85 },
    ],
  },
  {
    name: "Objects",
    slug: "objects",
    icon: "Package",
    color: "#14b8a6",
    description: "Think of any common physical object.",
    subs: [
      { name: "Electronics", slug: "electronics" },
      { name: "Household", slug: "household" },
      { name: "Clothing", slug: "clothing" },
      { name: "Tools & Office", slug: "tools-office" },
      { name: "Food & Drink Items", slug: "food-items" },
    ],
    entities: [
      { name: "Smartphone", sub: "electronics", tags: ["object", "electronic", "portable", "small_object", "modern_object", "screen", "battery", "communication", "essential"], description: "A pocket-sized mobile computer.", popularity: 95 },
      { name: "Laptop", sub: "electronics", tags: ["object", "electronic", "portable", "medium_object", "modern_object", "screen", "keyboard", "battery", "work"], description: "A portable computer.", popularity: 92 },
      { name: "Television", sub: "electronics", tags: ["object", "electronic", "large_object", "screen", "household", "entertainment", "old_object", "modern_object"], description: "A screen for watching broadcasts.", popularity: 88 },
      { name: "Headphones", sub: "electronics", tags: ["object", "electronic", "portable", "small_object", "audio", "modern_object", "wearable"], description: "Personal audio listening.", popularity: 86 },
      { name: "Camera", sub: "electronics", tags: ["object", "electronic", "portable", "medium_object", "lens", "photo", "modern_object"], description: "Captures photographs.", popularity: 80 },
      { name: "Refrigerator", sub: "household", tags: ["object", "household", "large_object", "kitchen", "cold", "electric", "essential"], description: "Keeps food cold.", popularity: 82 },
      { name: "Microwave", sub: "household", tags: ["object", "household", "medium_object", "kitchen", "electric", "heating", "modern_object"], description: "Heats food quickly.", popularity: 78 },
      { name: "Sofa", sub: "household", tags: ["object", "furniture", "large_object", "soft", "living_room", "seating", "comfortable"], description: "A comfy living room seat.", popularity: 80 },
      { name: "Bed", sub: "household", tags: ["object", "furniture", "large_object", "soft", "bedroom", "sleep", "essential"], description: "Where you sleep.", popularity: 85 },
      { name: "Lamp", sub: "household", tags: ["object", "household", "small_object", "light", "electric", "indoor_object"], description: "Provides light.", popularity: 75 },
      { name: "T-Shirt", sub: "clothing", tags: ["object", "clothing", "small_object", "soft", "wearable", "casual", "cotton", "essential"], description: "A casual short-sleeve top.", popularity: 85 },
      { name: "Jeans", sub: "clothing", tags: ["object", "clothing", "small_object", "wearable", "casual", "denim", "pants", "durable"], description: "Denim trousers.", popularity: 84 },
      { name: "Sneakers", sub: "clothing", tags: ["object", "clothing", "small_object", "wearable", "shoes", "sporty", "comfortable", "rubber"], description: "Casual athletic shoes.", popularity: 86 },
      { name: "Hat", sub: "clothing", tags: ["object", "clothing", "small_object", "wearable", "head", "accessory", "sun_protection"], description: "Headwear.", popularity: 72 },
      { name: "Watch", sub: "clothing", tags: ["object", "accessory", "small_object", "wearable", "time", "old_object", "modern_object", "luxury_possible"], description: "A wrist-worn timepiece.", popularity: 78 },
      { name: "Hammer", sub: "tools-office", tags: ["object", "tool", "small_object", "metal", "wood", "hand_tool", "sharp_possible", "construction"], description: "Drives nails.", popularity: 80 },
      { name: "Scissors", sub: "tools-office", tags: ["object", "tool", "small_object", "metal", "sharp", "hand_tool", "cutting"], description: "Cuts paper and fabric.", popularity: 78 },
      { name: "Pen", sub: "tools-office", tags: ["object", "office", "small_object", "portable", "writing", "ink", "essential"], description: "Writes with ink.", popularity: 80 },
      { name: "Book", sub: "tools-office", tags: ["object", "office", "medium_object", "paper", "reading", "knowledge", "old_object", "portable"], description: "Bound pages of text.", popularity: 85 },
      { name: "Umbrella", sub: "tools-office", tags: ["object", "tool", "small_object", "portable", "folding", "rain", "fabric", "outdoor_object"], description: "Keeps rain off.", popularity: 75 },
      { name: "Pizza", sub: "food-items", tags: ["object", "food", "italian_origin", "round", "cheese", "popular_food", "hot", "savory", "shareable"], description: "A cheesy Italian flatbread.", popularity: 92 },
      { name: "Coffee", sub: "food-items", tags: ["object", "food", "drink", "hot", "brown", "caffeine", "morning", "popular_food", "aromatic"], description: "A caffeinated morning drink.", popularity: 90 },
      { name: "Burger", sub: "food-items", tags: ["object", "food", "american_origin", "meat", "bread", "popular_food", "hot", "savory", "fast_food"], description: "A meat patty in a bun.", popularity: 88 },
      { name: "Sushi", sub: "food-items", tags: ["object", "food", "japanese_origin", "rice", "fish", "cold", "popular_food", "healthy", "artful"], description: "Japanese rice and fish.", popularity: 85 },
    ],
  },
  {
    name: "Historical Figures",
    slug: "historical",
    icon: "ScrollText",
    color: "#7c3aed",
    description: "Think of any famous person from history.",
    subs: [
      { name: "Ancient World", slug: "ancient" },
      { name: "Scientists & Inventors", slug: "scientists" },
      { name: "Leaders & Rulers", slug: "leaders" },
      { name: "Artists & Thinkers", slug: "artists" },
      { name: "Modern Era", slug: "modern-era" },
    ],
    entities: [
      { name: "Albert Einstein", sub: "scientists", tags: ["real_person", "historical_figure", "scientist", "male", "dead", "german", "famous", "physics", "genius", "mustache", "modern_era"], description: "The physicist of relativity.", popularity: 95 },
      { name: "Isaac Newton", sub: "scientists", tags: ["real_person", "historical_figure", "scientist", "male", "dead", "british", "famous", "physics", "math", "gravity", "old_era"], description: "Discovered gravity and calculus.", popularity: 90 },
      { name: "Nikola Tesla", sub: "scientists", tags: ["real_person", "historical_figure", "inventor", "male", "dead", "serbian", "american", "famous", "electricity", "eccentric", "modern_era"], description: "A pioneer of electricity.", popularity: 88 },
      { name: "Marie Curie", sub: "scientists", tags: ["real_person", "historical_figure", "scientist", "female", "dead", "polish", "french", "famous", "physics", "chemistry", "nobel", "modern_era"], description: "A Nobel-winning scientist.", popularity: 85 },
      { name: "Charles Darwin", sub: "scientists", tags: ["real_person", "historical_figure", "scientist", "male", "dead", "british", "famous", "biology", "evolution", "beard", "modern_era"], description: "Theorized evolution.", popularity: 86 },
      { name: "Leonardo da Vinci", sub: "artists", tags: ["real_person", "historical_figure", "artist", "inventor", "male", "dead", "italian", "famous", "painter", "genius", "renaissance", "old_era"], description: "The Renaissance polymath.", popularity: 90 },
      { name: "William Shakespeare", sub: "artists", tags: ["real_person", "historical_figure", "writer", "male", "dead", "british", "famous", "playwright", "poet", "old_era"], description: "The Bard of Avon.", popularity: 90 },
      { name: "Mozart", sub: "artists", tags: ["real_person", "historical_figure", "musician", "male", "dead", "austrian", "famous", "composer", "classical", "child_prodigy", "old_era"], description: "A classical music prodigy.", popularity: 86 },
      { name: "Beethoven", sub: "artists", tags: ["real_person", "historical_figure", "musician", "male", "dead", "german", "famous", "composer", "classical", "deaf", "old_era"], description: "A deaf classical composer.", popularity: 84 },
      { name: "Napoleon Bonaparte", sub: "leaders", tags: ["real_person", "historical_figure", "leader", "male", "dead", "french", "famous", "military", "emperor", "short_myth", "old_era"], description: "A French emperor and general.", popularity: 88 },
      { name: "Julius Caesar", sub: "ancient", tags: ["real_person", "historical_figure", "leader", "male", "dead", "roman", "famous", "military", "ruler", "ancient_era", "assassinated"], description: "A Roman general and dictator.", popularity: 88 },
      { name: "Cleopatra", sub: "ancient", tags: ["real_person", "historical_figure", "leader", "female", "dead", "egyptian", "famous", "ruler", "beautiful", "ancient_era", "royal"], description: "The last pharaoh of Egypt.", popularity: 86 },
      { name: "Alexander the Great", sub: "ancient", tags: ["real_person", "historical_figure", "leader", "male", "dead", "greek", "famous", "military", "conqueror", "ancient_era", "young"], description: "A Macedonian conqueror.", popularity: 84 },
      { name: "Genghis Khan", sub: "ancient", tags: ["real_person", "historical_figure", "leader", "male", "dead", "mongolian", "famous", "military", "conqueror", "empire", "ancient_era"], description: "Founder of the Mongol Empire.", popularity: 82 },
      { name: "George Washington", sub: "leaders", tags: ["real_person", "historical_figure", "leader", "male", "dead", "american", "famous", "president", "founder", "military", "modern_era"], description: "The first US president.", popularity: 90 },
      { name: "Abraham Lincoln", sub: "leaders", tags: ["real_person", "historical_figure", "leader", "male", "dead", "american", "famous", "president", "tall", "beard", "hat", "modern_era"], description: "The US president who freed slaves.", popularity: 89 },
      { name: "Mahatma Gandhi", sub: "leaders", tags: ["real_person", "historical_figure", "leader", "male", "dead", "indian", "famous", "peaceful", "activist", "thin", "glasses", "modern_era"], description: "India's peaceful independence leader.", popularity: 88 },
      { name: "Martin Luther King Jr.", sub: "modern-era", tags: ["real_person", "historical_figure", "leader", "male", "dead", "american", "famous", "activist", "peaceful", "speech", "modern_era"], description: "A civil rights icon.", popularity: 87 },
      { name: "Winston Churchill", sub: "modern-era", tags: ["real_person", "historical_figure", "leader", "male", "dead", "british", "famous", "prime_minister", "ww2", "cigar", "modern_era"], description: "Britain's wartime PM.", popularity: 84 },
      { name: "Nelson Mandela", sub: "modern-era", tags: ["real_person", "historical_figure", "leader", "male", "dead", "south_african", "famous", "activist", "president", "imprisoned", "modern_era"], description: "South Africa's anti-apartheid hero.", popularity: 86 },
    ],
  },
];

// ------------------------------------------------------------
// QUESTIONS
// Each probes a tag. Yes => the entity HAS that tag (unless inverted).
// ------------------------------------------------------------

const QUESTIONS: QuestionSeed[] = [
  // --- Broad category splitters (work in "Anything" mode) ---
  { text: "Is it a real, existing person?", tag: "real_person" },
  { text: "Is it a fictional character?", tag: "fictional_character" },
  { text: "Is it a job or profession?", tag: "profession" },
  { text: "Is it an animal?", tag: "animal" },
  { text: "Is it a country or place?", tag: "place" },
  { text: "Is it a movie?", tag: "movie" },
  { text: "Is it a TV show?", tag: "tv_show" },
  { text: "Is it a video game?", tag: "video_game" },
  { text: "Is it a brand or company?", tag: "brand" },
  { text: "Is it a physical object?", tag: "object" },
  { text: "Is it a sport?", tag: "sport" },
  { text: "Is it a famous person from history?", tag: "historical_figure" },
  { text: "Is it a celebrity?", tag: "celebrity" },

  // --- People: gender / life ---
  { text: "Is this person male?", tag: "male" },
  { text: "Is this person female?", tag: "female" },
  { text: "Is this person still alive?", tag: "alive" },
  { text: "Is this person deceased?", tag: "dead" },
  { text: "Is this person American?", tag: "american" },
  { text: "Is this person European (British, French, German, etc.)?", tag: "european" },
  { text: "Is this person Asian (Japanese, Chinese, etc.)?", tag: "asian" },
  { text: "Is this person an actor or actress?", tag: "actor" },
  { text: "Is this person a musician or singer?", tag: "musician" },
  { text: "Is this person an athlete?", tag: "athlete" },
  { text: "Is this person a scientist or inventor?", tag: "scientist" },
  { text: "Is this person a political or military leader?", tag: "leader" },
  { text: "Is this person an entrepreneur or business figure?", tag: "entrepreneur" },
  { text: "Is this person known for being a genius?", tag: "genius" },
  { text: "Is this person famous?", tag: "famous" },

  // --- Characters ---
  { text: "Is the character from an anime or manga?", tag: "anime" },
  { text: "Is the character a superhero?", tag: "superhero" },
  { text: "Is the character a villain?", tag: "villain" },
  { text: "Does the character have superpowers?", tag: "powers" },
  { text: "Is the character from comics?", tag: "comics" },
  { text: "Is the character from a cartoon?", tag: "cartoon" },
  { text: "Is the character from a book?", tag: "book_character" },
  { text: "Is the character from a video game?", tag: "video_game_character" },
  { text: "Is the character from Disney?", tag: "disney" },
  { text: "Is the character associated with Nintendo?", tag: "nintendo" },
  { text: "Does the character use magic?", tag: "magic" },
  { text: "Does the character wield a sword?", tag: "sword" },
  { text: "Is the character young (a child or teen)?", tag: "young" },
  { text: "Is the character funny?", tag: "funny" },
  { text: "Is the character cute?", tag: "cute" },
  { text: "Is the character an animal or animal-like?", tag: "animal_like" },

  // --- Jobs ---
  { text: "Does the job require a university degree?", tag: "degree" },
  { text: "Is it a healthcare job?", tag: "healthcare" },
  { text: "Is it a technology job?", tag: "technology" },
  { text: "Is it in education?", tag: "education" },
  { text: "Is it a creative or arts job?", tag: "arts" },
  { text: "Is it a trade (manual labor)?", tag: "trades" },
  { text: "Is it a well-paid job?", tag: "high_income" },
  { text: "Does the job involve working with people?", tag: "people_focused" },
  { text: "Does the job involve working with machines or computers?", tag: "machine_focused" },
  { text: "Does the job involve science?", tag: "science" },
  { text: "Is the job mostly indoors?", tag: "indoor" },
  { text: "Is the job mostly outdoors?", tag: "outdoor" },
  { text: "Does the job involve a uniform?", tag: "uniform" },
  { text: "Is the job physically demanding?", tag: "physical" },
  { text: "Is the job dangerous?", tag: "dangerous" },
  { text: "Is it a law-related job?", tag: "law" },

  // --- Animals ---
  { text: "Is it a mammal?", tag: "mammal" },
  { text: "Is it a bird?", tag: "bird" },
  { text: "Is it a reptile or amphibian?", tag: "reptile" },
  { text: "Is it a fish or sea creature?", tag: "fish" },
  { text: "Is it an insect or bug?", tag: "insect" },
  { text: "Is it a carnivore (meat-eater)?", tag: "carnivore" },
  { text: "Is it a herbivore (plant-eater)?", tag: "herbivore" },
  { text: "Is it a wild animal?", tag: "wild" },
  { text: "Is it a domestic or pet animal?", tag: "domestic" },
  { text: "Can it fly?", tag: "flying" },
  { text: "Can it swim?", tag: "swimming" },
  { text: "Is it a large animal?", tag: "large" },
  { text: "Is it a small animal?", tag: "small" },
  { text: "Is it a predator?", tag: "predator" },
  { text: "Is it a fast animal?", tag: "fast" },
  { text: "Is it considered smart or intelligent?", tag: "smart" },
  { text: "Is it from Africa?", tag: "african_animal" },
  { text: "Is it from Asia?", tag: "asian_animal" },

  // --- Countries / places ---
  { text: "Is it in Asia?", tag: "asian" },
  { text: "Is it in Europe?", tag: "european" },
  { text: "Is it in the Americas?", tag: "american" },
  { text: "Is it in Africa?", tag: "african" },
  { text: "Is it an island nation?", tag: "island" },
  { text: "Is it a large country?", tag: "large" },
  { text: "Is it a populous country?", tag: "populous" },
  { text: "Is it a developed country?", tag: "developed" },
  { text: "Is it a tropical country?", tag: "tropical" },
  { text: "Is it a cold country?", tag: "cold" },
  { text: "Is it a hot country?", tag: "hot" },
  { text: "Is it an ancient civilization?", tag: "ancient_place" },
  { text: "Is it English-speaking?", tag: "english_speaking" },
  { text: "Is it known for technology?", tag: "tech_advanced" },

  // --- Movies ---
  { text: "Is it an animated movie?", tag: "animated" },
  { text: "Is it a Disney movie?", tag: "disney" },
  { text: "Is it an action movie?", tag: "action" },
  { text: "Is it a comedy?", tag: "comedy" },
  { text: "Is it a drama?", tag: "drama" },
  { text: "Is it a horror movie?", tag: "horror" },
  { text: "Is it a sci-fi movie?", tag: "scifi" },
  { text: "Is it a fantasy movie?", tag: "fantasy" },
  { text: "Is it a superhero movie?", tag: "superhero" },
  { text: "Is it a blockbuster?", tag: "blockbuster" },
  { text: "Is it a classic (older) movie?", tag: "classic_movie" },
  { text: "Is it a modern (recent) movie?", tag: "modern_movie" },
  { text: "Is it a family-friendly movie?", tag: "family" },
  { text: "Is it critically acclaimed?", tag: "critically_acclaimed" },
  { text: "Is it part of a franchise?", tag: "franchise" },

  // --- TV shows ---
  { text: "Is it a sitcom (comedy)?", tag: "sitcom" },
  { text: "Is it a crime or thriller drama?", tag: "crime_drama" },
  { text: "Is it an animated show?", tag: "animated_show" },
  { text: "Is it a streaming-era show?", tag: "modern_show" },
  { text: "Is it a long-running show?", tag: "long_running" },
  { text: "Is it a British show?", tag: "british_show" },
  { text: "Is it an American show?", tag: "american_show" },
  { text: "Is it dark or violent?", tag: "dark" },
  { text: "Is it a reality show?", tag: "reality" },

  // --- Video games ---
  { text: "Is it a role-playing game (RPG)?", tag: "rpg" },
  { text: "Is it an action-adventure game?", tag: "action_adventure" },
  { text: "Is it a shooter game?", tag: "shooter" },
  { text: "Is it a puzzle game?", tag: "puzzle" },
  { text: "Is it a sports or racing game?", tag: "sports_game" },
  { text: "Is it an open-world game?", tag: "open_world" },
  { text: "Is it a retro / classic game?", tag: "retro_game" },
  { text: "Is it a modern game?", tag: "modern_game" },
  { text: "Is it a Nintendo game?", tag: "nintendo" },
  { text: "Is it multiplayer?", tag: "multiplayer" },
  { text: "Does it involve magic or fantasy?", tag: "fantasy" },
  { text: "Is it a sandbox or creative game?", tag: "sandbox" },

  // --- Brands ---
  { text: "Is it a technology brand?", tag: "tech_brand" },
  { text: "Is it a food or drink brand?", tag: "food_brand" },
  { text: "Is it a fashion brand?", tag: "fashion_brand" },
  { text: "Is it a car brand?", tag: "car_brand" },
  { text: "Is it a luxury (expensive) brand?", tag: "luxury_brand" },
  { text: "Is it an American brand?", tag: "american_brand" },
  { text: "Is it a Japanese brand?", tag: "japanese_brand" },
  { text: "Is it a European brand?", tag: "european" },
  { text: "Is it a global (worldwide) brand?", tag: "global_brand" },
  { text: "Is it an old, established brand?", tag: "old_brand" },
  { text: "Is it a modern, recent brand?", tag: "modern_brand" },
  { text: "Does it make hardware (devices)?", tag: "hardware_brand" },
  { text: "Does it make software?", tag: "software_brand" },

  // --- Objects ---
  { text: "Is it an electronic device?", tag: "electronic" },
  { text: "Is it a piece of furniture?", tag: "furniture" },
  { text: "Is it an item of clothing?", tag: "clothing" },
  { text: "Is it a tool?", tag: "tool" },
  { text: "Is it a kitchen item?", tag: "kitchen" },
  { text: "Is it an office or school item?", tag: "office" },
  { text: "Is it food or drink?", tag: "food" },
  { text: "Is it small (portable)?", tag: "small_object" },
  { text: "Is it large?", tag: "large_object" },
  { text: "Is it portable?", tag: "portable" },
  { text: "Does it have a screen?", tag: "screen" },
  { text: "Does it use electricity?", tag: "electric" },
  { text: "Is it soft?", tag: "soft" },
  { text: "Is it sharp?", tag: "sharp" },
  { text: "Is it a household item?", tag: "household" },
  { text: "Is it something you wear?", tag: "wearable" },

  // --- Sports ---
  { text: "Is it a team sport?", tag: "team_sport" },
  { text: "Is it an individual sport?", tag: "individual_sport" },
  { text: "Is it a ball sport?", tag: "ball_sport" },
  { text: "Is it an Olympic sport?", tag: "olympic" },
  { text: "Is it a water sport?", tag: "water_sport" },
  { text: "Is it a winter sport?", tag: "winter_sport" },
  { text: "Is it a contact or combat sport?", tag: "contact" },
  { text: "Is it played indoors?", tag: "indoor_sport" },
  { text: "Is it played outdoors?", tag: "outdoor_sport" },
  { text: "Is it a motorsport?", tag: "motorsport" },
  { text: "Is it a globally popular sport?", tag: "popular_sport" },
];

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ------------------------------------------------------------
// Seed runner
// ------------------------------------------------------------

async function seed() {
  console.log("Seeding GUESS MY ANYTHING...");

  // Wipe (order matters for FK constraints)
  await db.entityTag.deleteMany();
  await db.question.deleteMany();
  await db.learning.deleteMany();
  await db.gameResult.deleteMany();
  await db.gameSession.deleteMany();
  await db.feedback.deleteMany();
  await db.entity.deleteMany();
  await db.tag.deleteMany();
  await db.subcategory.deleteMany();
  await db.category.deleteMany();
  await db.setting.deleteMany();

  const tagMap = new Map<string, string>(); // slug -> id

  // 1. Categories + subcategories
  let catOrder = 0;
  for (const cat of CATEGORIES) {
    const category = await db.category.create({
      data: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        icon: cat.icon,
        color: cat.color,
        sortOrder: catOrder++,
      },
    });

    const subMap = new Map<string, string>();
    let subOrder = 0;
    for (const sub of cat.subs) {
      const s = await db.subcategory.create({
        data: {
          name: sub.name,
          slug: sub.slug,
          categoryId: category.id,
          sortOrder: subOrder++,
        },
      });
      subMap.set(sub.slug, s.id);
    }

    // 2. Entities + tags
    for (const e of cat.entities) {
      // ensure tags exist
      const tagIds: string[] = [];
      const tagSlugs: string[] = [];
      for (const t of e.tags) {
        const slug = slugify(t);
        if (!tagMap.has(slug)) {
          const created = await db.tag.create({ data: { name: t, slug } });
          tagMap.set(slug, created.id);
        }
        tagIds.push(tagMap.get(slug)!);
        tagSlugs.push(slug);
      }

      const entity = await db.entity.create({
        data: {
          name: e.name,
          slug: slugify(e.name),
          description: e.description ?? null,
          categoryId: category.id,
          subcategoryId: e.sub ? subMap.get(e.sub) ?? null : null,
          difficulty: e.difficulty ?? 1,
          popularity: e.popularity ?? 50,
          tagCache: tagSlugs.join(","),
        },
      });

      // link tags
      for (let i = 0; i < tagIds.length; i++) {
        await db.entityTag.create({
          data: { entityId: entity.id, tagId: tagIds[i], weight: 1.0 },
        });
      }
    }
  }

  console.log(`Created ${CATEGORIES.length} categories.`);

  // 3. Questions
  let qCount = 0;
  for (const q of QUESTIONS) {
    const slug = slugify(q.tag);
    if (!tagMap.has(slug)) {
      // Create the tag if a question references a tag no entity has (still useful
      // as a "distinguishing" question once entities gain it).
      const created = await db.tag.create({ data: { name: q.tag, slug } });
      tagMap.set(slug, created.id);
    }
    let categoryId: string | null = null;
    if (q.category) {
      const c = await db.category.findUnique({ where: { slug: q.category } });
      categoryId = c?.id ?? null;
    }
    await db.question.create({
      data: {
        text: q.text,
        primaryTagId: tagMap.get(slug)!,
        categoryId,
        inverted: q.inverted ?? false,
        sortOrder: qCount,
      },
    });
    qCount++;
  }
  console.log(`Created ${qCount} questions.`);

  // 4. Default settings
  const settings = [
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
    { key: "siteTagline", value: "Think of anything. I'll guess it.", type: "string", group: "site", label: "Tagline" },
    { key: "siteDescription", value: "A modern AI-powered guessing game. Think of anything — a job, character, animal, country, movie, and more — and the AI will guess it through intelligent questions.", type: "string", group: "site", label: "Description" },
    { key: "seoKeywords", value: "guessing game, akinator, ai game, think of anything, 20 questions", type: "string", group: "seo", label: "SEO keywords" },
    { key: "socialShareEnabled", value: "true", type: "boolean", group: "site", label: "Enable social sharing" },
    { key: "soundEnabled", value: "true", type: "boolean", group: "site", label: "Sound enabled by default" },
  ];
  for (const s of settings) {
    await db.setting.create({ data: s });
  }
  console.log(`Created ${settings.length} settings.`);

  const entityCount = await db.entity.count();
  const tagCount = await db.tag.count();
  console.log(`Done. Entities: ${entityCount}, Tags: ${tagCount}, Questions: ${qCount}`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
