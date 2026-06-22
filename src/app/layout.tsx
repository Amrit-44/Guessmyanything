import type { Metadata, Viewport } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import Script from "next/script"; // <-- Imported Next.js Script component
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
  verification: {
    google: "xz3kaqjvz2667MVtQAaZYTp3Ju44Yd33jQvTY99DwTg",
  },
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
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  url: SITE_URL,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* 1. Google Tag Manager (head script) */}
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-WLKLGPDH');`}
        </Script>
      </head>
      <body className={`${pressStart.variable} ${vt323.variable} antialiased`}>
        {/* 2. Google Tag Manager (noscript fallback right after body) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-WLKLGPDH"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
