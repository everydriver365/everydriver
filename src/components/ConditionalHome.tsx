import { isDrive365Domain, isInstructorSubdomain, getInstructorSubdomain } from "./DomainRouter";
import Index from "@/pages/Index";
import Drive365Home from "@/pages/instructor-app/Drive365Home";
import MiniWebsiteHome from "@/pages/mini-website/MiniWebsiteHome";

/**
 * Renders the appropriate homepage based on the current domain.
 * - Instructor subdomains (e.g., jane-smith.everydriver.co.uk) -> Mini website
 * - drive365.co.uk -> Instructor marketing page
 * - everydriver.co.uk -> Learner homepage
 */
export function ConditionalHome() {
  // Check for instructor subdomain first (e.g., jane-smith.everydriver.co.uk)
  if (isInstructorSubdomain()) {
    const slug = getInstructorSubdomain();
    return <MiniWebsiteHome subdomainSlug={slug} />;
  }
  
  // Check domain at render time
  if (isDrive365Domain()) {
    return <Drive365Home />;
  }
  
  return <Index />;
}