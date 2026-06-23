import type { Metadata } from "next";
import { db } from "@/lib/db";
import { CategoryTemplate, type FAQ } from "@/components/category-template";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_URL = "https://guess-my-anything.app/category/animals";

export const metadata: Metadata = {
  title: "Guess the Animal - AI Animal Guessing Game | 151+ Species",
  description:
    "Can our AI guess your favorite animal? Answer simple questions about habitat, diet, and size. Play the free animal guessing game with 151+ species!",
  keywords: [
    "guess the animal",
    "guess my animal",
    "guess my favorite animal",
    "animal guessing game",
    "ai animal guesser",
    "what animal am i",
    "guess the species",
    "free animal quiz",
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Guess the Animal - AI Animal Guessing Game | 151+ Species",
    description:
      "Can our AI guess your favorite animal? Answer questions about habitat, diet, and size. Play free!",
    url: PAGE_URL,
    siteName: "Guess My Anything",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Guess the Animal - AI Animal Guessing Game",
    description:
      "Can our AI guess your favorite animal? 151+ species. Play free!",
  },
};

const faqs: FAQ[] = [
  {
    question: "How many animals can the AI guess?",
    answer:
      "Our AI can guess from over 151 different animal species — from common pets like dogs, cats, and horses to wild animals like lions, elephants, and dolphins, and exotic creatures like axolotls, komodo dragons, and blobfish. Each animal is tagged with attributes like habitat, diet, size, and behavior.",
  },
  {
    question: "Is the animal guessing game free to play?",
    answer:
      "Yes! Our animal guessing game is 100% free to play with no sign-up required. Play as many times as you like — think of a different animal each time and see if the AI can guess it.",
  },
  {
    question: "How accurate is the animal guessing game?",
    answer:
      "Our AI achieves 95%+ accuracy across all 151+ animal species. It uses advanced tag-matching logic with an information-gain algorithm that picks the most discriminating question each turn. Most animals are guessed within 15-20 questions.",
  },
  {
    question: "What kind of questions does the animal guessing game ask?",
    answer:
      "The game asks simple, kid-friendly questions like 'Is it a mammal?', 'Does it eat meat?', 'Does it live in Africa?', 'Can it fly?', 'Is it bigger than a human?', and 'Is it commonly kept as a pet?'. The questions start broad and get more specific as the AI narrows down.",
  },
  {
    question: "Is the animal guessing game good for kids?",
    answer:
      "Absolutely! The questions are simple and educational, making it perfect for kids. Children learn about animal classification (mammals, birds, reptiles), habitats (Africa, Asia, ocean), diets (carnivore, herbivore), and physical traits (fur, feathers, scales) while having fun. It's a great educational game for classrooms and families.",
  },
  {
    question: "Can the AI guess rare or unusual animals?",
    answer:
      "Yes! Our database includes rare and exotic species like the axolotl, pangolin, narwhal, platypus, kiwi bird, and komodo dragon. The more honestly you answer the questions, the better the AI can narrow down even the most unusual creatures.",
  },
  {
    question: "Can I play the animal guessing game on my phone?",
    answer:
      "Yes! The game is fully responsive and works on phones, tablets, and desktops. No app install needed — just open the page in your browser and play.",
  },
  {
    question: "What if the AI guesses the wrong animal?",
    answer:
      "If the AI's guess is wrong, you can say so and it will ask more questions to refine its guess. After 3 wrong guesses, you can teach the AI your animal — this feedback helps the engine learn and improves future games for everyone.",
  },
];

export default async function AnimalsPage() {
  const [cat, allCats] = await Promise.all([
    db.category.findUnique({ where: { slug: "animals" } }),
    db.category.findMany({
      where: { slug: { in: ["jobs", "countries", "sports"] } },
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
    name: "Guess the Animal Quiz",
    description:
      "A free AI-powered animal guessing game. Think of any animal and the AI guesses it through simple questions about habitat, diet, and size.",
    url: PAGE_URL,
    educationalLevel: "All ages",
    about: ["animals", "wildlife", "species"],
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
        category="animals"
        title="Guess the Animal"
        description="Can our AI guess your favorite animal? With 151+ species from lions and elephants to axolotls and komodo dragons, our AI-powered engine will narrow down your animal through simple questions about habitat, diet, and appearance. Fun and educational for all ages — play the free animal guessing game now!"
        heroBlurb="Think of any animal. I'll ask easy questions about its habitat, diet, and appearance — then guess it!"
        faqs={faqs}
        relatedCategories={related}
        totalEntities={cat?._count?.entities ?? 0}
      />
    </>
  );
}
