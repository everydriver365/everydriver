import { isDrive365Domain, isInstructorSubdomain, getInstructorSubdomain, isAccessibleDomain } from "./DomainRouter";
import { isWhitelabelDomain } from "@/lib/whitelabel";
import { lazy } from "react";
import HomepageRedesignDemo from "@/pages/HomepageRedesignDemo";
import MiniWebsiteHome from "@/pages/mini-website/MiniWebsiteHome";
import AccessibleHome from "@/pages/accessible/AccessibleHome";

const Index = lazy(() => import("@/pages/Index"));

/**
 * Renders the appropriate homepage based on the current domain.
 *
 * - drive365accessible.co.uk -> Drive365 Accessible landing
 * - Whitelabel domains (e.g. winchesterdrivingschool.co.uk) -> Drive365 learner homepage (rebranded)
 * - Instructor subdomains (e.g., jane-smith.everydriver.co.uk) -> Mini website
 * - drive365.co.uk -> Learner homepage
 * - everydriver.co.uk -> Instructor marketing page
 */
export function ConditionalHome() {
  if (isAccessibleDomain()) {
    return <AccessibleHome />;
  }
  if (isWhitelabelDomain()) {
    return <Index />;
  }
  if (isInstructorSubdomain()) {
    const slug = getInstructorSubdomain();
    return <MiniWebsiteHome subdomainSlug={slug} />;
  }
  if (isDrive365Domain()) {
    return <Index />;
  }
  return <HomepageRedesignDemo />;
}

