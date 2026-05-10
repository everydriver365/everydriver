import { isInstructorSubdomain, getInstructorSubdomain } from "@/components/DomainRouter";
import { getWhitelabelConfig } from "@/lib/whitelabel";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import MiniWebsiteAbout from "@/pages/mini-website/MiniWebsiteAbout";
import MiniWebsiteContact from "@/pages/mini-website/MiniWebsiteContact";
import MiniWebsiteServices from "@/pages/mini-website/MiniWebsiteServices";
import MiniWebsiteReviews from "@/pages/mini-website/MiniWebsiteReviews";

/**
 * Conditional route components that render different content
 * based on whether we're on an instructor subdomain or the main site.
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
  // Main site doesn't have a /services page, redirect to home or show 404
  return null;
}

export function ConditionalReviews() {
  if (isInstructorSubdomain()) {
    const slug = getInstructorSubdomain();
    return <MiniWebsiteReviews subdomainSlug={slug} />;
  }
  // Main site doesn't have a /reviews page
  return null;
}
