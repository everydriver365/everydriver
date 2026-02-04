import { isDrive365Domain, isInstructorSubdomain, getInstructorSubdomain } from "./DomainRouter";
import Index from "@/pages/Index";
import EveryDriverInstructorHome from "@/pages/instructor-app/EveryDriverInstructorHome";
import MiniWebsiteHome from "@/pages/mini-website/MiniWebsiteHome";
import { useSearchParams } from "react-router-dom";

/**
 * Renders the appropriate homepage based on the current domain.
 * 
 * SWAPPED CONFIGURATION:
 * - Instructor subdomains (e.g., jane-smith.everydriver.co.uk) -> Mini website
 * - drive365.co.uk -> Learner homepage (find instructors, book lessons)
 * - everydriver.co.uk -> Instructor marketing page
 * 
 * For testing: Add ?site=learner to URL to preview the learner homepage
 */
export function ConditionalHome() {
  const [searchParams] = useSearchParams();
  const siteOverride = searchParams.get("site");
  
  // Allow testing learner site in preview with ?site=learner
  if (siteOverride === "learner") {
    return <Index />;
  }
  
  // Allow testing instructor site in preview with ?site=instructor
  if (siteOverride === "instructor") {
    return <EveryDriverInstructorHome />;
  }
  
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
  return <EveryDriverInstructorHome />;
}
