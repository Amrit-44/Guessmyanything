import type { Metadata, Viewport } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { GoogleAnalytics } from "@/components/google-analytics";

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
    default: "Guess My Anything - Free AI Guessing Game | 20 Questions",
    template: "%s | Guess My Anything",
  },
  description:
    "Play the ultimate AI guessing game! Think of a job, country, animal, sport, or your age. Answer 20 questions and watch our AI read your mind. Free & fun!",
  keywords: [
    "guess my anything",
    "ai guessing game",
    "online guessing game",
    "20 questions game",
    "guess my job",
    "guess the country",
    "guess the animal",
    "guess my age",
    "guess the sport",
    "what am i quiz",
    "guessing game free",
    "guess my occupation",
    "guess my nationality",
    "guess my favorite animal",
    "guess my age accurately",
    "akinator",
  ],
  authors: [{ name: "Guess My Anything" }],
  creator: "Guess My Anything",
  applicationName: "Guess My Anything",
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: "Guess My Anything - Free AI Guessing Game | 20 Questions",
    description:
      "Play the ultimate AI guessing game! Think of a job, country, animal, sport, or your age. Answer 20 questions and watch our AI read your mind. Free & fun!",
    url: SITE_URL,
    siteName: "Guess My Anything",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Guess My Anything - Free AI Guessing Game",
    description:
      "Think of anything. Our AI asks 20 questions and guesses it. Play free!",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: "/favicon.ico",
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
  name: "Guess My Anything",
  description:
    "Free AI-powered guessing game where you think of a job, country, animal, sport, or age and the AI guesses it through 20 questions.",
  applicationCategory: "Game",
  operatingSystem: "Web",
  browserRequirements: "Requires JavaScript",
  genre: "Quiz",
  url: SITE_URL,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    reviewCount: "1523",
  },
  featureList: [
    "Guess My Job - 354+ careers",
    "Guess the Country - 192 nations",
    "Guess the Animal - 151+ species",
    "Guess the Sport - 180+ sports",
    "Guess My Age - life-stage engine",
  ],
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
        <GoogleAnalytics />
      </body>
    </html>
  );
}
