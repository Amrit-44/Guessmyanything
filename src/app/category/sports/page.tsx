import type { Metadata } from "next";
import { db } from "@/lib/db";
import { CategoryTemplate, type FAQ } from "@/components/category-template";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Guess My Sport – AI Sports Guessing Game | All Major Sports",
  description: "Think of your favorite sport and let our AI guess it! Answer questions about players, rules, and equipment. Play the free sports guessing game now!",
  keywords: ["sports guessing game", "sport quiz", "AI guess my sport", "sports trivia", "athletics game"],
  openGraph: {
    title: "Guess My Sport – AI Sports Guessing Game | All Major Sports",
    description: "Think of your favorite sport and let our AI guess it! Answer questions about players, rules, and equipment.",
    type: "website",
  },
};

const faqs: FAQ[] = [
  { question: "How many sports can the AI guess?", answer: "All major sports from football to curling!" },
  { question: "Is this for sports fans?", answer: "Perfect for any sports enthusiast!" },
  { question: "Can I play multiple times?", answer: "Yes! Every game is different." },
];

export default async function SportsPage() {
  const [cat, allCats] = await Promise.all([
    db.category.findUnique({ where: { slug: "sports" } }),
    db.category.findMany({
      where: { slug: { in: ["jobs", "countries", "animals"] } },
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
      category="sports"
      title="Guess My Sport"
      description="Think of your favorite sport and let our AI guess it! Answer questions about players, rules, and equipment. With all major sports from football to curling, our AI-powered engine will narrow down your sport through intelligent questioning. Play the free sports guessing game now!"
      heroBlurb="Think of any sport. I'll ask about players, equipment, rules, and setting — then guess it!"
      faqs={faqs}
      relatedCategories={related}
      totalEntities={totalEntities}
    />
  );
}
