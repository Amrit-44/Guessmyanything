import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Privacy Policy — GUESS MY ANYTHING" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p><strong>Last updated: {new Date().getFullYear()}</strong></p>
      <p>
        Guess My Anything (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) respects your privacy.
        This Privacy Policy explains how we handle your data.
      </p>
      <h2 className="text-base font-bold">Data We Collect</h2>
      <p>
        We do <strong>not</strong> require accounts, registrations, or personal
        information to play. Game sessions are anonymous and temporary. We do not
        collect names, emails, IP addresses, or tracking identifiers.
      </p>
      <h2 className="text-base font-bold">Anonymous Analytics</h2>
      <p>
        We may collect aggregated, anonymous analytics (such as total games played,
        win rates, and category popularity) to improve the game. This data cannot
        be used to identify you personally.
      </p>
      <h2 className="text-base font-bold">Cookies</h2>
      <p>
        We use only functional cookies (e.g., theme preference and sound toggle).
        We do <strong>not</strong> use advertising, tracking, or third-party cookies.
        See our <a href="/cookies" className="text-primary underline">Cookie Policy</a> for details.
      </p>
      <h2 className="text-base font-bold">Data Retention</h2>
      <p>
        Game session data is stored temporarily and may be periodically cleaned up.
        Learning data (when the AI fails to guess) is stored to improve accuracy
        but contains no personal identifiers.
      </p>
      <h2 className="text-base font-bold">Your Rights (GDPR/CCPA)</h2>
      <p>
        Under GDPR and CCPA, you have the right to access, correct, or delete your
        personal data. Since we do not collect personal data, these rights are
        inherently satisfied. If you believe we have collected your data, please
        <a href="/contact" className="text-primary underline"> contact us</a>.
      </p>
      <h2 className="text-base font-bold">Children&apos;s Privacy</h2>
      <p>
        Our service is suitable for all ages. We do not knowingly collect any data
        from children under 13 (or the applicable age in your jurisdiction).
      </p>
      <h2 className="text-base font-bold">Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. Changes will be posted
        on this page with an updated date.
      </p>
    </LegalPage>
  );
}
