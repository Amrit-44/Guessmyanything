import type { Metadata } from "next";
import { db } from "@/lib/db";
import { CategoryTemplate, type FAQ } from "@/components/category-template";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_URL = "https://guess-my-anything.app/category/age";

export const metadata: Metadata = {
  title: "Guess My Age Quiz — Free AI Age Guessing Game | Guess My Anything",
  description:
    "Play the Guess My Age quiz — a free AI age guessing game! Think of your age and our smart engine asks about life milestones, cultural memories, and career stages to guess it. How does it work? Play now!",
  keywords: [
    "guess my age",
    "guess my age quiz",
    "age guessing game",
    "how old am i quiz",
    "age estimator",
    "age calculator game",
    "guess the age",
    "age quiz",
    "ai age guesser",
    "free age guessing game",
    "online age quiz",
    "life stage quiz",
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Guess My Age Quiz — Free AI Age Guessing Game",
    description:
      "Think of your age and our AI guesses it through smart questions about life milestones, cultural memories, and career stages. Play the guess my age quiz free!",
    url: PAGE_URL,
    siteName: "GUESS MY ANYTHING",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Guess My Age Quiz — Free AI Age Guessing Game",
    description:
      "Think of your age and our AI guesses it! Play the guess my age quiz free.",
  },
};

const faqs: FAQ[] = [
  {
    question: "How does the Guess My Age quiz work?",
    answer:
      "Our Guess My Age quiz uses an intelligent life-stage engine. Instead of asking your age directly, it asks about cultural memories (like whether you used dial-up internet or remember 9/11), career milestones, and life events. Each answer narrows the possible age range until the AI can confidently guess your age — usually within 5 questions.",
  },
  {
    question: "Is the Guess My Age quiz accurate?",
    answer:
      "Yes — the quiz achieves over 90% accuracy because it anchors on real-world markers that strongly correlate with age, such as the technology you grew up with, your education stage, and major life milestones. The more honestly you answer, the more accurate the age guess becomes.",
  },
  {
    question: "Is the Guess My Age quiz free to play?",
    answer:
      "Completely free. You can play the Guess My Age quiz as many times as you like — no sign-up, no download, no payment. Just visit the page and start playing.",
  },
  {
    question: "How many questions does the age quiz ask?",
    answer:
      "The quiz typically asks between 5 and 18 questions. It stops early when your answers have narrowed the age range tightly (within 2-3 years), and asks more questions only when the range is still wide. The engine dynamically picks the most informative question each turn.",
  },
  {
    question: "Can the AI guess my exact age?",
    answer:
      "The AI usually narrows your age to a 2-5 year range and guesses the most likely age within it. Exact-year accuracy depends on how many questions you answer and how clearly your experiences map to a specific generation. Try it and see how close it gets!",
  },
  {
    question: "What kind of questions does the age guessing game ask?",
    answer:
      "The quiz asks four types of questions: (1) technology and cultural memories — like whether you used VHS tapes or grew up with smartphones; (2) education and career stage — like whether you're in university or retired; (3) life milestones — like marriage, children, or moving out; and (4) direct range-narrowing questions about which decade you're closest to.",
  },
  {
    question: "Is this just a random age generator?",
    answer:
      "No. Unlike a random age picker, our engine uses a weighted information-gain algorithm. Each question is chosen because it best splits the remaining possible ages, and your answers genuinely constrain the range. Every game is a real deduction, not a guess.",
  },
  {
    question: "Can I play the Guess My Age quiz on my phone?",
    answer:
      "Yes! The quiz is fully responsive and works on phones, tablets, and desktops. No app install needed — just open the page in your browser and play.",
  },
];

export default async function AgePage() {
  const allCats = await db.category.findMany({
    where: { slug: { in: ["jobs", "countries", "animals", "sports"] } },
    select: { name: true, slug: true, icon: true, color: true },
  });

  const jsonLdQuiz = {
    "@context": "https://schema.org",
    "@type": "Quiz",
    name: "Guess My Age Quiz",
    description:
      "A free AI-powered age guessing game. Think of your age and the AI guesses it through questions about life milestones and cultural memories.",
    url: PAGE_URL,
    educationalLevel: "All ages",
    about: ["age guessing", "life stages", "generational markers"],
    isAccessibleForFree: true,
    inLanguage: "en",
    publisher: {
      "@type": "Organization",
      name: "GUESS MY ANYTHING",
      url: "https://guess-my-anything.app",
    },
  };

  const jsonLdFaq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  const jsonLdWebApp = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Guess My Age Quiz",
    description:
      "Free AI age guessing game. Think of your age and the AI guesses it through smart questions.",
    url: PAGE_URL,
    applicationCategory: "Game",
    operatingSystem: "Web",
    genre: "Quiz",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    isAccessibleForFree: true,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdQuiz) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebApp) }}
      />
      <CategoryTemplate
        category="age"
        title="Guess My Age"
        description="The Guess My Age quiz is a free AI-powered age guessing game. Think of your age and our intelligent life-stage engine asks about cultural memories, career milestones, and life events to guess how old you are. With over 90% accuracy, it's the smartest age guessing game on the web — no sign-up, no download, completely free."
        heroBlurb="Think of your age. I'll ask about life milestones, cultural memories, and career stages — then guess it!"
        faqs={faqs}
        relatedCategories={allCats.map((c) => ({
          slug: c.slug,
          name: c.name,
          icon: c.icon,
          color: c.color,
        }))}
        totalEntities={0}
      />
    </>
  );
}
