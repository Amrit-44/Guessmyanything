import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
export const metadata: Metadata = { title: "Cookie Policy — GUESS MY ANYTHING" };
export default function CookiesPage() { return <LegalPage title="Cookie Policy"><p>We use only <strong>functional cookies</strong> — theme preference and sound toggle. No personal information.</p><p>We do <strong>NOT</strong> use advertising, tracking, or third-party cookies.</p><p>Under GDPR, our use of only essential cookies means no consent banner is required.</p></LegalPage>; }
