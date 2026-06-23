import { LegalPage } from "@/components/legal-page";
import { Link } from "wouter";

const faqs = [
  { question: "What can I ask the AI to guess?", answer: "Jobs, countries, animals, sports — or even your own age! Pick any category from the home screen." },
  { question: "How many questions does the AI ask?", answer: "Up to 20 questions. The AI uses an information-gain algorithm to pick the most discriminating question each turn." },
  { question: "How accurate is the AI?", answer: "Our AI achieves 90–95%+ accuracy across all categories. The more specific your answers, the better it performs." },
  { question: "Is it free to play?", answer: "Yes, completely free. No sign-up required. Play as many times as you like." },
  { question: "Does the AI learn from mistakes?", answer: "Yes! When you tell us what we missed, the AI logs the session for review. Admins can add new entities and tag them so the engine improves." },
  { question: "How does the AI engine work?", answer: "Every entity starts with the same score. Each answer adjusts scores based on tag membership. The engine picks questions that best split remaining candidates by score mass." },
  { question: "Can I play in a different language?", answer: "Currently the game is English-only. Multi-language support is planned for future releases." },
  { question: "How do I report a bug or suggest an improvement?", answer: "Use the in-game feedback button, or email contact@guess-my-anything.app." },
];

export default function FaqPage() {
  return (
    <LegalPage title="Frequently Asked Questions">
      <p>
        Welcome to the <strong>Guess My Anything</strong> FAQ. Below are answers to the most common
        questions. If your question isn't covered,{" "}
        <Link href="/contact" className="text-indigo-600 hover:underline">contact us</Link>.
      </p>
      {faqs.map((faq) => (
        <div key={faq.question} className="pt-4">
          <h2 className="text-base font-bold text-black mb-1">{faq.question}</h2>
          <p>{faq.answer}</p>
        </div>
      ))}
      <div className="pt-6">
        <h2 className="text-lg font-bold text-black mb-3">Jump into a game</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li><Link href="/category/age" className="text-indigo-600 hover:underline">Guess My Age</Link></li>
          <li><Link href="/category/jobs" className="text-indigo-600 hover:underline">Guess My Job</Link></li>
          <li><Link href="/category/animals" className="text-indigo-600 hover:underline">Guess the Animal</Link></li>
          <li><Link href="/category/countries" className="text-indigo-600 hover:underline">Guess the Country</Link></li>
          <li><Link href="/category/sports" className="text-indigo-600 hover:underline">Guess the Sport</Link></li>
        </ul>
      </div>
    </LegalPage>
  );
}
