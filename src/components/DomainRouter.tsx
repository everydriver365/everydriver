import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Domain configurations - SWAPPED
// drive365.co.uk = Learner site
// everydriver.co.uk = Instructor site
const DRIVE365_DOMAINS = ["drive365.co.uk", "www.drive365.co.uk"];
const EVERYDRIVER_DOMAINS = ["everydriver.co.uk", "www.everydriver.co.uk", "everydriver.lovable.app"];
const EVERYDRIVER_BASE_DOMAIN = "everydriver.co.uk";

// Routes that belong to instructors (hosted on everydriver.co.uk)
const INSTRUCTOR_ROUTE_PREFIXES = [
  "/instructor",
  "/instructor-app",
  "/install-instructor",
];

// Routes that belong to learners (hosted on drive365.co.uk)
const LEARNER_ROUTE_PREFIXES = [
  "/courses",
  "/pupil",
  "/p/",
  "/parent",
  "/booking",
  "/theory",
];

// Routes that should stay on their current domain (shared routes)
const SHARED_ROUTES = [
  "/", // Root path - handled by ConditionalHome, never redirect
  "/.well-known", // Apple Pay domain verification - must not redirect
  "/calendar-callback", // OAuth callback - must stay on originating domain
  "/privacy-policy",
  "/terms-of-service",
  "/about",
  "/contact",
  "/faqs",
  "/faq",
  "/help",
];

/**
 * Extracts instructor slug from subdomain if present
 * e.g., "jane-smith.everydriver.co.uk" returns "jane-smith"
 * Returns null if no subdomain or if it's www
 */
export function getInstructorSubdomain(): string | null {
  const hostname = window.location.hostname.toLowerCase();
  
  // Check if it's an everydriver subdomain
  if (hostname.endsWith(`.${EVERYDRIVER_BASE_DOMAIN}`)) {
    const subdomain = hostname.replace(`.${EVERYDRIVER_BASE_DOMAIN}`, "");
    // Ignore www subdomain
    if (subdomain && subdomain !== "www") {
      return subdomain;
    }
  }
  
  return null;
}

/**
 * Checks if the current hostname is a Drive365 domain (LEARNER site)
 */
export function isDrive365Domain(): boolean {
  const hostname = window.location.hostname.toLowerCase();
  return DRIVE365_DOMAINS.some(domain => hostname.includes(domain.replace("www.", "")));
}

/**
 * Checks if the current hostname is an EveryDriver domain (INSTRUCTOR site)
 */
export function isEveryDriverDomain(): boolean {
  const hostname = window.location.hostname.toLowerCase();
  return EVERYDRIVER_DOMAINS.some(domain => hostname.includes(domain.replace("www.", ""))) || 
         hostname.endsWith(`.${EVERYDRIVER_BASE_DOMAIN}`) ||
         hostname.includes("lovable.app");
}

/**
 * Checks if the current hostname is an instructor subdomain (mini-website)
 */
export function isInstructorSubdomain(): boolean {
  return getInstructorSubdomain() !== null;
}

/**
 * Checks if we're in local development
 */
function isLocalhost(): boolean {
  const hostname = window.location.hostname.toLowerCase();
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname.includes("192.168.");
}

/**
 * Checks if a path is an instructor route
 */
function isInstructorRoute(pathname: string): boolean {
  return INSTRUCTOR_ROUTE_PREFIXES.some(prefix => pathname.startsWith(prefix));
}

/**
 * Checks if a path is a learner route
 */
function isLearnerRoute(pathname: string): boolean {
  return LEARNER_ROUTE_PREFIXES.some(prefix => pathname.startsWith(prefix));
}

/**
 * Checks if a path is a shared route that shouldn't redirect
 */
function isSharedRoute(pathname: string): boolean {
  return SHARED_ROUTES.some(route => pathname === route || pathname.startsWith(route + "/"));
}

/**
 * DomainRouter component handles cross-domain redirects
 * 
 * SWAPPED CONFIGURATION:
 * - drive365.co.uk serves LEARNER routes only
 * - everydriver.co.uk serves INSTRUCTOR routes only
 * - localhost allows all routes (no redirects)
 */
export function DomainRouter() {
  const location = useLocation();

  useEffect(() => {
    // Skip redirects in development
    if (isLocalhost()) {
      return;
    }

    const pathname = location.pathname;
    const search = location.search;
    const fullPath = pathname + search;

    // Don't redirect shared routes
    if (isSharedRoute(pathname)) {
      console.log('[DomainRouter] Shared route, no redirect:', pathname);
      return;
    }

    // Don't redirect from instructor subdomains (mini-websites)
    if (isInstructorSubdomain()) {
      console.log('[DomainRouter] Instructor subdomain, no redirect');
      return;
    }

    const onDrive365 = isDrive365Domain();
    const onEveryDriver = isEveryDriverDomain();
    
    console.log('[DomainRouter] Domain check:', { 
      hostname: window.location.hostname,
      pathname,
      onDrive365, 
      onEveryDriver 
    });

    // SWAPPED LOGIC:
    // Drive365 = Learner site - redirect instructor routes to EveryDriver
    if (onDrive365) {
      if (isInstructorRoute(pathname)) {
        console.log('[DomainRouter] Redirecting instructor route from Drive365 to EveryDriver:', fullPath);
        window.location.href = `https://everydriver.co.uk${fullPath}`;
        return;
      }
    } 
    // EveryDriver = Instructor site - redirect learner routes to Drive365
    else if (onEveryDriver) {
      if (isLearnerRoute(pathname)) {
        console.log('[DomainRouter] Redirecting learner route from EveryDriver to Drive365:', fullPath);
        window.location.href = `https://drive365.co.uk${fullPath}`;
        return;
      }
    }
  }, [location.pathname, location.search]);

  return null;
}
