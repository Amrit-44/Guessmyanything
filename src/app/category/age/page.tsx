import type { Metadata } from "next";
import { db } from "@/lib/db";
import { CategoryTemplate, type FAQ } from "@/components/category-template";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Guess My Age – AI Age Estimator Game | Life-Stage Engine",
  description: "Think of your age and let our AI guess it! No boring 'over 50' questions—our life-stage engine asks about milestones, memories, and experiences. Try it now!",
  keywords: ["age guessing game", "AI age estimator", "guess my age", "age quiz", "life stage game"],
  openGraph: {
    title: "Guess My Age – AI Age Estimator Game | Life-Stage Engine",
    description: "Think of your age and let our AI guess it! Our life-stage engine asks about milestones, memories, and experiences.",
    type: "website",
  },
};

const faqs: FAQ[] = [
  { question: "How does the age guessing work?", answer: "Our unique engine asks about life milestones, career stages, and cultural memories." },
  { question: "Is it accurate?", answer: "Over 90% accuracy because we use real-world markers!" },
  { question: "Is it just a random guess?", answer: "No! Our AI is trained on real human life patterns." },
];

export default async function AgePage() {
  const allCats = await db.category.findMany({
    where: { slug: { in: ["jobs", "countries", "animals", "sports"] } },
    select: { name: true, slug: true, icon: true, color: true },
  });

  const related = allCats.map(c => ({ slug: c.slug, name: c.name, icon: c.icon, color: c.color }));

  return (
    <CategoryTemplate
      category="age"
      title="Guess My Age"
      description="Think of your age and let our AI guess it! No boring 'over 50' questions—our unique life-stage engine asks about cultural memories, career milestones, and life experiences to narrow down your age naturally. Try it now!"
      heroBlurb="Think of your age. I'll ask about life milestones, cultural memories, and career stages — then guess it!"
      faqs={faqs}
      relatedCategories={related}
      totalEntities={0}
    />
  );
}
