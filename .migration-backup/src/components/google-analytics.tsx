import Script from "next/script";

/**
 * Google Analytics component.
 * Only loads when NEXT_PUBLIC_GA_ID is set (e.g. "G-XXXXXXXXXX").
 * To enable: add NEXT_PUBLIC_GA_ID to your .env or Vercel env vars.
 * If not set, this component renders nothing — no impact on performance.
 */
export function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  if (!gaId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `}
      </Script>
    </>
  );
}
