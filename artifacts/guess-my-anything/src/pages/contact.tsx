import { LegalPage } from "@/components/legal-page";

export default function ContactPage() {
  return (
    <LegalPage title="Contact Us">
      <p>
        Email:{" "}
        <a href="mailto:contact@guess-my-anything.app" className="text-indigo-600 underline">
          contact@guess-my-anything.app
        </a>
      </p>
      <p>You can also use the in-game feedback feature when the AI fails to guess.</p>
      <p>We aim to respond to all inquiries within 48 hours.</p>
    </LegalPage>
  );
}
