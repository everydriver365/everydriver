import { isDrive365Domain, isInstructorSubdomain, getInstructorSubdomain } from "./DomainRouter";
import Index from "@/pages/Index";
import InstructorFeatures from "@/pages/instructor-app/InstructorFeatures";
import MiniWebsiteHome from "@/pages/mini-website/MiniWebsiteHome";

/**
 * Renders the appropriate homepage based on the current domain.
 * 
 * SWAPPED CONFIGURATION:
 * - Instructor subdomains (e.g., jane-smith.everydriver.co.uk) -> Mini website
 * - drive365.co.uk -> Learner homepage (find instructors, book lessons)
 * - everydriver.co.uk -> Instructor marketing page
 */
export function ConditionalHome() {
  // Check for instructor subdomain first (e.g., jane-smith.everydriver.co.uk)
  if (isInstructorSubdomain()) {
    const slug = getInstructorSubdomain();
    return <MiniWebsiteHome subdomainSlug={slug} />;
  }
  
  // SWAPPED: Drive365 = Learner site
  if (isDrive365Domain()) {
    return <Index />;
  }
  
  // SWAPPED: EveryDriver = Instructor site (default for localhost, lovable.app, etc.)
  return <InstructorFeatures />;
}
