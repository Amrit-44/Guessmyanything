import type { Metadata } from "next";
import { db } from "@/lib/db";
import { CategoryTemplate, type FAQ } from "@/components/category-template";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_URL = "https://guess-my-anything.app/category/jobs";

export const metadata: Metadata = {
  title: "Guess My Job - AI Job Guessing Game | 354+ Careers",
  description:
    "Can our AI guess your dream job? Answer 15 questions about work environment, salary, and duties. Play the free job guessing game with 354+ careers!",
  keywords: [
    "guess my job",
    "guess my occupation",
    "job guessing game",
    "career guessing game",
    "ai job guesser",
    "what job am i",
    "guess the profession",
    "free job quiz",
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Guess My Job - AI Job Guessing Game | 354+ Careers",
    description:
      "Can our AI guess your dream job? Answer 15 questions about work environment, salary, and duties. Play free!",
    url: PAGE_URL,
    siteName: "Guess My Anything",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Guess My Job - AI Job Guessing Game",
    description:
      "Can our AI guess your dream job? 354+ careers. Play free!",
  },
};

const faqs: FAQ[] = [
  {
    question: "How many jobs can the AI guess?",
    answer:
      "Our AI can guess from over 354 different careers across 16 industries — from common jobs like Doctor, Teacher, and Software Engineer to rare professions like Sommelier, Underwater Welder, and Volcanologist. Every job is tagged with 8 attributes (industry, work environment, education, salary, experience, physical demand, tools, and skills) so the engine can narrow down even obscure occupations.",
  },
  {
    question: "Is the job guessing game accurate?",
    answer:
      "Yes — our AI achieves 95%+ accuracy on job titles. It uses a weighted-scoring engine with industry detection: within the first 8 questions it identifies your industry (Healthcare, Technology, Finance, etc.), then narrows to specific roles within that industry. Most games are solved in 15-20 questions.",
  },
  {
    question: "Is the job guessing game free to play?",
    answer:
      "Completely free. You can play Guess My Job as many times as you like — no sign-up, no download, no payment. Just visit the page, think of any job, and start answering questions.",
  },
  {
    question: "What kind of questions does the job guessing game ask?",
    answer:
      "The game asks natural questions across 8 categories: industry ('Do you work in healthcare?'), work environment ('Do you work outdoors?'), education ('Does this job require a doctoral degree?'), salary ('Does this job pay over $150,000?'), experience ('Is this an entry-level job?'), physical demand ('Does this job involve heavy lifting?'), tools ('Do you use a microscope?'), and skills ('Does this job require coding?').",
  },
  {
    question: "Can the AI guess rare or unusual jobs?",
    answer:
      "Yes! Our database includes 60+ rare and specialized jobs including Astronaut, Beekeeper, Cartographer, Lighthouse Keeper, Court Reporter, Glass Blower, Watchmaker, and Calligrapher. The more honestly you answer, the better the AI can narrow down even the most obscure professions.",
  },
  {
    question: "How does the AI know which questions to ask?",
    answer:
      "The engine uses an information-gain algorithm — each question is chosen because it best splits the remaining candidate jobs roughly in half. It also uses industry detection to lock onto your sector early, then asks discriminating questions within that industry. This is the same approach used by Akinator and 20 Questions, but optimized for careers.",
  },
  {
    question: "Can I play the job guessing game on my phone?",
    answer:
      "Yes! The game is fully responsive and works on phones, tablets, and desktops. No app install needed — just open the page in your browser and play.",
  },
  {
    question: "What if the AI guesses wrong?",
    answer:
      "If the AI's guess is wrong, you can say so and it will ask more questions to refine its guess. After 3 wrong guesses, you can teach the AI your job — this feedback helps the engine learn and improves future games for everyone.",
  },
];

export default async function JobsPage() {
  const [cat, allCats] = await Promise.all([
    db.category.findUnique({ where: { slug: "jobs" } }),
    db.category.findMany({
      where: { slug: { in: ["countries", "animals", "sports"] } },
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
    name: "Guess My Job Quiz",
    description:
      "A free AI-powered job guessing game. Think of any career and the AI guesses it through 15-20 questions about work environment, salary, and skills.",
    url: PAGE_URL,
    educationalLevel: "All ages",
    about: ["careers", "jobs", "professions"],
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
        category="jobs"
        title="Guess My Job"
        description="Can our AI guess your dream job? Answer simple questions about work environment, education, salary, and duties. Our AI-powered engine covers 354+ careers across all 16 industries — from Doctor and Software Engineer to Sommelier and Underwater Welder. Play the free job guessing game now!"
        heroBlurb="Think of any job. I'll ask smart questions about the work environment, education, salary, and duties — then guess it!"
        faqs={faqs}
        relatedCategories={related}
        totalEntities={cat?._count?.entities ?? 0}
      />
    </>
  );
}
