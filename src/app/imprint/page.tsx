import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
export const metadata: Metadata = { title: "Imprint — GUESS MY ANYTHING" };
export default function ImprintPage() { return <LegalPage title="Imprint (Impressum)"><p>Guess My Anything, operated by the development team.</p><p>Email: <a href="mailto:contact@guess-my-anything.app" className="text-indigo-600 underline">contact@guess-my-anything.app</a></p><p>The content has been prepared with the greatest possible care. However, we cannot guarantee accuracy.</p></LegalPage>; }
