import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Domain configurations - SWAPPED
// drive365.co.uk = Learner site
// everydriver.co.uk = Instructor site
const DRIVE365_DOMAINS = ["drive365.co.uk", "www.drive365.co.uk"];
const EVERYDRIVER_DOMAINS = ["everydriver.co.uk", "www.everydriver.co.uk", "everydriver.lovable.app"];
const ACCESSIBLE_DOMAINS = ["driveforall.co.uk", "www.driveforall.co.uk"];
const EVERYDRIVER_BASE_DOMAIN = "everydriver.co.uk";
const DRIVE365_BASE_DOMAIN = "drive365.co.uk";
const ACCESSIBLE_BASE_DOMAIN = "driveforall.co.uk";
const BOOKING_SUBDOMAIN = "bookings.drive365.co.uk";

// Routes that belong to instructors (hosted on everydriver.co.uk)
const INSTRUCTOR_ROUTE_PREFIXES = [
  "/instructor",
  "/instructor-app",
  "/install-instructor",
];

// Routes explicitly allowed on drive365.co.uk (learner site)
const LEARNER_ALLOWED_ROUTES = [
  "/courses",
  "/pupil",
  "/p/",
  "/parent",
  "/booking",
  "/theory",
  "/book/",              // Booking flow
  "/booking-confirmation",
  "/intensives",
  "/semi-intensive",
  "/availability/",      // Public availability calendar
  "/sign/",              // Remote signing
  "/i/",                 // Mini-website path routes (public)
  "/drive365",           // Drive365 homepage
  "/learner-app/",       // Learner app routes
  "/benefits",           // Benefits page
  "/instructor-app/login", // Instructor login page
  "/instructor",         // Instructor portal (used after login)
  "/admin/login",        // Admin login page
  "/drive365/franchise", // Franchise recruitment page
  "/franchise",          // Franchise recruitment page (legacy)
  "/accessible",         // Drive365 Accessible hub
];

// Routes that should stay on their current domain (shared routes)
const SHARED_ROUTES = [
  "/", // Root path - handled by ConditionalHome, never redirect
  "/.well-known", // Apple Pay domain verification - must not redirect
  
  "/privacy-policy",
  "/terms-of-service",
  "/about",
  "/contact",
  "/faqs",
  "/faq",
  "/help",
  "/services",
  "/reviews",
  "/benefits",
  "/admin",
];

// Custom domain to instructor slug mappings
const CUSTOM_DOMAIN_SLUGS: Record<string, string> = {
  "winchesterdrivingschool.co.uk": "ken-d",
  "www.winchesterdrivingschool.co.uk": "ken-d",
};

/**
 * Extracts instructor slug from subdomain or custom domain if present
 * e.g., "jane-smith.everydriver.co.uk" returns "jane-smith"
 * e.g., "winchesterdrivingschool.co.uk" returns "ken-d"
 * Returns null if no subdomain/custom domain or if it's www
 */
export function getInstructorSubdomain(): string | null {
  const hostname = window.location.hostname.toLowerCase();
  
  // Check custom domain mappings first
  if (CUSTOM_DOMAIN_SLUGS[hostname]) {
    return CUSTOM_DOMAIN_SLUGS[hostname];
  }
  
  // Check if it's a drive365 subdomain (e.g. jane-smith.drive365.co.uk)
  if (hostname.endsWith(`.${DRIVE365_BASE_DOMAIN}`)) {
    const subdomain = hostname.replace(`.${DRIVE365_BASE_DOMAIN}`, "");
    if (subdomain && subdomain !== "www" && subdomain !== "bookings") {
      return subdomain;
    }
  }
  
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
  // Exclude accessible domain (which contains "drive365" as a substring)
  if (hostname.includes(ACCESSIBLE_BASE_DOMAIN)) return false;
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
 * Checks if the current hostname is the Drive365 Accessible domain
 */
export function isAccessibleDomain(): boolean {
  const hostname = window.location.hostname.toLowerCase();
  return ACCESSIBLE_DOMAINS.some(domain => hostname === domain || hostname === domain.replace("www.", ""));
}

/**
 * Checks if the current hostname is an instructor subdomain (mini-website)
 */
export function isInstructorSubdomain(): boolean {
  return getInstructorSubdomain() !== null;
}

/**
 * Checks if the current hostname is the bookings subdomain
 */
export function isBookingSubdomain(): boolean {
  const hostname = window.location.hostname.toLowerCase();
  return hostname === BOOKING_SUBDOMAIN || hostname === `www.${BOOKING_SUBDOMAIN}`;
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
 * Checks if a path is allowed on Drive365 (learner route)
 */
function isLearnerAllowedRoute(pathname: string): boolean {
  return LEARNER_ALLOWED_ROUTES.some(prefix => pathname.startsWith(prefix));
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

    // Booking subdomain: only allow booking-related routes
    if (isBookingSubdomain()) {
      const BOOKING_ALLOWED = ["/courses", "/book/", "/booking-confirmation"];
      const isAllowed = BOOKING_ALLOWED.some(prefix => pathname.startsWith(prefix));
      
      if (pathname === "/") {
        console.log('[DomainRouter] Booking subdomain root, redirecting to /courses');
        window.location.href = `/courses${search}`;
        return;
      }
      
      if (!isAllowed) {
        console.log('[DomainRouter] Blocked route on booking subdomain, redirecting to /courses:', pathname);
        window.location.href = "/courses";
        return;
      }
      return;
    }

    // Don't redirect from instructor subdomains (mini-websites)
    if (isInstructorSubdomain()) {
      console.log('[DomainRouter] Instructor subdomain, no redirect');
      return;
    }

    const onDrive365 = isDrive365Domain();
    const onEveryDriver = isEveryDriverDomain();
    const onAccessible = isAccessibleDomain();
    
    console.log('[DomainRouter] Domain check:', { 
      hostname: window.location.hostname,
      pathname,
      onDrive365, 
      onEveryDriver,
      onAccessible,
    });

    // Accessible domain - only allow root + /accessible/* + auth + shared routes
    if (onAccessible) {
      const isAccessibleRoute = pathname === "/" || pathname.startsWith("/accessible");
      const isShared = SHARED_ROUTES.some(route => pathname === route || pathname.startsWith(route + "/"));
      const isAuthRoute = pathname.startsWith("/pupil/login") || pathname.startsWith("/admin/login");
      if (!isAccessibleRoute && !isShared && !isAuthRoute) {
        console.log('[DomainRouter] Non-accessible route on Accessible domain, redirecting to Drive365:', fullPath);
        window.location.href = `https://drive365.co.uk${fullPath}`;
        return;
      }
      return;
    }

    // Drive365 = Learner site - redirect /accessible/* to Accessible domain
    if (onDrive365) {
      if (pathname.startsWith("/accessible")) {
        console.log('[DomainRouter] Redirecting /accessible from Drive365 to Accessible domain:', fullPath);
        window.location.href = `https://driveforall.co.uk${fullPath}`;
        return;
      }
      const isShared = SHARED_ROUTES.some(route => pathname === route || pathname.startsWith(route + "/"));
      const isAllowedOnDrive365 = isLearnerAllowedRoute(pathname) || isShared;
      
      if (!isAllowedOnDrive365) {
        console.log('[DomainRouter] Non-learner route on Drive365, redirecting to EveryDriver:', fullPath);
        window.location.href = `https://everydriver.co.uk${fullPath}`;
        return;
      }
    } 
    // EveryDriver = Instructor site - redirect learner + accessible routes
    else if (onEveryDriver) {
      if (pathname.startsWith("/accessible")) {
        console.log('[DomainRouter] Redirecting /accessible from EveryDriver to Accessible domain:', fullPath);
        window.location.href = `https://drive365accessible.co.uk${fullPath}`;
        return;
      }
      if (isLearnerAllowedRoute(pathname)) {
        console.log('[DomainRouter] Redirecting learner route from EveryDriver to Drive365:', fullPath);
        window.location.href = `https://drive365.co.uk${fullPath}`;
        return;
      }
    }
  }, [location.pathname, location.search]);

  return null;
}
