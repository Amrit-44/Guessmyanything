import type { Metadata, Viewport } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const pressStart = Press_Start_2P({
  variable: "--font-pixel",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const vt323 = VT323({
  variable: "--font-retro",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const SITE_URL = "https://guess-my-anything.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "GUESS MY ANYTHING — AI Guessing Game",
    template: "%s | GUESS MY ANYTHING",
  },
  description:
    "Think of anything — a job, character, animal, country, movie, celebrity, brand, and more. The AI asks smart questions and guesses what you're thinking. A modern, adaptive guessing game powered by an intelligent engine.",
  keywords: [
    "guessing game",
    "akinator",
    "ai game",
    "think of anything",
    "20 questions",
    "ai guessing",
    "arcade game",
    "pixel game",
    "what am i thinking",
  ],
  authors: [{ name: "GUESS MY ANYTHING" }],
  creator: "GUESS MY ANYTHING",
  applicationName: "GUESS MY ANYTHING",
  keywords: ["guessing game", "akinator", "ai game", "think of anything", "20 questions"],
  openGraph: {
    title: "GUESS MY ANYTHING — AI Guessing Game",
    description:
      "Think of anything. The AI asks smart questions and guesses it. A modern arcade-style guessing game.",
    url: SITE_URL,
    siteName: "GUESS MY ANYTHING",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "GUESS MY ANYTHING — AI Guessing Game",
    description:
      "Think of anything. The AI asks smart questions and guesses it. A modern arcade-style guessing game.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  category: "games",
};

export const viewport: Viewport = {
  themeColor: "#0f0524",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "GUESS MY ANYTHING",
  description:
    "Think of anything. The AI asks smart questions and guesses what you're thinking. A modern arcade-style AI guessing game.",
  applicationCategory: "Game",
  operatingSystem: "Web",
  genre: "Quiz",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  url: SITE_URL,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${pressStart.variable} ${vt323.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
