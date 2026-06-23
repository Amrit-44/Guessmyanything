import type { Metadata } from "next";
import { db } from "@/lib/db";
import { CategoryTemplate, type FAQ } from "@/components/category-template";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_URL = "https://guess-my-anything.app/category/countries";

export const metadata: Metadata = {
  title: "Guess the Country - AI Geography Guessing Game | 192 Nations",
  description:
    "Challenge our AI to guess your country! Answer questions about continent, language, climate, and culture. Play the free geography guessing game with 192 nations!",
  keywords: [
    "guess the country",
    "guess my country",
    "guess my nationality",
    "country guessing game",
    "geography guessing game",
    "guess the nation",
    "ai country guesser",
    "free geography quiz",
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Guess the Country - AI Geography Guessing Game | 192 Nations",
    description:
      "Challenge our AI to guess your country! Answer questions about continent, language, climate, and culture. Play free!",
    url: PAGE_URL,
    siteName: "Guess My Anything",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Guess the Country - AI Geography Guessing Game",
    description:
      "Challenge our AI to guess your country! 192 nations. Play free!",
  },
};

const faqs: FAQ[] = [
  {
    question: "How many countries are in the guessing game?",
    answer:
      "Our AI can guess from 192 countries — every recognized nation in the world, from large countries like the United States, China, and Brazil to small island nations like Malta, Vanuatu, and Seychelles. Each country is tagged with attributes like continent, language, climate, population, and culture.",
  },
  {
    question: "Is the country guessing game accurate?",
    answer:
      "Yes — our AI achieves 95%+ accuracy on country guessing. It uses an information-gain algorithm that picks questions to best split the remaining candidates in half. Most countries are guessed within 15-20 questions, often fewer for well-known nations.",
  },
  {
    question: "What kind of questions does the country guessing game ask?",
    answer:
      "The game asks natural questions about geography ('Is it in Asia?'), language ('Is it English-speaking?'), climate ('Is it a tropical country?'), culture ('Is it an ancient civilization?'), economy ('Is it a developed country?'), and physical features ('Is it an island nation?' or 'Does it have mountains?').",
  },
  {
    question: "Is the geography guessing game free to play?",
    answer:
      "Completely free. You can play Guess the Country as many times as you like — no sign-up, no download, no payment. Just think of any country and start answering questions.",
  },
  {
    question: "Is the country guessing game educational?",
    answer:
      "Yes! The game is a fun way to learn geography. As you answer questions about continents, languages, climates, and cultures, you'll discover facts about countries you may never have heard of. It's popular with students, travelers, and geography enthusiasts.",
  },
  {
    question: "Can the AI guess small or obscure countries?",
    answer:
      "Absolutely. Our database includes small nations like Liechtenstein, Nauru, Tuvalu, and São Tomé and Príncipe. The engine narrows down by region, language, and physical characteristics until it pinpoints even the smallest country.",
  },
  {
    question: "Can I play the country guessing game on my phone?",
    answer:
      "Yes! The game is fully responsive and works on phones, tablets, and desktops. No app install needed — just open the page in your browser and play.",
  },
  {
    question: "What if the AI guesses the wrong country?",
    answer:
      "If the AI's guess is wrong, you can say so and it will ask more questions to refine its guess. After 3 wrong guesses, you can teach the AI your country — this feedback helps the engine learn and improves future games.",
  },
];

export default async function CountriesPage() {
  const [cat, allCats] = await Promise.all([
    db.category.findUnique({ where: { slug: "countries" } }),
    db.category.findMany({
      where: { slug: { in: ["jobs", "animals", "sports"] } },
      select: { name: true, slug: true, icon: true, color: true },
    }),
  ]);
  const related = [
    ...allCats.map((c) => ({ slug: c.slug, name: c.name, icon: c.icon, color: c.color })),
    { slug: "age", name: "Guess My Age", icon: "Cake", color: "#fde047" },
  ];

  const jsonLdQuiz = {
    "@context": "https://schema.org",
    "@type": "Quiz",
    name: "Guess the Country Quiz",
    description:
      "A free AI-powered geography guessing game. Think of any country and the AI guesses it through questions about continent, language, and climate.",
    url: PAGE_URL,
    educationalLevel: "All ages",
    about: ["geography", "countries", "world nations"],
    isAccessibleForFree: true,
    inLanguage: "en",
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
      <CategoryTemplate
        category="countries"
        title="Guess the Country"
        description="Challenge our AI to guess your country! With 192 nations in our database, the AI will narrow down your country through intelligent questions about location, language, climate, and culture. From large nations like the United States to small island states like Malta — can the AI guess yours? Play the free geography guessing game now!"
        heroBlurb="Think of any country. I'll ask about its location, language, climate, and culture — then guess it!"
        faqs={faqs}
        relatedCategories={related}
        totalEntities={cat?._count?.entities ?? 0}
      />
    </>
  );
}
