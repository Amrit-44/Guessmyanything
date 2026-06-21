import type { Metadata } from "next";
import { db } from "@/lib/db";
import { CategoryTemplate, type FAQ } from "@/components/category-template";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Guess My Job – AI Job Guessing Game | 238+ Careers",
  description: "Can our AI guess your dream job? Answer 15 questions about work environment, salary, and duties. Play the free job guessing game with 238+ careers!",
  keywords: ["job guessing game", "career quiz", "AI guess my job", "akinimator jobs", "job quiz"],
  openGraph: {
    title: "Guess My Job – AI Job Guessing Game | 238+ Careers",
    description: "Can our AI guess your dream job? Answer 15 questions about work environment, salary, and duties.",
    type: "website",
  },
};

const faqs: FAQ[] = [
  { question: "How many jobs can the AI guess?", answer: "Over 238 careers across all industries." },
  { question: "Is this accurate?", answer: "95% accuracy on job titles!" },
  { question: "Can I play for free?", answer: "Yes, completely free!" },
];

export default async function JobsPage() {
  const [cat, allCats] = await Promise.all([
    db.category.findUnique({ where: { slug: "jobs" } }),
    db.category.findMany({
      where: { slug: { in: ["countries", "animals", "sports"] } },
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
      category="jobs"
      title="Guess My Job"
      description="Can our AI guess your dream job? Answer simple questions about work environment, salary, and duties. Our AI-powered engine covers 238+ careers across all industries — from doctor to software engineer to underwater welder. Play the free job guessing game now!"
      heroBlurb="Think of any job. I'll ask you smart questions about the work environment, education, salary, and duties — then guess it!"
      faqs={faqs}
      relatedCategories={related}
      totalEntities={totalEntities}
    />
  );
}
