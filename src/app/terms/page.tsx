import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Terms of Service — GUESS MY ANYTHING" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <p><strong>Last updated: {new Date().getFullYear()}</strong></p>
      <p>
        By accessing and using Guess My Anything (&quot;the Service&quot;), you agree
        to be bound by these Terms of Service.
      </p>
      <h2 className="text-base font-bold">Acceptance of Terms</h2>
      <p>
        By using the Service, you accept these terms in full. If you disagree with
        any part, do not use the Service.
      </p>
      <h2 className="text-base font-bold">Use of the Service</h2>
      <p>
        The Service is a free, browser-based guessing game. You may use it for
        personal, non-commercial entertainment. You agree not to:
      </p>
      <ul className="list-disc pl-6 space-y-1">
        <li>Use the Service for any unlawful purpose</li>
        <li>Attempt to reverse-engineer, hack, or disrupt the Service</li>
        <li>Use automated tools to abuse the game API</li>
        <li>Submit inappropriate or offensive content via the learning forms</li>
      </ul>
      <h2 className="text-base font-bold">Intellectual Property</h2>
      <p>
        The Service&apos;s software, design, and content are protected by intellectual
        property laws. The datasets (entities, questions, tags) are curated by the
        developers.
      </p>
      <h2 className="text-base font-bold">Disclaimer</h2>
      <p>
        The Service is provided &quot;as is&quot; without warranties of any kind. We do
        not guarantee that the AI will always guess correctly or that the Service
        will be uninterrupted.
      </p>
      <h2 className="text-base font-bold">Limitation of Liability</h2>
      <p>
        We shall not be liable for any indirect, incidental, or consequential
        damages arising from the use of the Service.
      </p>
      <h2 className="text-base font-bold">Changes to Terms</h2>
      <p>
        We may update these Terms at any time. Continued use of the Service after
        changes constitutes acceptance of the new Terms.
      </p>
    </LegalPage>
  );
}
