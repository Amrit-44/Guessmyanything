import { LegalPage } from "@/components/legal-page";
import { Link } from "wouter";

export default function BlogJobsGamingGuide() {
  return (
    <LegalPage title="The Career Guessing Game Guide: 354+ Jobs Explained">
      <p>The <Link href="/category/jobs" className="text-indigo-600 hover:underline">Guess My Job</Link> mode is our most complex category. Here's how the engine handles 354+ careers across 16 industries.</p>
      <h2 className="text-xl font-bold text-black mt-8 mb-3">The 8-attribute job fingerprint</h2>
      <p>Every job is tagged with: industry, work environment (office, outdoor, remote, clinical…), education required, salary tier, experience level, physical demand, tools used, and core skills. These 8 axes create a unique fingerprint for each career.</p>
      <h2 className="text-xl font-bold text-black mt-8 mb-3">Industry detection and locking</h2>
      <p>The first few questions are industry probes — they identify whether you're in Healthcare, Technology, Education, Finance, and so on. Once an industry exceeds 65% confidence, the engine locks to that industry and asks more specific questions within it.</p>
      <h2 className="text-xl font-bold text-black mt-8 mb-3">The 16 industries</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Healthcare, Technology, Education, Business</li>
        <li>Finance, Construction, Transportation, Government</li>
        <li>Agriculture, Science, Arts, Hospitality</li>
        <li>Legal, Manufacturing (+ more)</li>
      </ul>
      <h2 className="text-xl font-bold text-black mt-8 mb-3">Hardest jobs to guess</h2>
      <p>Niche professions like Sommelier, Underwater Welder, Volcanologist, and Ethnomusicologist share few tags with common jobs. They typically require 18–22 questions. The engine's multi-guess safety net (3 attempts) helps cover these edge cases.</p>
      <h2 className="text-xl font-bold text-black mt-8 mb-3">Tips for testing</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Pick a hybrid role (e.g., Software Engineer in Healthcare = tricky cross-industry)</li>
        <li>Try a creative professional (Illustrator, Composer, Choreographer)</li>
        <li>Pick a historical profession that still exists (Blacksmith, Cooper, Chandler)</li>
      </ul>
    </LegalPage>
  );
}
