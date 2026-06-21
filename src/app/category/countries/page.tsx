import type { Metadata } from "next";
import { db } from "@/lib/db";
import { CategoryTemplate, type FAQ } from "@/components/category-template";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Guess My Country – AI Country Guessing Game | 199 Nations",
  description: "Challenge our AI to guess your country! Answer questions about continent, language, climate, and culture. Play the geography guessing game now!",
  keywords: ["country guessing game", "geography quiz", "AI guess my country", "world map game", "country quiz"],
  openGraph: {
    title: "Guess My Country – AI Country Guessing Game | 199 Nations",
    description: "Challenge our AI to guess your country! Answer questions about continent, language, climate, and culture.",
    type: "website",
  },
};

const faqs: FAQ[] = [
  { question: "How many countries are included?", answer: "199 countries with 95% accuracy." },
  { question: "What questions will I be asked?", answer: "Questions about location, language, climate, and culture." },
  { question: "Is this educational?", answer: "Yes! Learn geography while having fun!" },
];

export default async function CountriesPage() {
  const [cat, allCats] = await Promise.all([
    db.category.findUnique({ where: { slug: "countries" } }),
    db.category.findMany({
      where: { slug: { in: ["jobs", "animals", "sports"] } },
      select: { name: true, slug: true, icon: true, color: true },
    }),
  ]);

  const totalEntities = cat?._count?.entities ?? 0;
  const related = [
    ...allCats.map(c => ({ slug: c.slug, name: c.name, icon: c.icon, color: c.color })),
    { slug: "age", name: "Guess My Age", icon: "Cake", color: "#fde047" },
  ];

  return (
    <CategoryTemplate
      category="countries"
      title="Guess My Country"
      description="Challenge our AI to guess your country! Answer simple questions about continent, language, climate, and culture. With 199 nations in our database, the AI will narrow down your country through intelligent questioning. Play the geography guessing game now!"
      heroBlurb="Think of any country. I'll ask about its location, language, climate, and culture — then guess it!"
      faqs={faqs}
      relatedCategories={related}
      totalEntities={totalEntities}
    />
  );
}
