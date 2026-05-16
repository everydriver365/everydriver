import { useLocation } from "react-router-dom";
import { HeroSearchSection } from "./HeroSearchSection";
import { isEveryDriverHost, isWhitelabelDomain } from "@/lib/whitelabel";
import drive365HeroTestCentre from "@/assets/drive365-hero-driver.webp";

/**
 * Drive365 marketing pages share the same hero as the Drive365 homepage.
 * Rendered inside <MainLayout> so it appears at the top of every relevant
 * Drive365 page (Test Swap, FAQs, Help, Theory, Intensives, Franchise, etc.).
 *
 * Excluded:
 * - homepages (which render the hero themselves)
 * - search/results pages, booking flow, pupil portal, auth flows
 * - non-Drive365 brand surfaces (EveryDriver host, whitelabel domains, mini-sites)
 */

// Routes (or prefixes) where we DO NOT want to inject the hero.
const EXCLUDED_EXACT = new Set<string>([
  "/search",
  "/drive365/search",
  "/courses",
  "/booking-confirmation",
  "/pupil",
  "/pupil/login",
  "/pupil/install",
  "/reset-password",
  "/auth/redirect",
  "/sitemap.xml",
  "/test-swap",
]);

const EXCLUDED_PREFIXES = [
  "/book/",
  "/pupil/login/",
  "/p/",
  "/i/",
  "/areas/",
  "/school/",
  "/booking/",
  "/availability/",
  "/sign/",
  "/quote/",
  "/pay/",
  "/news/", // article pages — keep article-level hero
  "/test-swap/register",
  "/test-swap/matches",
  "/accessible",
  "/franchise-demo",
  "/winchester",
  "/admin",
  "/instructor",
  "/parent",
];

export function Drive365MarketingHero() {
  const { pathname } = useLocation();

  // Not Drive365 brand → skip
  if (isEveryDriverHost()) return null;
  if (isWhitelabelDomain()) return null;

  if (EXCLUDED_EXACT.has(pathname)) return null;
  if (EXCLUDED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p))) {
    return null;
  }

  return (
    <div className="pt-6 sm:pt-8">
      <HeroSearchSection backgroundImage={drive365HeroTestCentre} />
      {/* Spacer for the overhanging desktop search pill */}
      <div className="hidden sm:block h-10" />
    </div>
  );
}
