import type { Metadata } from "next";
import { db } from "@/lib/db";
import { CategoryTemplate, type FAQ } from "@/components/category-template";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_URL = "https://guess-my-anything.app/category/sports";

export const metadata: Metadata = {
  title: "Guess the Sport - AI Sports Guessing Game | 180+ Sports",
  description:
    "Think of your favorite sport and let our AI guess it! Answer questions about players, rules, and equipment. Play the free sports guessing game now!",
  keywords: [
    "guess the sport",
    "guess my sport",
    "sports guessing game",
    "ai sports guesser",
    "what sport am i",
    "guess the game",
    "free sports quiz",
    "olympic sports quiz",
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Guess the Sport - AI Sports Guessing Game | 180+ Sports",
    description:
      "Think of your favorite sport and let our AI guess it! Answer questions about players, rules, and equipment. Play free!",
    url: PAGE_URL,
    siteName: "Guess My Anything",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Guess the Sport - AI Sports Guessing Game",
    description:
      "Think of your favorite sport and let our AI guess it! 180+ sports. Play free!",
  },
};

const faqs: FAQ[] = [
  {
    question: "How many sports can the AI guess?",
    answer:
      "Our AI can guess from over 180 different sports — from major team sports like Soccer, Basketball, and Cricket to individual sports like Tennis, Golf, and Athletics, niche sports like Curling and Kabaddi, and extreme sports like Parkour and Wingsuit Flying. Every sport is tagged with attributes like team size, equipment, venue, and Olympic status.",
  },
  {
    question: "Is the sports guessing game accurate?",
    answer:
      "Yes — our AI achieves 95%+ accuracy on sports guessing. It uses an information-gain algorithm that picks the most discriminating question each turn. The engine distinguishes between similar sports (e.g., Rugby vs American Football) by asking about specific rules, equipment, and gameplay.",
  },
  {
    question: "What kind of questions does the sports guessing game ask?",
    answer:
      "The game asks natural questions like 'Is it a team sport?', 'Does it use a ball?', 'Is it an Olympic sport?', 'Is it played indoors?', 'Does it involve physical contact?', 'Does it use a racket?', and 'Is it a water sport?'. Questions start broad and get more specific as the AI narrows down.",
  },
  {
    question: "Is the sports guessing game free to play?",
    answer:
      "Completely free. You can play Guess the Sport as many times as you like — no sign-up, no download, no payment. Think of any sport and see if the AI can guess it.",
  },
  {
    question: "Can the AI guess obscure or regional sports?",
    answer:
      "Yes! Our database includes regional sports like Kabaddi, Hurling, Sepak Takraw, and Pesäpallo, as well as niche sports like Curling, Skeleton, and Underwater Hockey. The more honestly you answer, the better the AI can narrow down even the most obscure sports.",
  },
  {
    question: "Is the sports guessing game good for sports fans?",
    answer:
      "Perfect for any sports enthusiast! Whether you're into mainstream sports like Soccer and Basketball or niche sports like Fencing and Archery, the AI can guess it. It's also a fun way to discover new sports you've never heard of.",
  },
  {
    question: "Can I play the sports guessing game on my phone?",
    answer:
      "Yes! The game is fully responsive and works on phones, tablets, and desktops. No app install needed — just open the page in your browser and play.",
  },
  {
    question: "What if the AI guesses the wrong sport?",
    answer:
      "If the AI's guess is wrong, you can say so and it will ask more questions to refine its guess. After 3 wrong guesses, you can teach the AI your sport — this feedback helps the engine learn and improves future games for everyone.",
  },
];

export default async function SportsPage() {
  const [cat, allCats] = await Promise.all([
    db.category.findUnique({ where: { slug: "sports" } }),
    db.category.findMany({
      where: { slug: { in: ["jobs", "countries", "animals"] } },
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
    name: "Guess the Sport Quiz",
    description:
      "A free AI-powered sports guessing game. Think of any sport and the AI guesses it through questions about players, rules, and equipment.",
    url: PAGE_URL,
    educationalLevel: "All ages",
    about: ["sports", "athletics", "games"],
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
        category="sports"
        title="Guess the Sport"
        description="Think of your favorite sport and let our AI guess it! With 180+ sports from Soccer and Basketball to Curling and Kabaddi, our AI-powered engine will narrow down your sport through intelligent questions about players, equipment, rules, and setting. Play the free sports guessing game now!"
        heroBlurb="Think of any sport. I'll ask about players, equipment, rules, and setting — then guess it!"
        faqs={faqs}
        relatedCategories={related}
        totalEntities={cat?._count?.entities ?? 0}
      />
    </>
  );
}
