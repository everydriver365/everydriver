import { isInstructorSubdomain, getInstructorSubdomain } from "@/components/DomainRouter";
import { lazy } from "react";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import MiniWebsiteAbout from "@/pages/mini-website/MiniWebsiteAbout";
import MiniWebsiteContact from "@/pages/mini-website/MiniWebsiteContact";
import MiniWebsiteServices from "@/pages/mini-website/MiniWebsiteServices";
import MiniWebsiteReviews from "@/pages/mini-website/MiniWebsiteReviews";

const Reviews = lazy(() => import("@/pages/Reviews"));
const Courses = lazy(() => import("@/pages/Courses"));

/**
 * Conditional route components that render different content based on the host.
 *
 * RULE: Whitelabel custom domains MUST NEVER render `MiniWebsite*` components.
 * They render the standard Drive365 pages, rebranded via `getWhitelabelConfig()`
 * / `useRouteLogo`, so the bottom nav and visual language stay consistent.
 *
 * - Instructor subdomain (`{slug}.everydriver.co.uk`) → `/i/{slug}` mini-site
 * - Whitelabel custom domain (e.g. winchesterdrivingschool.co.uk) → standard Drive365 pages
 * - Bare Drive365 → standard Drive365 pages
 */

export function ConditionalAbout() {
  if (isInstructorSubdomain()) {
    const slug = getInstructorSubdomain();
    return <MiniWebsiteAbout subdomainSlug={slug} />;
  }
  return <About />;
}

export function ConditionalContact() {
  if (isInstructorSubdomain()) {
    const slug = getInstructorSubdomain();
    return <MiniWebsiteContact subdomainSlug={slug} />;
  }
  return <Contact />;
}

export function ConditionalServices() {
  if (isInstructorSubdomain()) {
    const slug = getInstructorSubdomain();
    return <MiniWebsiteServices subdomainSlug={slug} />;
  }
  // Whitelabel + bare Drive365 → use the Courses page as the canonical
  // "services" surface, rebranded via getWhitelabelConfig().
  return <Courses />;
}

export function ConditionalReviews() {
  if (isInstructorSubdomain()) {
    const slug = getInstructorSubdomain();
    return <MiniWebsiteReviews subdomainSlug={slug} />;
  }
  return <Reviews />;
}
