import { isDrive365Domain, isInstructorSubdomain, getInstructorSubdomain } from "./DomainRouter";
import { lazy } from "react";

const Index = lazy(() => import("@/pages/Index"));
const MiniWebsiteHome = lazy(() => import("@/pages/mini-website/MiniWebsiteHome"));
const HomepageRedesignDemo = lazy(() => import("@/pages/HomepageRedesignDemo"));

/**
 * Renders the appropriate homepage based on the current domain.
 * 
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
  
  // Drive365 = Learner site
  if (isDrive365Domain()) {
    return <Index />;
  }
  
  // EveryDriver = Instructor site (default for localhost, lovable.app, etc.)
  return <InstructorAppHome />;
}
