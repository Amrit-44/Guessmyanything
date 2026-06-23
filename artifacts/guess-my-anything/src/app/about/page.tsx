import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us - Guess My Anything AI Guessing Game",
  description:
    "Learn how Guess My Anything works — an AI-powered guessing game that reads your mind across jobs, countries, animals, sports, and age. Free to play.",
  keywords: [
    "guess my anything",
    "ai guessing game",
    "how does the ai guessing game work",
    "about guessing game",
  ],
  alternates: { canonical: "https://guess-my-anything.app/about" },
  openGraph: {
    title: "About Guess My Anything - AI Guessing Game",
    description:
      "Learn how our AI guessing game works — 900+ entities, weighted scoring, and a life-stage engine.",
    url: "https://guess-my-anything.app/about",
    siteName: "Guess My Anything",
    type: "website",
    locale: "en_US",
  },
};

export default function AboutPage() {
  return (
    <LegalPage title="About Guess My Anything">
      <div className="prose prose-sm sm:prose-base max-w-none">
        <p>
          <strong>Guess My Anything</strong> is a free AI-powered guessing game where you think of
          something — a <Link href="/category/jobs" className="text-indigo-600 hover:underline">job</Link>,{" "}
          <Link href="/category/countries" className="text-indigo-600 hover:underline">country</Link>,{" "}
          <Link href="/category/animals" className="text-indigo-600 hover:underline">animal</Link>,{" "}
          <Link href="/category/sports" className="text-indigo-600 hover:underline">sport</Link>, or even your{" "}
          <Link href="/category/age" className="text-indigo-600 hover:underline">age</Link> — and our AI guesses it
          through a series of smart questions. Think of it as a modern, more powerful version of the
          classic <Link href="/blog/best-guessing-games" className="text-indigo-600 hover:underline">20 Questions game</Link> or Akinator.
        </p>

        <h2>How the AI Guessing Engine Works</h2>
        <p>
          Our engine uses a <strong>weighted-scoring algorithm</strong> with dynamic question selection
          based on information gain. Here&apos;s the short version:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Every entity (job, country, animal, etc.) in our database has a score that starts equal.</li>
          <li>Each question probes a specific attribute (e.g., &quot;Is it a mammal?&quot; probes the &quot;mammal&quot; tag).</li>
          <li>When you answer, the engine adjusts scores — entities that match your answer go up, others go down.</li>
          <li>The next question is chosen to best split the remaining candidates roughly 50/50, maximizing information gain.</li>
          <li>We never hard-eliminate, so the engine recovers from mistakes and ambiguous answers.</li>
        </ul>
        <p>
          Want the deep dive? Read our{" "}
          <Link href="/blog/how-to-guess-anything" className="text-indigo-600 hover:underline">How to Guess Anything</Link>{" "}
          guide.
        </p>

        <h2>What Can You Guess?</h2>
        <p>Our database currently includes:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>354+ jobs</strong> across 16 industries — from Doctor to Underwater Welder (<Link href="/category/jobs" className="text-indigo-600 hover:underline">play</Link>)</li>
          <li><strong>192 countries</strong> — every recognized nation in the world (<Link href="/category/countries" className="text-indigo-600 hover:underline">play</Link>)</li>
          <li><strong>151+ animals</strong> — from lions to axolotls (<Link href="/category/animals" className="text-indigo-600 hover:underline">play</Link>)</li>
          <li><strong>180+ sports</strong> — from Soccer to Kabaddi (<Link href="/category/sports" className="text-indigo-600 hover:underline">play</Link>)</li>
          <li><strong>Your age</strong> — via our unique life-stage engine (<Link href="/category/age" className="text-indigo-600 hover:underline">play</Link>)</li>
        </ul>

        <h2>What Makes Our Age Guesser Different</h2>
        <p>
          Most age guessing games ask blunt questions like &quot;Are you over 50?&quot; — boring and
          inaccurate. Our <Link href="/blog/guess-age-tricks" className="text-indigo-600 hover:underline">age estimation engine</Link>{" "}
          asks about <strong>cultural memories</strong> (did you use dial-up internet?),{" "}
          <strong>career milestones</strong> (are you retired?), and{" "}
          <strong>life events</strong> (do you have a mortgage?). These markers strongly correlate with
          age and achieve over 90% accuracy.
        </p>

        <h2>Is It Free?</h2>
        <p>
          Yes — completely free. No sign-up, no download, no payment. Just visit the site and play. You
          can play as many times as you like. See our{" "}
          <Link href="/faq" className="text-indigo-600 hover:underline">FAQ</Link> for more details.
        </p>

        <h2>Built With Modern Technology</h2>
        <p>
          Guess My Anything is built with Next.js, TypeScript, Tailwind CSS, and Prisma. The engine runs
          entirely on the server, so there&apos;s nothing to download. The retro arcade theme and pixel
          art style make it fun and nostalgic.
        </p>

        <h2>Help Us Improve</h2>
        <p>
          When the AI guesses wrong (it happens!), you can teach it your answer. This feedback is saved
          and reviewed — it helps the engine learn and improves future games for everyone. You can also{" "}
          <Link href="/contact" className="text-indigo-600 hover:underline">contact us</Link> with suggestions
          for new categories, entities, or features.
        </p>

        <h2>Ready to Play?</h2>
        <p>
          <Link href="/" className="text-indigo-600 hover:underline font-medium">← Back to the game</Link>
        </p>
      </div>
    </LegalPage>
  );
}
