import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { CategoryTemplate } from "@/components/category-template";

const CATEGORY_META: Record<string, {
  title: string;
  description: string;
  heroBlurb: string;
  faqs: { question: string; answer: string }[];
}> = {
  jobs: {
    title: "Guess My Job",
    description: "Our AI guesses your job from 354+ careers across 16 industries using tag-based scoring.",
    heroBlurb: "Think of your dream job. Answer up to 20 questions and watch our AI narrow it down.",
    faqs: [
      { question: "How many jobs can the AI guess?", answer: "354+ careers across 16 industries — from Doctor to Volcanologist." },
      { question: "How accurate is it?", answer: "90%+ accuracy. The more specific your answers, the better it performs." },
    ],
  },
  countries: {
    title: "Guess the Country",
    description: "Our AI guesses any country from all 192 UN member states using geography, culture, and economy tags.",
    heroBlurb: "Think of any country in the world. Our AI will ask about geography, culture, and economy.",
    faqs: [
      { question: "How many countries are included?", answer: "All 192 UN member states plus several territories." },
      { question: "What kind of questions are asked?", answer: "Climate, continent, population size, language, economy, and more." },
    ],
  },
  animals: {
    title: "Guess the Animal",
    description: "Our AI guesses from 151+ animal species using habitat, diet, size, and behavior tags.",
    heroBlurb: "Think of any animal. Answer questions about habitat, diet, and size.",
    faqs: [
      { question: "How many animals are included?", answer: "151+ species from pets to exotic wildlife." },
      { question: "How accurate is it?", answer: "95%+ accuracy across all 151+ animal species." },
    ],
  },
  sports: {
    title: "Guess the Sport",
    description: "Our AI guesses from 180+ sports using team size, equipment, environment, and physicality tags.",
    heroBlurb: "Think of any sport. Our AI will ask about teams, equipment, and where it's played.",
    faqs: [
      { question: "How many sports are included?", answer: "180+ sports from mainstream to extreme and niche." },
      { question: "Does it include e-sports?", answer: "Yes, several popular e-sports titles are included." },
    ],
  },
  age: {
    title: "Guess My Age",
    description: "Our life-stage engine estimates your age from generational tech, career, and milestone questions.",
    heroBlurb: "How old are you? Answer honest questions about your life stage and we'll guess your age.",
    faqs: [
      { question: "How does the age engine work?", answer: "It uses range narrowing: each answer constrains the possible age range until it's narrow enough to guess." },
      { question: "How accurate is it?", answer: "Within 3–5 years for most adults after 8–15 questions." },
    ],
  },
};

export default function CategoryPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";

  const [relatedCategories, setRelatedCategories] = useState<
    { slug: string; name: string; icon: string | null; color: string | null }[]
  >([]);
  const [totalEntities, setTotalEntities] = useState(0);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        const cats = (data.categories ?? []) as {
          slug: string; name: string; icon: string | null; color: string | null;
          _count?: { entities: number };
        }[];
        setRelatedCategories(cats.filter((c) => c.slug !== slug).slice(0, 4));
        const current = cats.find((c) => c.slug === slug);
        setTotalEntities(current?._count?.entities ?? 0);
      })
      .catch(() => {});
  }, [slug]);

  const meta = CATEGORY_META[slug] ?? {
    title: `Guess the ${slug.charAt(0).toUpperCase() + slug.slice(1)}`,
    description: `AI-powered guessing game for ${slug}.`,
    heroBlurb: `Think of a ${slug} and our AI will try to guess it.`,
    faqs: [],
  };

  return (
    <CategoryTemplate
      category={slug}
      title={meta.title}
      description={meta.description}
      heroBlurb={meta.heroBlurb}
      faqs={meta.faqs}
      relatedCategories={relatedCategories}
      totalEntities={totalEntities}
    />
  );
}
