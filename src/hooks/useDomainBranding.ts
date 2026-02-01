import { useMemo } from "react";

export interface DomainBranding {
  brandName: string;
  logoPath: string;
  isInstructorDomain: boolean;
  isLearnerDomain: boolean;
  homeLink: string;
}

// Domain configurations - SWAPPED: drive365 = learners, everydriver = instructors
const DRIVE365_DOMAINS = ["drive365.co.uk", "www.drive365.co.uk"];
const EVERYDRIVER_BASE_DOMAIN = "everydriver.co.uk";

/**
 * Checks if the current hostname is a Drive365 domain (learner site)
 */
function isDrive365Domain(): boolean {
  const hostname = window.location.hostname.toLowerCase();
  return DRIVE365_DOMAINS.some(domain => hostname.includes(domain.replace("www.", "")));
}

/**
 * Checks if the current hostname is an EveryDriver domain (instructor site)
 */
function isEveryDriverDomain(): boolean {
  const hostname = window.location.hostname.toLowerCase();
  return hostname.includes(EVERYDRIVER_BASE_DOMAIN) || 
         hostname.endsWith(`.${EVERYDRIVER_BASE_DOMAIN}`) ||
         hostname.includes("lovable.app");
}

/**
 * Hook that returns domain-aware branding configuration
 * 
 * After domain swap:
 * - drive365.co.uk = Learner site (Drive365 branding)
 * - everydriver.co.uk = Instructor site (EveryDriver branding)
 */
export function useDomainBranding(): DomainBranding {
  return useMemo(() => {
    const onDrive365 = isDrive365Domain();
    const onEveryDriver = isEveryDriverDomain();
    
    // Drive365 = Learners
    if (onDrive365) {
      return {
        brandName: "Drive365",
        logoPath: "/drive365-logo.png",
        isInstructorDomain: false,
        isLearnerDomain: true,
        homeLink: "/",
      };
    }
    
    // EveryDriver = Instructors (default for localhost, lovable.app, etc.)
    return {
      brandName: "EveryDriver",
      logoPath: "/everydriver-logo-full.png",
      isInstructorDomain: true,
      isLearnerDomain: false,
      homeLink: "/",
    };
  }, []);
}

// Export domain check functions for use elsewhere
export { isDrive365Domain, isEveryDriverDomain };
