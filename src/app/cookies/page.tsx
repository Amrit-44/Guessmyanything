import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Cookie Policy — GUESS MY ANYTHING" };

export default function CookiesPage() {
  return (
    <LegalPage title="Cookie Policy">
      <p><strong>Last updated: {new Date().getFullYear()}</strong></p>
      <p>
        This Cookie Policy explains how Guess My Anything uses cookies and similar
        technologies.
      </p>
      <h2 className="text-base font-bold">What Are Cookies?</h2>
      <p>
        Cookies are small text files stored on your device when you visit a
        website. They are widely used to make websites work more efficiently.
      </p>
      <h2 className="text-base font-bold">Cookies We Use</h2>
      <p>
        We use only <strong>functional cookies</strong> — these are necessary for
        the basic functionality of the game:
      </p>
      <ul className="list-disc pl-6 space-y-1">
        <li><strong>Theme preference</strong> — remembers if you chose dark or light mode</li>
        <li><strong>Sound toggle</strong> — remembers if you enabled or muted arcade sounds</li>
      </ul>
      <p>
        These cookies are stored locally in your browser and do not contain any
        personal information.
      </p>
      <h2 className="text-base font-bold">Cookies We Do NOT Use</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>❌ Advertising cookies</li>
        <li>❌ Third-party tracking cookies (Google Analytics, Facebook Pixel, etc.)</li>
        <li>❌ Behavioral profiling cookies</li>
        <li>❌ Social media cookies</li>
      </ul>
      <h2 className="text-base font-bold">Managing Cookies</h2>
      <p>
        You can control and delete cookies through your browser settings. Note
        that disabling functional cookies may affect the game experience (e.g.,
        the theme won&apos;t persist between visits).
      </p>
      <h2 className="text-base font-bold">GDPR Compliance</h2>
      <p>
        Under GDPR, our use of only essential/functional cookies means no consent
        banner is required. We do not process personal data through cookies.
      </p>
    </LegalPage>
  );
}
