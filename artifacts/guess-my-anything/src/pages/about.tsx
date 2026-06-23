import { LegalPage } from "@/components/legal-page";
import { Link } from "wouter";

export default function AboutPage() {
  return (
    <LegalPage title="About Guess My Anything">
      <div className="prose prose-sm sm:prose-base max-w-none">
        <p>
          Guess My Anything is a free AI-powered guessing game. Think of a job, country, animal,
          sport, or even your age — then answer up to 20 yes/no questions while our AI narrows it down.
        </p>
        <h2>How it works</h2>
        <p>
          Our engine uses a weighted scoring algorithm. Every entity (job, country, animal, etc.) starts
          with the same score. Each answer adjusts scores based on tag membership. The AI picks questions
          with maximum information gain — the question that best splits the remaining candidates.
        </p>
        <h2>Categories</h2>
        <ul>
          <li><strong>Jobs</strong> — 354+ careers across 16 industries</li>
          <li><strong>Countries</strong> — all 192 UN member states</li>
          <li><strong>Animals</strong> — 151+ species</li>
          <li><strong>Sports</strong> — 180+ sports worldwide</li>
          <li><strong>Age</strong> — life-stage range estimation engine</li>
        </ul>
        <p>
          <Link href="/">← Back to Game</Link>
        </p>
      </div>
    </LegalPage>
  );
}
