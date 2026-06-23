import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
export const metadata: Metadata = { title: "Privacy Policy — GUESS MY ANYTHING" };
export default function PrivacyPage() { return <LegalPage title="Privacy Policy"><p>We do <strong>not</strong> require accounts, registrations, or personal information. Game sessions are anonymous and temporary.</p><p>We use only functional cookies (theme preference and sound toggle). We do <strong>not</strong> use advertising or tracking cookies.</p><p>Under GDPR and CCPA, you have the right to access, correct, or delete your personal data. Since we do not collect personal data, these rights are inherently satisfied.</p></LegalPage>; }
