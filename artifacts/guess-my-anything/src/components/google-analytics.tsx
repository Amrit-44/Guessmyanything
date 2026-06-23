export function GoogleAnalytics() {
  const gaId = (import.meta as any).env?.VITE_GA_ID as string | undefined;
  if (!gaId) return null;
  return null; // GA scripts loaded in index.html when VITE_GA_ID is set
}
