import { LegalPage } from "@/components/legal-page";

export default function ImprintPage() {
  return (
    <LegalPage title="Imprint">
      <p>
        This website is operated as a personal project.
      </p>
      <p>
        Contact:{" "}
        <a href="mailto:contact@guess-my-anything.app" className="text-indigo-600 underline">
          contact@guess-my-anything.app
        </a>
      </p>
    </LegalPage>
  );
}
