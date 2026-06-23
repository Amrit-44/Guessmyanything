import { LegalPage } from "@/components/legal-page";
import { Link } from "wouter";

export default function BlogGuessAgeTricks() {
  return (
    <LegalPage title="How to Trick the Age Guessing Engine (And Why It's Hard)">
      <p>The <Link href="/category/age" className="text-indigo-600 hover:underline">Guess My Age</Link> engine uses life-stage range narrowing rather than direct numeric questions. Here's how it works — and how to test its limits.</p>
      <h2 className="text-xl font-bold text-black mt-8 mb-3">How the engine works</h2>
      <p>Every answer constrains a possible age range. "Yes, I grew up with dial-up internet" narrows the range to roughly 28–100. "No, I'm not retired" narrows from the other end. After 8–15 questions, the range is narrow enough to guess.</p>
      <h2 className="text-xl font-bold text-black mt-8 mb-3">Tier 1: Technology touchstones</h2>
      <p>These questions are the most powerful — rotary phones, VHS tapes, dial-up internet, MySpace, and smartphones from childhood all tightly constrain age ranges.</p>
      <h2 className="text-xl font-bold text-black mt-8 mb-3">Tier 2: Education and career milestones</h2>
      <p>Currently in university? Recent graduate? Experienced professional? Retired? These questions bisect the range in the 20–65 zone.</p>
      <h2 className="text-xl font-bold text-black mt-8 mb-3">Tier 3: Life events</h2>
      <p>Mortgage, children, independence from parents — these narrow the 25–45 band precisely.</p>
      <h2 className="text-xl font-bold text-black mt-8 mb-3">Tier 4: Direct numeric bisection</h2>
      <p>When the range is still wide after tier 3, the engine asks direct bisection questions like "Are you closer to your 20s than your 40s?"</p>
      <h2 className="text-xl font-bold text-black mt-8 mb-3">How to trick it</h2>
      <p>The hardest case is a 35-year-old who grew up in a developing country with delayed tech adoption — their technology answers may suggest an older person. The engine handles this reasonably but may err by 5–8 years. Answer honestly for best results.</p>
    </LegalPage>
  );
}
