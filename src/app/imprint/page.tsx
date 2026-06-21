import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Imprint — GUESS MY ANYTHING" };

export default function ImprintPage() {
  return (
    <LegalPage title="Imprint (Impressum)">
      <p>
        As required by § 5 TMG (German Telemedia Act) and similar regulations:
      </p>
      <h2 className="text-base font-bold">Service Provider</h2>
      <p>
        Guess My Anything<br />
        operated by the development team
      </p>
      <h2 className="text-base font-bold">Contact</h2>
      <p>
        Email: <a href="mailto:contact@guess-my-anything.app" className="text-primary underline">
          contact@guess-my-anything.app
        </a>
      </p>
      <h2 className="text-base font-bold">Responsible for Content</h2>
      <p>
        The development team of Guess My Anything is responsible for the content
        of this website according to § 55 Abs. 2 RStV.
      </p>
      <h2 className="text-base font-bold">Disclaimer</h2>
      <p>
        The content of this website has been prepared with the greatest possible
        care. However, we cannot guarantee the contents&apos; accuracy, completeness,
        or topicality.
      </p>
      <h2 className="text-base font-bold">Copyright</h2>
      <p>
        The content and works created by the site operators on these pages are
        subject to applicable copyright law. Duplication, processing, distribution,
        or any form of commercialization of such material beyond the scope of
        copyright law requires the written consent of its respective author.
      </p>
    </LegalPage>
  );
}
