import type { Metadata } from "next";
import { db } from "@/lib/db";
import { CategoryTemplate, type FAQ } from "@/components/category-template";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Guess My Animal – AI Animal Guessing Game | 120+ Species",
  description: "Can our AI guess your favorite animal? Answer simple questions about habitat, diet, and size. Play the animal guessing game with 120+ species!",
  keywords: ["animal guessing game", "animal quiz", "AI guess my animal", "nature game", "animal trivia"],
  openGraph: {
    title: "Guess My Animal – AI Animal Guessing Game | 120+ Species",
    description: "Can our AI guess your favorite animal? Answer simple questions about habitat, diet, and size.",
    type: "website",
  },
};

const faqs: FAQ[] = [
  { question: "How many animals are in the game?", answer: "Over 120 animals, from lions to axolotls!" },
  { question: "What questions will I get?", answer: "Easy questions like 'Does it eat meat?' or 'Does it live in Africa?'" },
  { question: "Is it good for kids?", answer: "Absolutely! Fun and educational for all ages." },
];

export default async function AnimalsPage() {
  const [cat, allCats] = await Promise.all([
    db.category.findUnique({ where: { slug: "animals" } }),
    db.category.findMany({
      where: { slug: { in: ["jobs", "countries", "sports"] } },
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
      category="animals"
      title="Guess My Animal"
      description="Can our AI guess your favorite animal? Answer simple questions about habitat, diet, and size. With 120+ species from lions to axolotls, our AI-powered engine will narrow down your animal through intelligent questioning. Play the free animal guessing game now!"
      heroBlurb="Think of any animal. I'll ask easy questions about its habitat, diet, and appearance — then guess it!"
      faqs={faqs}
      relatedCategories={related}
      totalEntities={totalEntities}
    />
  );
}
