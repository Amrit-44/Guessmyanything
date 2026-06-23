import { LegalPage } from "@/components/legal-page";

export default function CookiesPage() {
  return (
    <LegalPage title="Cookie Policy">
      <p>
        We use only essential functional cookies. We do <strong>not</strong> use advertising,
        analytics, or tracking cookies.
      </p>
      <p>
        <strong>Theme preference</strong> — stores whether you prefer dark or light mode.
      </p>
      <p>
        <strong>Sound toggle</strong> — remembers whether you have sounds enabled.
      </p>
      <p>
        You can disable cookies in your browser settings, though this may affect the game experience.
      </p>
    </LegalPage>
  );
}
