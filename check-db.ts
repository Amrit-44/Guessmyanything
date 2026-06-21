import { db } from "./src/lib/db";

async function main() {
  const cats = await db.category.findMany({ include: { _count: { select: { entities: true, questions: true } } }, orderBy: { sortOrder: 'asc' } });
  console.log("=== CATEGORIES ===");
  for (const c of cats) {
    console.log(`${c.slug.padEnd(15)} entities=${c._count.entities}  questions=${c._count.questions}`);
  }
  const animalsCat = await db.category.findUnique({ where: { slug: 'animals' } });
  if (animalsCat) {
    const animals = await db.entity.findMany({ where: { categoryId: animalsCat.id }, select: { name: true, slug: true }, orderBy: { name: 'asc' } });
    console.log("\n=== ANIMALS ===");
    console.log(animals.map(a => a.name).join(', '));
  }
  const sportsCat = await db.category.findUnique({ where: { slug: 'sports' } });
  if (sportsCat) {
    const sports = await db.entity.findMany({ where: { categoryId: sportsCat.id }, select: { name: true }, orderBy: { name: 'asc' } });
    console.log(`\n=== SPORTS (count=${sports.length}) ===`);
    console.log(sports.map(s => s.name).join(', '));
  }
  const countriesCat = await db.category.findUnique({ where: { slug: 'countries' } });
  if (countriesCat) {
    const countries = await db.entity.findMany({ where: { categoryId: countriesCat.id }, select: { name: true }, orderBy: { name: 'asc' } });
    console.log(`\n=== COUNTRIES (count=${countries.length}) ===`);
    console.log(countries.map(c => c.name).join(', '));
  }
  const ageQCount = await db.ageQuestion.count();
  console.log(`\n=== AGE QUESTIONS: ${ageQCount} ===`);
  const totalEntities = await db.entity.count();
  const totalQs = await db.question.count();
  const totalTags = await db.tag.count();
  console.log(`\nTOTALS: entities=${totalEntities}  questions=${totalQs}  tags=${totalTags}`);
  await db.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
