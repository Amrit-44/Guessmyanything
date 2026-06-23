import { LegalPage } from "@/components/legal-page";
import { Link } from "wouter";

export default function BlogGuessCountryTips() {
  return (
    <LegalPage title="Country Guessing Tips: How to Stump the AI">
      <p>The <Link href="/category/countries" className="text-indigo-600 hover:underline">Guess the Country</Link> mode covers all 192 UN member states. Here's how the engine works and which countries are hardest to guess.</p>
      <h2 className="text-xl font-bold text-black mt-8 mb-3">Tag attributes used</h2>
      <p>Continent, climate zone, population size, coastline (landlocked vs coastal), primary language family, dominant religion, economic development, and notable features (island, peninsula, monarchy, etc.).</p>
      <h2 className="text-xl font-bold text-black mt-8 mb-3">Easiest countries to guess</h2>
      <p>USA, China, Russia, Australia, and Brazil — large, distinctive countries with many unique tags. Usually guessed in 8–12 questions.</p>
      <h2 className="text-xl font-bold text-black mt-8 mb-3">Hardest countries to guess</h2>
      <p>Small landlocked African nations with similar profiles — Burundi, Rwanda, and Malawi share many tags and require many questions to discriminate. Island microstates (Nauru, Tuvalu) are also tricky.</p>
      <h2 className="text-xl font-bold text-black mt-8 mb-3">Tips for testing the engine</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Pick a landlocked country — this eliminates ~60% of candidates immediately</li>
        <li>Try a micronation or island territory</li>
        <li>Pick a country with an unusual language family (Finnish, Hungarian, Basque)</li>
      </ul>
    </LegalPage>
  );
}
