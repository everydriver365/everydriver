import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Domain configurations
const DRIVE365_DOMAINS = ["drive365.co.uk", "www.drive365.co.uk"];
const EVERYDRIVER_DOMAIN = "everydriver.lovable.app";

// Routes that belong to Drive365 (instructor platform)
const INSTRUCTOR_ROUTE_PREFIXES = [
  "/instructor",
  "/instructor-app",
  "/install-instructor",
];

// Routes that should stay on their current domain (shared routes)
const SHARED_ROUTES = [
  "/calendar-callback", // OAuth callback - must stay on originating domain
  "/privacy-policy",
  "/terms-of-service",
];

/**
 * Checks if the current hostname is a Drive365 domain
 */
export function isDrive365Domain(): boolean {
  const hostname = window.location.hostname.toLowerCase();
  return DRIVE365_DOMAINS.some(domain => hostname.includes(domain.replace("www.", "")));
}

/**
 * Checks if the current hostname is the EveryDriver domain
 */
export function isEveryDriverDomain(): boolean {
  const hostname = window.location.hostname.toLowerCase();
  return hostname.includes("everydriver") || hostname.includes("lovable.app");
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
 * Checks if a path is a shared route that shouldn't redirect
 */
function isSharedRoute(pathname: string): boolean {
  return SHARED_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * DomainRouter component handles cross-domain redirects
 * - drive365.co.uk serves instructor routes only
 * - everydriver.lovable.app serves learner routes only
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
      return;
    }

    // On Drive365 domain
    if (isDrive365Domain()) {
      // Root path "/" is handled by the conditional route in App.tsx
      // so we don't redirect it here
      if (pathname === "/") {
        return;
      }

      // If NOT an instructor route, redirect to EveryDriver
      if (!isInstructorRoute(pathname)) {
        window.location.href = `https://${EVERYDRIVER_DOMAIN}${fullPath}`;
        return;
      }
    }

    // On EveryDriver domain
    if (isEveryDriverDomain()) {
      // If it's an instructor route, redirect to Drive365
      if (isInstructorRoute(pathname)) {
        window.location.href = `https://drive365.co.uk${fullPath}`;
        return;
      }
    }
  }, [location.pathname, location.search]);

  return null;
}
