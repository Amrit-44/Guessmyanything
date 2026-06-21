import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Contact Us — GUESS MY ANYTHING" };

export default function ContactPage() {
  return (
    <LegalPage title="Contact Us">
      <p>
        We&apos;d love to hear from you! Whether you have feedback, a bug report,
        a feature request, or just want to say hello, here&apos;s how to reach us:
      </p>
      <h2 className="text-base font-bold">Email</h2>
      <p>
        <a href="mailto:contact@guess-my-anything.app" className="text-primary underline">
          contact@guess-my-anything.app
        </a>
      </p>
      <h2 className="text-base font-bold">Feedback</h2>
      <p>
        You can also use the in-game feedback feature. When the AI fails to guess,
        you&apos;ll see a &quot;Teach Me&quot; form — your input helps improve the game
        for everyone.
      </p>
      <h2 className="text-base font-bold">Bug Reports</h2>
      <p>
        If you encounter a bug or error, please describe what happened, what you
        were doing, and which category you were playing. Screenshots are very
        helpful!
      </p>
      <h2 className="text-base font-bold">Response Time</h2>
      <p>
        We aim to respond to all inquiries within 48 hours.
      </p>
    </LegalPage>
  );
}
