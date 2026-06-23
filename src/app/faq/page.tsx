import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import Link from "next/link";

const PAGE_URL = "https://guess-my-anything.app/faq";

export const metadata: Metadata = {
  title: "Frequently Asked Questions - Guess My Anything",
  description:
    "Answers to common questions about Guess My Anything — the free AI guessing game. Learn how it works, what you can guess, accuracy, and more.",
  keywords: [
    "guess my anything",
    "guessing game faq",
    "ai guessing game",
    "free guessing game",
    "how ai guessing works",
    "online guessing game",
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Frequently Asked Questions - Guess My Anything",
    description:
      "Answers to common questions about Guess My Anything — the free AI guessing game. How it works, what you can guess, accuracy, and more.",
    url: PAGE_URL,
    siteName: "Guess My Anything",
    type: "article",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Frequently Asked Questions - Guess My Anything",
    description:
      "Answers to common questions about Guess My Anything — the free AI guessing game.",
  },
};

const faqs = [
  {
    question: "What is Guess My Anything?",
    answer:
      "Guess My Anything is a free AI-powered guessing game inspired by classic titles like Akinator and the 20 Questions game. You think of something — an age, a job, an animal, a country, a sport, or anything at all — and the AI asks a series of yes/no questions to guess what you are thinking of. The engine uses weighted scoring and information gain to narrow down the answer, usually in fewer than twenty questions.",
  },
  {
    question: "Is Guess My Anything free?",
    answer:
      "Yes, completely free. There is no sign-up, no download, and no payment required. You can play as many games as you want, in any category, on any device, without ever creating an account. Just visit the homepage and start playing.",
  },
  {
    question: "How does the AI work?",
    answer:
      "The engine combines weighted scoring, information gain, and a category-locking system. Instead of eliminating candidates when you answer no, it nudges their scores down — so it can recover if you misclick. It picks the next question by estimating how much each option would reduce uncertainty across the candidate pool. The result is fewer questions, graceful error recovery, and a learning loop that improves the engine over time. For the full story, read our engine explainer.",
  },
  {
    question: "What can I guess?",
    answer:
      "You can guess ages, jobs, animals, countries, sports, characters, movies, TV shows, video games, brands, objects, celebrities, historical figures, and more. Each category is a separate mode with its own question set, so the AI never asks off-topic questions. You can also pick the Anything mode to let the engine roam across every category at once.",
  },
  {
    question: "Is the AI accurate?",
    answer:
      "Yes. On honest play the engine typically guesses correctly on the first or second attempt. The age engine usually lands within five years of your true age. The job engine narrows from over 354 careers in roughly 15 questions. Accuracy improves with every game because the engine learns from each round — wrong guesses become teachable moments that refine future play.",
  },
  {
    question: "Do I need to sign up?",
    answer:
      "No. There is no account, no email, and no login. You can play the entire game anonymously. We do not collect personal information during gameplay. The only data we track is anonymous game analytics — like which categories are played and whether the AI guessed correctly — to improve the engine.",
  },
  {
    question: "Can I play on mobile?",
    answer:
      "Yes. Guess My Anything is fully responsive and works on any modern smartphone, tablet, or desktop browser. The interface is touch-friendly with appropriately sized buttons, and the layout adapts to portrait and landscape orientations. There is nothing to install — just open the site in your mobile browser.",
  },
  {
    question: "How many categories are there?",
    answer:
      "There are over a dozen categories including Age, Jobs, Animals, Countries, Sports, Characters, Movies, TV Shows, Video Games, Brands, Objects, Celebrities, and Historical Figures. Each category has its own curated question set and entity database, and you can also play the Anything mode which combines every category into one giant guessing pool.",
  },
  {
    question: "Is it kid-friendly?",
    answer:
      "Yes. The content is appropriate for all ages. There is no mature content in the entity database, and the questions are clean and educational. Children particularly enjoy the Animals and Sports modes, and the Geography mode is a fun way to learn about world countries. Parents can play alongside younger children to help with reading.",
  },
  {
    question: "What if the AI is wrong?",
    answer:
      "If the AI's first guess is wrong, it will try again with the next most likely candidate — up to three guesses in total. If all three miss, you will see a short teach-the-AI form. Adding your answer helps the engine learn so it can guess correctly next time. Every teaching submission is reviewed before being added to the live database, which keeps the game accurate and spam-free.",
  },
  {
    question: "Can I suggest new content?",
    answer:
      "Yes. Whenever the AI fails to guess your answer, you can teach it using the in-game form. You can also contact us directly with suggestions for new categories, entities, or questions. We review every submission and add high-quality entries in regular content updates. The engine is designed to grow with its community.",
  },
  {
    question: "Who built this?",
    answer:
      "Guess My Anything is built by a small team of game and AI enthusiasts who wanted a sharper, friendlier alternative to existing guessing games. The engine is custom-built with a weighted-scoring architecture, live industry detection for the Jobs mode, and a learning loop that refines the question pool over time. Learn more on our About page.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.question,
    acceptedAnswer: { "@type": "Answer", text: f.answer },
  })),
};

function Answer({ answer }: { answer: string }) {
  return <p>{answer}</p>;
}

export default function FAQPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LegalPage title="Frequently Asked Questions">
        <p>
          Welcome to the <strong>Guess My Anything</strong> FAQ. Below
          are answers to the most common questions about the game, the
          AI engine, and how to get the most out of every play. If you
          have a question that is not covered here, please{" "}
          <Link href="/contact" className="text-indigo-600 hover:underline">contact us</Link>.
        </p>

        {faqs.map((faq) => (
          <div key={faq.question} className="pt-4">
            <h2 className="text-lg font-bold text-black mb-2">
              {faq.question}
            </h2>
            <Answer answer={faq.answer} />
          </div>
        ))}

        <h2 className="text-xl font-bold text-black mt-10 mb-3">
          Still curious?
        </h2>
        <p>
          Read our deep dives on{" "}
          <Link href="/blog/how-to-guess-anything" className="text-indigo-600 hover:underline">how the AI guessing engine works</Link>,{" "}
          <Link href="/blog/guess-age-tricks" className="text-indigo-600 hover:underline">how the age engine works</Link>,{" "}
          <Link href="/blog/jobs-gaming-guide" className="text-indigo-600 hover:underline">the career guessing game guide</Link>,{" "}
          <Link href="/blog/guess-country-tips" className="text-indigo-600 hover:underline">country guessing tips</Link>,{" "}
          <Link href="/blog/guess-animal-strategies" className="text-indigo-600 hover:underline">animal guessing strategies</Link>,
          and our roundup of the{" "}
          <Link href="/blog/best-guessing-games" className="text-indigo-600 hover:underline">best guessing games to play in 2026</Link>.
          You can also learn more{" "}
          <Link href="/about" className="text-indigo-600 hover:underline">about the project</Link>{" "}
          or jump straight into a game:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <Link href="/category/age" className="text-indigo-600 hover:underline">Guess My Age</Link>
          </li>
          <li>
            <Link href="/category/jobs" className="text-indigo-600 hover:underline">Guess My Job</Link>
          </li>
          <li>
            <Link href="/category/animals" className="text-indigo-600 hover:underline">Guess the Animal</Link>
          </li>
          <li>
            <Link href="/category/countries" className="text-indigo-600 hover:underline">Guess the Country</Link>
          </li>
          <li>
            <Link href="/category/sports" className="text-indigo-600 hover:underline">Guess the Sport</Link>
          </li>
          <li>
            <Link href="/" className="text-indigo-600 hover:underline">Play Anything mode</Link>
          </li>
        </ul>
      </LegalPage>
    </>
  );
}
