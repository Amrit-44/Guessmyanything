import { LegalPage } from "@/components/legal-page";
import { Link } from "wouter";

export default function BlogGuessAnimalStrategies() {
  return (
    <LegalPage title="Animal Guessing Strategies: How to Stump the AI">
      <p>The <Link href="/category/animals" className="text-indigo-600 hover:underline">Guess the Animal</Link> mode covers 151+ species. Here's how the engine approaches the problem — and which animals are hardest to guess.</p>
      <h2 className="text-xl font-bold text-black mt-8 mb-3">Tag attributes used</h2>
      <p>Every animal is tagged with: class (mammal, bird, reptile, fish, insect…), habitat (ocean, forest, desert, savanna…), diet (carnivore, herbivore, omnivore), size (tiny, small, medium, large, huge), domestication, endangered status, and signature traits (venomous, nocturnal, egg-laying, etc.).</p>
      <h2 className="text-xl font-bold text-black mt-8 mb-3">Easiest animals to guess</h2>
      <p>Dogs, cats, lions, elephants, and dolphins — these are heavily tagged, well-known, and easy to discriminate. The AI typically guesses them in 8–12 questions.</p>
      <h2 className="text-xl font-bold text-black mt-8 mb-3">Hardest animals to guess</h2>
      <p>Blobfish, axolotl, platypus, and pangolin are the hardest — they share few tags with common animals and often require 18–20 questions. The platypus in particular confounds the mammal/egg-laying axis.</p>
      <h2 className="text-xl font-bold text-black mt-8 mb-3">Tips for testing the engine</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Pick an unusual habitat (deep sea, polar) — these narrow the field fast</li>
        <li>Pick an animal with unusual diet (filter-feeder, detritivore)</li>
        <li>Try a domesticated exotic (alpaca, emu, bison)</li>
      </ul>
    </LegalPage>
  );
}
