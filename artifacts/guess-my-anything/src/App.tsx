import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

// Pages
import HomePage from "@/pages/home";
import AboutPage from "@/pages/about";
import ContactPage from "@/pages/contact";
import FaqPage from "@/pages/faq";
import PrivacyPage from "@/pages/privacy";
import TermsPage from "@/pages/terms";
import CookiesPage from "@/pages/cookies";
import ImprintPage from "@/pages/imprint";
import AdminPage from "@/pages/admin";
import NotFound from "@/pages/not-found";

// Category pages
import CategoryPage from "@/pages/category";

// Blog pages
import BlogBestGuessingGames from "@/pages/blog/best-guessing-games";
import BlogGuessAgeTricks from "@/pages/blog/guess-age-tricks";
import BlogGuessAnimalStrategies from "@/pages/blog/guess-animal-strategies";
import BlogGuessCountryTips from "@/pages/blog/guess-country-tips";
import BlogHowToGuessAnything from "@/pages/blog/how-to-guess-anything";
import BlogJobsGamingGuide from "@/pages/blog/jobs-gaming-guide";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/faq" component={FaqPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/cookies" component={CookiesPage} />
      <Route path="/imprint" component={ImprintPage} />
      <Route path="/admin-4454" component={AdminPage} />
      <Route path="/category/:slug" component={CategoryPage} />
      <Route path="/blog/best-guessing-games" component={BlogBestGuessingGames} />
      <Route path="/blog/guess-age-tricks" component={BlogGuessAgeTricks} />
      <Route path="/blog/guess-animal-strategies" component={BlogGuessAnimalStrategies} />
      <Route path="/blog/guess-country-tips" component={BlogGuessCountryTips} />
      <Route path="/blog/how-to-guess-anything" component={BlogHowToGuessAnything} />
      <Route path="/blog/jobs-gaming-guide" component={BlogJobsGamingGuide} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
