import { isInstructorSubdomain, getInstructorSubdomain } from "@/components/DomainRouter";
import { getWhitelabelConfig } from "@/lib/whitelabel";
import { lazy } from "react";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import MiniWebsiteAbout from "@/pages/mini-website/MiniWebsiteAbout";
import MiniWebsiteContact from "@/pages/mini-website/MiniWebsiteContact";
import MiniWebsiteServices from "@/pages/mini-website/MiniWebsiteServices";
import MiniWebsiteReviews from "@/pages/mini-website/MiniWebsiteReviews";

const Reviews = lazy(() => import("@/pages/Reviews"));

/**
 * Conditional route components that render different content based on the host.
 *
 * - Instructor subdomain (`{slug}.everydriver.co.uk`)  → small `/i/{slug}` mini-site components
 * - Whitelabel custom domain (e.g. winchesterdrivingschool.co.uk) → full Drive365 clone pages,
 *   rebranded via `useRouteLogo`/`getWhitelabelConfig`. Never the mini-site components,
 *   so the bottom nav and visual language stay consistent across the standalone site.
 * - Bare Drive365 → standard learner pages
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
  // Whitelabel domains render the standard Drive365 Contact page (rebranded
  // via the brand resolver) so they stay consistent with the rest of the site.
  return <Contact />;
}

export function ConditionalServices() {
  if (isInstructorSubdomain()) {
    const slug = getInstructorSubdomain();
    return <MiniWebsiteServices subdomainSlug={slug} />;
  }
  // Whitelabel + bare Drive365 don't have a /services page yet.
  return null;
}

export function ConditionalReviews() {
  if (isInstructorSubdomain()) {
    const slug = getInstructorSubdomain();
    return <MiniWebsiteReviews subdomainSlug={slug} />;
  }
  // Whitelabel + bare Drive365 → standard rebranded reviews page.
  return <Reviews />;
}
