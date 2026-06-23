import { LegalPage } from "@/components/legal-page";
import { Link } from "wouter";

export default function BlogHowToGuessAnything() {
  return (
    <LegalPage title="How the AI Guessing Engine Works">
      <p>Guess My Anything uses a weighted-scoring engine with information-gain question selection. Here's the full technical story.</p>
      <h2 className="text-xl font-bold text-black mt-8 mb-3">Weighted scoring (not elimination)</h2>
      <p>Every entity starts with the same base score. Each answer adjusts scores based on tag membership — "yes" boosts entities with that tag, "no" penalizes them. Scores never go below zero, so the engine recovers from misclicks and ambiguous answers.</p>
      <h2 className="text-xl font-bold text-black mt-8 mb-3">Information-gain question selection</h2>
      <p>The engine picks the question whose tag best splits the current candidate pool close to 50/50 by score mass. Such questions extract the most information per answer. We also blend in historical effectiveness (win rate + average info gain) so proven questions get a mild boost.</p>
      <h2 className="text-xl font-bold text-black mt-8 mb-3">Strict category locking</h2>
      <p>When you select a category (e.g., Countries), the engine only loads questions tagged for that category. You'll never be asked "Is it a large animal?" while playing Countries mode. Anything mode loads all questions and can narrow from broad to specific.</p>
      <h2 className="text-xl font-bold text-black mt-8 mb-3">Multi-tier confidence threshold</h2>
      <p>The engine won't guess until the top score exceeds the initial score by a confidence factor AND there's a sufficient gap between first and second place. It also enforces a minimum question count (8) and a maximum (28). After max questions, it makes its best guess.</p>
      <h2 className="text-xl font-bold text-black mt-8 mb-3">Multi-guess safety net</h2>
      <p>The engine gets up to 3 guesses per game. After a wrong guess, it marks that entity as guessed and continues narrowing from the remaining candidates.</p>
      <h2 className="text-xl font-bold text-black mt-8 mb-3">Learning from failure</h2>
      <p>When the AI loses, you can tell it the correct answer. The session history is logged for admin review. Admins can add new entities and tag them so future games improve.</p>
      <p>Try it yourself: <Link href="/" className="text-indigo-600 hover:underline">Play Guess My Anything</Link></p>
    </LegalPage>
  );
}
