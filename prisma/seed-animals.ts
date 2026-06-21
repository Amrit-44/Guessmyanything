/**
 * ANIMALS MASTER SEED — 120+ animals with 8-dimension tag system.
 * Only touches animals category. Does NOT modify any other data.
 * Run: bun run prisma/seed-animals.ts
 */
import { db } from "../src/lib/db";

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

interface Animal {
  name: string;
  description: string;
  tags: string[];
  popularity: number;
}

// Helper to build tag list concisely
function a(name: string, desc: string, tags: string[], pop: number): Animal {
  return { name, description: desc, tags: ["animal", ...tags], popularity: pop };
}

const ANIMALS: Animal[] = [
  // === MAMMALS ===
  a("African Elephant", "The largest land animal, native to Africa.", ["mammal", "africa", "herbivore", "massive", "average", "land", "wild", "zoo_common", "skin", "tusks", "loud_vocalization", "trunk"], 90),
  a("Asian Elephant", "Large elephant species native to Asia.", ["mammal", "asia", "herbivore", "massive", "average", "land", "wild", "zoo_common", "skin", "tusks"], 75),
  a("Lion", "The king of the jungle, a large African big cat.", ["mammal", "africa", "carnivore", "large", "fast", "land", "wild", "zoo_common", "fur", "claws", "loud_vocalization", "mane"], 95),
  a("Tiger", "The largest cat species, striped and fierce.", ["mammal", "asia", "carnivore", "large", "very_fast", "land", "wild", "zoo_common", "fur", "claws", "camouflage"], 92),
  a("Leopard", "Spotted big cat known for climbing trees.", ["mammal", "africa", "asia", "carnivore", "medium", "very_fast", "land", "tree_dwelling", "wild", "zoo_common", "fur", "claws", "camouflage"], 78),
  a("Cheetah", "The fastest land animal.", ["mammal", "africa", "carnivore", "medium", "very_fast", "land", "wild", "zoo_common", "fur", "claws"], 85),
  a("Jaguar", "Powerful spotted big cat of the Americas.", ["mammal", "south_america", "carnivore", "large", "fast", "land", "tree_dwelling", "wild", "zoo_common", "fur", "claws", "camouflage"], 72),
  a("Grizzly Bear", "Large brown bear of North America.", ["mammal", "north_america", "omnivore", "massive", "fast", "land", "wild", "zoo_common", "fur", "claws"], 78),
  a("Polar Bear", "White bear of the Arctic.", ["mammal", "antarctica", "carnivore", "massive", "fast", "land", "semi_aquatic", "wild", "zoo_common", "fur", "swims_well", "claws"], 82),
  a("Panda Bear", "Black and white bear that eats bamboo.", ["mammal", "asia", "herbivore", "large", "slow", "land", "tree_dwelling", "wild", "zoo_common", "fur", "camouflage"], 90),
  a("Sloth Bear", "Bear species of South Asia that eats ants.", ["mammal", "asia", "insectivore", "medium", "average", "land", "wild", "fur", "claws"], 45),
  a("Wolf", "Wild ancestor of dogs, pack hunter.", ["mammal", "north_america", "europe", "asia", "carnivore", "medium", "fast", "land", "wild", "fur", "claws", "loud_vocalization"], 80),
  a("Fox", "Small cunning canine.", ["mammal", "north_america", "europe", "asia", "omnivore", "small", "fast", "land", "wild", "fur", "camouflage"], 65),
  a("Coyote", "Wild dog of the Americas.", ["mammal", "north_america", "omnivore", "medium", "fast", "land", "wild", "fur"], 50),
  a("Hyena", "Laughing scavenger of Africa.", ["mammal", "africa", "carnivore", "medium", "average", "land", "wild", "zoo_common", "fur", "loud_vocalization"], 60),
  a("Giraffe", "Tallest animal with a long neck.", ["mammal", "africa", "herbivore", "massive", "average", "land", "wild", "zoo_common", "skin", "loud_vocalization"], 88),
  a("Zebra", "Striped African equine.", ["mammal", "africa", "herbivore", "large", "fast", "land", "wild", "zoo_common", "fur", "camouflage"], 82),
  a("Hippopotamus", "Large semi-aquatic African mammal.", ["mammal", "africa", "herbivore", "massive", "average", "semi_aquatic", "wild", "zoo_common", "skin", "swims_well"], 75),
  a("Rhinoceros", "Large armored herbivore with one or two horns.", ["mammal", "africa", "asia", "herbivore", "massive", "average", "land", "wild", "zoo_common", "skin", "horns"], 76),
  a("Cape Buffalo", "Large dangerous African bovine.", ["mammal", "africa", "herbivore", "large", "fast", "land", "wild", "zoo_common", "fur", "horns"], 55),
  a("Bison", "Large North American bovine.", ["mammal", "north_america", "herbivore", "massive", "average", "land", "wild", "zoo_common", "fur", "horns"], 60),
  a("Moose", "Largest deer species.", ["mammal", "north_america", "europe", "asia", "herbivore", "large", "average", "land", "wild", "fur", "horns"], 58),
  a("Elk", "Large deer species of North America.", ["mammal", "north_america", "asia", "herbivore", "large", "fast", "land", "wild", "fur", "horns"], 55),
  a("Deer", "Common graceful herbivore.", ["mammal", "north_america", "europe", "asia", "herbivore", "medium", "fast", "land", "wild", "zoo_common", "fur"], 60),
  a("Reindeer", "Arctic deer with antlers.", ["mammal", "antarctica", "north_america", "europe", "herbivore", "large", "average", "land", "wild", "fur", "horns"], 65),
  a("Camel", "Desert ship, humped mammal.", ["mammal", "asia", "africa", "herbivore", "large", "average", "land", "domesticated", "farmed", "zoo_common", "fur"], 70),
  a("Llama", "South American camelid.", ["mammal", "south_america", "herbivore", "medium", "average", "land", "domesticated", "farmed", "fur"], 50),
  a("Alpaca", "Fluffy South American camelid.", ["mammal", "south_america", "herbivore", "medium", "average", "land", "domesticated", "farmed", "fur"], 52),
  a("Kangaroo", "Marsupial that hops and carries babies.", ["mammal", "australia", "herbivore", "medium", "fast", "land", "wild", "zoo_common", "fur"], 85),
  a("Koala", "Australian marsupial that eats eucalyptus.", ["mammal", "australia", "herbivore", "small", "slow", "tree_dwelling", "wild", "zoo_common", "fur"], 80),
  a("Wombat", "Burrowing Australian marsupial.", ["mammal", "australia", "herbivore", "medium", "average", "land", "wild", "zoo_common", "fur"], 45),
  a("Tasmanian Devil", "Small fierce marsupial from Tasmania.", ["mammal", "australia", "carnivore", "small", "average", "land", "wild", "zoo_common", "fur", "loud_vocalization"], 48),
  a("Platypus", "Egg-laying mammal with a duck bill.", ["mammal", "australia", "carnivore", "small", "average", "semi_aquatic", "wild", "zoo_common", "fur", "swims_well"], 60),
  a("Echidna", "Spiny egg-laying mammal.", ["mammal", "australia", "insectivore", "small", "slow", "land", "wild", "zoo_common", "fur", "claws"], 42),
  a("Gorilla", "Largest primate, silverback leader.", ["mammal", "africa", "herbivore", "large", "average", "land", "wild", "zoo_common", "fur"], 78),
  a("Chimpanzee", "Intelligent primate closest to humans.", ["mammal", "africa", "omnivore", "medium", "fast", "tree_dwelling", "land", "wild", "zoo_common", "fur"], 75),
  a("Orangutan", "Red-haired Asian ape.", ["mammal", "asia", "herbivore", "large", "slow", "tree_dwelling", "wild", "zoo_common", "fur"], 65),
  a("Baboon", "Large ground-dwelling monkey.", ["mammal", "africa", "omnivore", "medium", "average", "land", "wild", "zoo_common", "fur"], 55),
  a("Lemur", "Small primate from Madagascar.", ["mammal", "africa", "omnivore", "small", "fast", "tree_dwelling", "wild", "zoo_common", "fur", "loud_vocalization", "camouflage"], 58),
  a("Sloth", "Slow-moving tree dweller.", ["mammal", "south_america", "herbivore", "medium", "slow", "tree_dwelling", "wild", "fur", "camouflage", "claws"], 60),
  a("Anteater", "Long-nosed insect eater.", ["mammal", "south_america", "insectivore", "medium", "average", "land", "wild", "fur", "claws"], 45),
  a("Armadillo", "Armored mammal with a shell.", ["mammal", "south_america", "north_america", "insectivore", "small", "average", "land", "wild", "shell", "claws", "camouflage"], 52),
  a("Pangolin", "Scaly anteater, heavily trafficked.", ["mammal", "asia", "africa", "insectivore", "small", "slow", "land", "wild", "scales", "camouflage", "claws"], 40),
  a("Hedgehog", "Small spiny mammal.", ["mammal", "europe", "asia", "africa", "insectivore", "small", "slow", "land", "wild", "fur", "spines", "camouflage"], 55),
  a("Porcupine", "Rodent with protective quills.", ["mammal", "north_america", "south_america", "asia", "africa", "herbivore", "medium", "slow", "land", "wild", "fur", "quills", "claws", "camouflage"], 48),
  a("Beaver", "Dam-building rodent.", ["mammal", "north_america", "europe", "asia", "herbivore", "medium", "average", "semi_aquatic", "wild", "fur", "swims_well", "tail"], 62),
  a("Otter", "Playful aquatic mammal.", ["mammal", "north_america", "europe", "asia", "south_america", "carnivore", "small", "average", "semi_aquatic", "wild", "zoo_common", "fur", "swims_well"], 68),
  a("Seal", "Aquatic mammal with flippers.", ["mammal", "antarctica", "north_america", "carnivore", "large", "average", "semi_aquatic", "wild", "zoo_common", "skin", "swims_well"], 60),
  a("Sea Lion", "Eared seal that can walk on land.", ["mammal", "north_america", "south_america", "carnivore", "large", "average", "semi_aquatic", "wild", "zoo_common", "skin", "swims_well"], 55),
  a("Walrus", "Large tusked marine mammal.", ["mammal", "antarctica", "carnivore", "massive", "average", "semi_aquatic", "wild", "zoo_common", "skin", "swims_well", "tusks"], 62),
  a("Dolphin", "Intelligent marine mammal.", ["mammal", "ocean", "carnivore", "large", "very_fast", "water", "wild", "zoo_common", "skin", "swims_well", "loud_vocalization"], 88),
  a("Orca", "Largest dolphin species, black and white.", ["mammal", "ocean", "carnivore", "massive", "very_fast", "water", "wild", "zoo_common", "skin", "swims_well", "loud_vocalization"], 82),
  a("Blue Whale", "Largest animal on Earth.", ["mammal", "ocean", "carnivore", "massive", "fast", "water", "wild", "zoo_common", "skin", "swims_well", "loud_vocalization"], 90),
  a("Humpback Whale", "Large baleen whale known for breaching.", ["mammal", "ocean", "carnivore", "massive", "fast", "water", "wild", "zoo_common", "skin", "swims_well", "loud_vocalization"], 75),
  a("Sperm Whale", "Large toothed whale that dives deep.", ["mammal", "ocean", "carnivore", "massive", "fast", "water", "wild", "zoo_common", "skin", "swims_well", "loud_vocalization"], 68),

  // === BIRDS ===
  a("Bald Eagle", "National bird of the USA.", ["bird", "north_america", "carnivore", "large", "very_fast", "air", "wild", "zoo_common", "feathers", "flight", "claws"], 85),
  a("Golden Eagle", "Large powerful eagle.", ["bird", "north_america", "europe", "asia", "carnivore", "large", "very_fast", "air", "wild", "feathers", "flight", "claws"], 65),
  a("Peregrine Falcon", "Fastest bird in a dive.", ["bird", "north_america", "europe", "asia", "africa", "carnivore", "medium", "very_fast", "air", "wild", "feathers", "flight"], 70),
  a("Hawk", "Common bird of prey.", ["bird", "north_america", "europe", "asia", "carnivore", "medium", "fast", "air", "wild", "feathers", "flight"], 55),
  a("Great Horned Owl", "Large nocturnal bird of prey.", ["bird", "north_america", "europe", "asia", "carnivore", "medium", "average", "air", "tree_dwelling", "wild", "feathers", "flight", "camouflage"], 65),
  a("Vulture", "Scavenging bird with a bald head.", ["bird", "north_america", "europe", "asia", "africa", "carnivore", "large", "average", "air", "wild", "feathers", "flight", "camouflage"], 55),
  a("Albatross", "Seabird with the longest wingspan.", ["bird", "ocean", "carnivore", "large", "average", "air", "wild", "feathers", "flight"], 50),
  a("Emperor Penguin", "Largest penguin, lives in Antarctica.", ["bird", "antarctica", "carnivore", "medium", "average", "semi_aquatic", "wild", "zoo_common", "feathers", "swims_well", "camouflage"], 78),
  a("Ostrich", "Largest living bird, flightless.", ["bird", "africa", "omnivore", "massive", "very_fast", "land", "wild", "zoo_common", "feathers"], 72),
  a("Emu", "Large Australian flightless bird.", ["bird", "australia", "omnivore", "massive", "fast", "land", "wild", "zoo_common", "feathers"], 55),
  a("Cassowary", "Dangerous flightless bird with claws.", ["bird", "australia", "asia", "omnivore", "large", "fast", "land", "wild", "feathers", "claws"], 52),
  a("Peacock", "Bird famous for its beautiful tail.", ["bird", "asia", "omnivore", "large", "average", "land", "wild", "zoo_common", "feathers", "loud_vocalization", "camouflage"], 70),
  a("Flamingo", "Pink wading bird that stands on one leg.", ["bird", "africa", "south_america", "north_america", "omnivore", "large", "average", "semi_aquatic", "wild", "zoo_common", "feathers", "camouflage"], 72),
  a("Pelican", "Large water bird with a pouch.", ["bird", "north_america", "europe", "africa", "carnivore", "large", "average", "semi_aquatic", "wild", "feathers", "flight", "swims_well"], 55),
  a("Macaw", "Colorful tropical parrot.", ["bird", "south_america", "omnivore", "small", "average", "air", "tree_dwelling", "wild", "zoo_common", "feathers", "flight", "loud_vocalization", "camouflage"], 65),
  a("Toucan", "Bird with a huge colorful bill.", ["bird", "south_america", "omnivore", "small", "average", "air", "tree_dwelling", "wild", "zoo_common", "feathers", "flight", "camouflage"], 68),
  a("Hummingbird", "Tiny bird that hovers and drinks nectar.", ["bird", "north_america", "south_america", "omnivore", "tiny", "very_fast", "air", "wild", "feathers", "flight"], 72),
  a("Woodpecker", "Bird that drums on trees.", ["bird", "north_america", "europe", "asia", "insectivore", "small", "average", "air", "tree_dwelling", "wild", "feathers", "flight"], 55),
  a("Crow", "Highly intelligent black bird.", ["bird", "north_america", "europe", "asia", "omnivore", "small", "fast", "air", "wild", "feathers", "flight", "loud_vocalization"], 58),
  a("Raven", "Large black bird, smarter than crows.", ["bird", "north_america", "europe", "asia", "omnivore", "medium", "fast", "air", "wild", "feathers", "flight", "loud_vocalization"], 50),
  a("Swan", "Elegant white water bird.", ["bird", "north_america", "europe", "asia", "omnivore", "large", "average", "semi_aquatic", "wild", "zoo_common", "feathers", "flight", "swims_well"], 62),
  a("Goose", "Common waterfowl that honks.", ["bird", "north_america", "europe", "asia", "herbivore", "medium", "fast", "semi_aquatic", "wild", "farmed", "feathers", "flight", "swims_well", "loud_vocalization"], 60),
  a("Duck", "Common quacking waterfowl.", ["bird", "north_america", "europe", "asia", "omnivore", "small", "fast", "semi_aquatic", "wild", "farmed", "feathers", "flight", "swims_well", "loud_vocalization"], 75),
  a("Chicken", "Common farm bird that lays eggs.", ["bird", "north_america", "europe", "asia", "herbivore", "small", "slow", "land", "farmed", "feathers", "loud_vocalization"], 85),
  a("Turkey", "Large farm bird for meat.", ["bird", "north_america", "europe", "omnivore", "large", "average", "land", "farmed", "feathers", "loud_vocalization"], 72),

  // === REPTILES & AMPHIBIANS ===
  a("Saltwater Crocodile", "Largest living reptile, aggressive.", ["reptile", "asia", "africa", "australia", "carnivore", "massive", "average", "semi_aquatic", "wild", "scales", "swims_well", "claws", "venomous_bite"], 70),
  a("American Alligator", "Large American crocodilian.", ["reptile", "north_america", "carnivore", "large", "average", "semi_aquatic", "wild", "scales", "swims_well", "claws"], 68),
  a("Komodo Dragon", "Largest lizard, venomous bite.", ["reptile", "asia", "carnivore", "large", "fast", "land", "wild", "zoo_common", "scales", "claws", "venomous_bite"], 72),
  a("Green Anaconda", "Largest snake by weight.", ["reptile", "south_america", "carnivore", "massive", "slow", "semi_aquatic", "wild", "zoo_common", "scales", "swims_well", "camouflage"], 70),
  a("Reticulated Python", "Long snake with beautiful patterns.", ["reptile", "asia", "carnivore", "large", "average", "land", "wild", "zoo_common", "scales", "swims_well", "camouflage"], 55),
  a("King Cobra", "Long venomous snake that eats other snakes.", ["reptile", "asia", "carnivore", "large", "fast", "land", "wild", "zoo_common", "scales", "venomous_bite"], 72),
  a("Black Mamba", "Extremely fast and venomous snake.", ["reptile", "africa", "carnivore", "medium", "very_fast", "land", "wild", "scales", "venomous_bite", "camouflage"], 68),
  a("Rattlesnake", "Rattling venomous pit viper.", ["reptile", "north_america", "carnivore", "medium", "average", "land", "wild", "scales", "venomous_bite", "camouflage", "loud_vocalization"], 65),
  a("Gila Monster", "Venomous lizard with bead-like scales.", ["reptile", "north_america", "carnivore", "medium", "slow", "land", "wild", "scales", "venomous_bite", "camouflage"], 45),
  a("Marine Iguana", "Unique lizard that forages in the sea.", ["reptile", "south_america", "herbivore", "medium", "average", "semi_aquatic", "wild", "scales", "swims_well", "camouflage"], 40),
  a("Green Sea Turtle", "Large sea turtle with a shell.", ["reptile", "ocean", "herbivore", "large", "average", "water", "wild", "scales", "shell", "swims_well"], 65),
  a("Leatherback Turtle", "Largest sea turtle, leathery shell.", ["reptile", "ocean", "carnivore", "massive", "average", "water", "wild", "scales", "shell", "swims_well"], 55),
  a("Galapagos Tortoise", "Giant tortoise from Galapagos.", ["reptile", "south_america", "herbivore", "large", "slow", "land", "wild", "zoo_common", "scales", "shell"], 68),
  a("Red-Eyed Tree Frog", "Colorful tree frog with red eyes.", ["amphibian", "south_america", "carnivore", "tiny", "average", "tree_dwelling", "wild", "zoo_common", "skin", "camouflage"], 65),
  a("Poison Dart Frog", "Tiny but deadly poisonous frog.", ["amphibian", "south_america", "carnivore", "tiny", "average", "tree_dwelling", "wild", "zoo_common", "skin", "poisonous", "camouflage"], 62),
  a("Axolotl", "Salamander that never grows up.", ["amphibian", "north_america", "carnivore", "tiny", "slow", "water", "wild", "zoo_common", "skin", "swims_well", "camouflage"], 58),

  // === FISH & MARINE LIFE ===
  a("Great White Shark", "Apex predator of the ocean.", ["fish", "ocean", "carnivore", "massive", "very_fast", "water", "wild", "zoo_common", "scales", "swims_well", "claws"], 92),
  a("Hammerhead Shark", "Shark with a hammer-shaped head.", ["fish", "ocean", "carnivore", "large", "fast", "water", "wild", "scales", "swims_well"], 60),
  a("Whale Shark", "Largest fish, gentle filter feeder.", ["fish", "ocean", "omnivore", "massive", "average", "water", "wild", "scales", "swims_well"], 65),
  a("Manta Ray", "Large ray that glides through water.", ["fish", "ocean", "carnivore", "massive", "average", "water", "wild", "skin", "swims_well"], 52),
  a("Stingray", "Flat fish with a venomous tail barb.", ["fish", "ocean", "carnivore", "medium", "average", "semi_aquatic", "wild", "skin", "swims_well", "venomous_sting", "camouflage"], 55),
  a("Clownfish", "Orange clown fish from coral reefs.", ["fish", "ocean", "omnivore", "tiny", "average", "water", "wild", "zoo_common", "scales", "swims_well", "camouflage"], 80),
  a("Blue Tang", "Blue tropical fish with a memory problem.", ["fish", "ocean", "omnivore", "tiny", "average", "water", "wild", "zoo_common", "scales", "swims_well", "camouflage"], 65),
  a("Lionfish", "Striped venomous reef fish.", ["fish", "ocean", "carnivore", "small", "slow", "water", "wild", "scales", "swims_well", "venomous_sting", "camouflage"], 45),
  a("Pufferfish", "Fish that puffs up when scared.", ["fish", "ocean", "carnivore", "small", "slow", "water", "wild", "scales", "swims_well", "poisonous", "camouflage"], 60),
  a("Anglerfish", "Deep sea fish with a glowing lure.", ["fish", "ocean", "carnivore", "small", "slow", "water", "wild", "skin", "swims_well", "bioluminescent", "camouflage"], 55),
  a("Octopus", "Highly intelligent eight-armed creature.", ["cephalopod", "ocean", "carnivore", "small", "fast", "water", "wild", "zoo_common", "skin", "swims_well", "camouflage"], 82),
  a("Giant Squid", "Giant deep-sea squid with huge eyes.", ["cephalopod", "ocean", "carnivore", "massive", "average", "water", "wild", "skin", "swims_well"], 60),
  a("Jellyfish", "Gelatinous drifting sea creature.", ["invertebrate", "ocean", "carnivore", "small", "slow", "water", "wild", "skin", "swims_well", "venomous_sting"], 55),
  a("Seahorse", "Tiny fish that swims upright.", ["fish", "ocean", "carnivore", "tiny", "slow", "water", "wild", "zoo_common", "scales", "swims_well", "camouflage"], 58),
  a("Moray Eel", "Long snake-like reef fish.", ["fish", "ocean", "carnivore", "medium", "average", "water", "wild", "scales", "swims_well", "camouflage"], 45),

  // === INSECTS & OTHERS ===
  a("Honey Bee", "Social insect that makes honey.", ["insect", "north_america", "europe", "asia", "africa", "herbivore", "tiny", "fast", "air", "wild", "exoskeleton", "flight", "venomous_sting", "loud_vocalization"], 78),
  a("Bumblebee", "Fuzzy flying insect.", ["insect", "north_america", "europe", "asia", "herbivore", "tiny", "fast", "air", "wild", "exoskeleton", "flight", "venomous_sting"], 60),
  a("Monarch Butterfly", "Orange butterfly that migrates.", ["insect", "north_america", "herbivore", "tiny", "average", "air", "wild", "exoskeleton", "flight", "camouflage"], 72),
  a("Atlas Moth", "Large moth with beautiful wings.", ["insect", "asia", "herbivore", "small", "average", "air", "wild", "exoskeleton", "flight", "camouflage"], 45),
  a("Dragonfly", "Fast insect with four wings.", ["insect", "north_america", "europe", "asia", "carnivore", "tiny", "very_fast", "air", "wild", "exoskeleton", "flight"], 55),
  a("Praying Mantis", "Predatory insect that folds its legs.", ["insect", "north_america", "europe", "asia", "africa", "carnivore", "small", "slow", "land", "wild", "exoskeleton", "camouflage"], 52),
  a("Stick Insect", "Insect that looks like a twig.", ["insect", "asia", "herbivore", "small", "slow", "tree_dwelling", "wild", "exoskeleton", "camouflage"], 35),
  a("Goliath Beetle", "World's heaviest beetle.", ["insect", "africa", "herbivore", "small", "slow", "land", "wild", "exoskeleton", "claws"], 40),
  a("Tarantula", "Large hairy spider.", ["arachnid", "north_america", "south_america", "carnivore", "small", "slow", "land", "wild", "exoskeleton", "venomous_bite", "camouflage"], 65),
  a("Black Widow Spider", "Small spider with a red hourglass mark.", ["arachnid", "north_america", "europe", "asia", "carnivore", "tiny", "slow", "land", "wild", "exoskeleton", "venomous_bite", "camouflage"], 60),
  a("Scorpion", "Arachnid with a venomous tail stinger.", ["arachnid", "north_america", "europe", "asia", "africa", "carnivore", "small", "slow", "land", "wild", "exoskeleton", "venomous_sting", "camouflage"], 58),
  a("Centipede", "Many-legged crawling creature.", ["arthropod", "north_america", "europe", "asia", "carnivore", "small", "fast", "land", "wild", "exoskeleton", "venomous_bite"], 45),
  a("Lobster", "Large crustacean with claws.", ["crustacean", "ocean", "carnivore", "small", "slow", "water", "wild", "exoskeleton", "shell", "swims_well", "claws"], 60),
  a("Crab", "Hard-shelled crustacean that walks sideways.", ["crustacean", "ocean", "carnivore", "small", "slow", "semi_aquatic", "wild", "exoskeleton", "shell", "swims_well", "claws", "camouflage"], 55),
  a("Snail", "Slow creature that carries its shell.", ["gastropod", "north_america", "europe", "asia", "herbivore", "tiny", "slow", "land", "wild", "shell", "camouflage"], 50),
  a("Earthworm", "Segmented worm that lives in soil.", ["annelid", "north_america", "europe", "asia", "herbivore", "tiny", "slow", "land", "wild", "skin"], 45),

  // === DOMESTICATED ===
  a("Dog", "Man's best friend.", ["mammal", "north_america", "europe", "asia", "omnivore", "medium", "fast", "land", "domesticated", "pet", "fur", "claws", "loud_vocalization"], 98),
  a("Cat", "Common house pet and skilled hunter.", ["mammal", "north_america", "europe", "asia", "carnivore", "small", "fast", "land", "domesticated", "pet", "fur", "claws"], 96),
  a("Horse", "Domesticated rideable animal.", ["mammal", "north_america", "europe", "asia", "herbivore", "large", "very_fast", "land", "domesticated", "farmed", "fur", "tail"], 90),
  a("Cow", "Farm animal raised for milk and meat.", ["mammal", "north_america", "europe", "asia", "herbivore", "large", "slow", "land", "farmed", "skin"], 88),
  a("Pig", "Pink farm animal that oinks.", ["mammal", "north_america", "europe", "asia", "omnivore", "medium", "average", "land", "farmed", "skin", "loud_vocalization"], 82),
  a("Sheep", "Wooly farm animal.", ["mammal", "north_america", "europe", "asia", "herbivore", "medium", "slow", "land", "farmed", "fur", "camouflage"], 75),
  a("Goat", "Farm animal that eats anything.", ["mammal", "north_america", "europe", "asia", "herbivore", "medium", "average", "land", "farmed", "fur", "claws", "horns"], 70),
  a("Donkey", "Long-eared beast of burden.", ["mammal", "north_america", "europe", "asia", "africa", "herbivore", "medium", "average", "land", "domesticated", "farmed", "fur", "loud_vocalization"], 65),
  a("Rabbit", "Small hopping pet with long ears.", ["mammal", "north_america", "europe", "asia", "herbivore", "small", "fast", "land", "domesticated", "pet", "fur", "claws"], 80),
  a("Hamster", "Tiny rodent kept as a pet.", ["mammal", "north_america", "europe", "asia", "omnivore", "tiny", "fast", "land", "domesticated", "pet", "fur"], 72),
];

// Map tags to human-friendly questions
const QUESTION_MAP: Record<string, string> = {
  carnivore: "Does it eat meat?",
  herbivore: "Does it eat plants?",
  omnivore: "Does it eat both plants and meat?",
  piscivore: "Does it mainly eat fish?",
  insectivore: "Does it eat insects?",
  africa: "Does it live in Africa?",
  asia: "Does it live in Asia?",
  north_america: "Does it live in North America?",
  south_america: "Does it live in South America?",
  europe: "Does it live in Europe?",
  australia: "Does it live in Australia?",
  antarctica: "Does it live in cold Arctic or Antarctic regions?",
  ocean: "Does it live in the ocean?",
  massive: "Is it very large in size (like a car or bigger)?",
  large: "Is it bigger than a human?",
  medium: "Is it around the size of a dog?",
  small: "Is it small enough to fit in a backpack?",
  tiny: "Is it smaller than your hand?",
  slow: "Is it slow-moving?",
  average: "",
  fast: "Is it fast?",
  very_fast: "Is it one of the fastest animals?",
  land: "Does it live on land?",
  water: "Does it live in water?",
  air: "Can it fly?",
  semi_aquatic: "Does it spend time both on land and in water?",
  tree_dwelling: "Does it live in trees?",
  wild: "Does it live in the wild?",
  domesticated: "Is it a common pet or farm animal?",
  farmed: "Is it raised on farms?",
  pet: "Is it commonly kept as a pet?",
  zoo_common: "Is it commonly found in zoos?",
  fur: "Does it have fur or hair?",
  feathers: "Does it have feathers?",
  scales: "Does it have scales?",
  skin: "Does it have mostly bare skin (no fur/feathers/scales)?",
  shell: "Does it have a shell?",
  exoskeleton: "Does it have a hard outer skeleton (exoskeleton)?",
  venomous_bite: "Does it have a venomous bite?",
  venomous_sting: "Does it have a venomous sting?",
  poisonous: "Is it poisonous to touch or eat?",
  flight: "Can it fly?",
  swims_well: "Is it a good swimmer?",
  camouflage: "Is it good at camouflage?",
  loud_vocalization: "Is it known for loud sounds?",
  horns: "Does it have horns?",
  tusks: "Does it have tusks?",
  claws: "Does it have claws?",
  tail: "Does it have a prominent tail?",
  bioluminescent: "Can it glow in the dark?",
  trunk: "Does it have a trunk?",
  mane: "Does the male have a mane?",
  spines: "Does it have spines?",
  quills: "Does it have quills?",
  // Type tags
  mammal: "Is it a mammal?",
  bird: "Is it a bird?",
  reptile: "Is it a reptile?",
  amphibian: "Is it an amphibian?",
  fish: "Is it a fish?",
  insect: "Is it an insect?",
  arachnid: "Is it an arachnid (spider-like)?",
  crustacean: "Is it a crustacean?",
  cephalopod: "Is it a cephalopod (like an octopus)?",
  invertebrate: "Is it an invertebrate?",
  gastropod: "Is it a snail or slug?",
  annelid: "Is it a worm?",
  arthropod: "Is it an arthropod?",
};

async function ensureTag(name: string): Promise<{ id: string; slug: string }> {
  const slug = slugify(name);
  const existing = await db.tag.findUnique({ where: { slug } });
  if (existing) return { id: existing.id, slug };
  const created = await db.tag.create({ data: { name, slug } });
  return { id: created.id, slug };
}

async function main() {
  console.log("=== SEEDING ANIMALS ===\n");
  const cat = await db.category.findUnique({ where: { slug: "animals" } });
  if (!cat) { console.error("Animals category not found!"); process.exit(1); }

  // Add all questions from the question map
  console.log("Adding questions...");
  let qAdded = 0;
  for (const [tag, questionText] of Object.entries(QUESTION_MAP)) {
    if (!questionText) continue; // skip empty mappings
    const existing = await db.question.findFirst({ where: { text: questionText } });
    if (existing) continue;
    const tagRec = await ensureTag(tag);
    await db.question.create({ data: { text: questionText, primaryTagId: tagRec.id, categoryId: cat.id, isActive: true } });
    qAdded++;
  }
  console.log(`  + ${qAdded} questions added`);

  // Add/update animals
  console.log("\nAdding animals...");
  let created = 0, updated = 0;
  for (const animal of ANIMALS) {
    const slug = slugify(animal.name);
    const existing = await db.entity.findUnique({ where: { categoryId_slug: { categoryId: cat.id, slug } } });

    const tagSlugs: string[] = [];
    const tagIds: string[] = [];
    const seenTagIds = new Set<string>();
    for (const tagName of animal.tags) {
      const tag = await ensureTag(tagName);
      if (seenTagIds.has(tag.id)) continue;
      seenTagIds.add(tag.id);
      tagSlugs.push(tag.slug);
      tagIds.push(tag.id);
    }

    if (existing) {
      await db.entityTag.deleteMany({ where: { entityId: existing.id } });
      await db.entityTag.createMany({ data: tagIds.map(id => ({ entityId: existing.id, tagId: id, weight: 1 })) });
      await db.entity.update({ where: { id: existing.id }, data: { description: animal.description, popularity: animal.popularity, tagCache: tagSlugs.join(","), isActive: true } });
      updated++;
    } else {
      await db.entity.create({ data: { name: animal.name, slug, description: animal.description, categoryId: cat.id, popularity: animal.popularity, tagCache: tagSlugs.join(","), tags: { create: tagIds.map(id => ({ tagId: id, weight: 1 })) } } });
      created++;
    }
  }
  console.log(`  Created: ${created}, Updated: ${updated}`);

  const total = await db.entity.count({ where: { categoryId: cat.id, isActive: true } });
  const totalQ = await db.question.count({ where: { categoryId: cat.id, isActive: true } });
  console.log(`\n=== FINAL ===\n  Animals: ${total}\n  Questions: ${totalQ}`);
  await db.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
