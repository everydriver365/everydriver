/**
 * Branded-site (whitelabel + instructor subdomain) configuration.
 *
 * A "branded site" is the full Drive365 learner site rendered with one
 * instructor's logo, name, contact details and data scope. There are two
 * ways a hostname can map to an instructor:
 *
 *   1. Subdomain  →  {app_slug}.everydriver.co.uk  or  {app_slug}.drive365.co.uk
 *   2. Custom domain  →  matches `instructors.custom_domain`
 *      (paid add-on; only counted when `custom_domain_verified = true`)
 *
 * The mapping is loaded once at app boot from the `public_instructors`
 * view by `BrandProvider`, then cached in this module so synchronous
 * callers (`getWhitelabelConfig()`, `useRouteLogo`, etc.) keep working.
 */

import { supabase } from "@/integrations/supabase/client";
import { resolveInstructorBranding } from "@/lib/resolveInstructorBranding";

export interface WhitelabelConfig {
  /** Hostname (lowercase, no www) that this config matches against */
  host: string;
  /** Instructor slug for scoping courses, availability, bookings, reviews */
  instructorSlug: string;
  /** Brand display name used in headers/footers/meta */
  brandName: string;
  /** Logo URL (Supabase Storage or /public path) */
  logoPath: string;
  /** Optional contact details surfaced in headers/footers */
  phone?: string;
  email?: string;
  /** Optional address/area shown in footer */
  address?: string;
  /** Brand primary colour (hex) for theming */
  brandColour?: string;
}

const EVERYDRIVER_HOST_SUFFIX = ".everydriver.co.uk";
const DRIVE365_HOST_SUFFIX = ".drive365.co.uk";
const EVERYDRIVER_PREVIEW_OVERRIDE_KEY = "lovable_everydriver_override";

let cachedConfig: WhitelabelConfig | null | undefined = undefined; // undefined = not loaded yet
let loadPromise: Promise<WhitelabelConfig | null> | null = null;

function normaliseHost(hostname: string): string {
  return hostname.toLowerCase().replace(/^www\./, "");
}

function isLovablePreviewHost(host: string): boolean {
  return host.endsWith(".lovable.app") || host.endsWith(".lovableproject.com");
}

export function isEveryDriverPreviewOverrideActive(
  hostname: string = typeof window !== "undefined" ? window.location.hostname : "",
): boolean {
  if (typeof window === "undefined") return false;

  const host = normaliseHost(hostname);
  if (!isLovablePreviewHost(host)) return false;

  try {
    const pathname = window.location.pathname;
    // Drive365 routes are never EveryDriver, even if the override was set
    // in this session. Visiting any /drive365* path also clears the sticky flag
    // so the rest of the session stays on Drive365 until ?everydriver=1 is used.
    if (pathname === "/drive365" || pathname.startsWith("/drive365/")) {
      window.sessionStorage.removeItem(EVERYDRIVER_PREVIEW_OVERRIDE_KEY);
      return false;
    }

    const params = new URLSearchParams(window.location.search);
    const explicitOverride = params.get("everydriver");

    if (explicitOverride === "1" || explicitOverride === "true") {
      window.sessionStorage.setItem(EVERYDRIVER_PREVIEW_OVERRIDE_KEY, "1");
      return true;
    }

    if (["0", "false", "off"].includes(explicitOverride || "")) {
      window.sessionStorage.removeItem(EVERYDRIVER_PREVIEW_OVERRIDE_KEY);
      return false;
    }

    if (window.sessionStorage.getItem(EVERYDRIVER_PREVIEW_OVERRIDE_KEY) === "1") {
      return true;
    }
  } catch {
    /* ignore storage/query failures */
  }

  return false;
}

/**
 * Hostnames that should be treated as the bare Drive365 / EveryDriver
 * marketing sites — never resolve them to an instructor.
 */
function isBareMarketingHost(host: string): boolean {
  return (
    host === "drive365.co.uk" ||
    host === "everydriver.co.uk" ||
    host === "drivingschoolmanager.co.uk" ||
    host === "driveforall.co.uk" ||
    host === "drivingforall.co.uk" ||
    host === "everydriver.co" ||
    host === "everydriver.lovable.app" ||
    host === "bookings.drive365.co.uk" ||
    host.endsWith(".lovable.app") ||
    host.endsWith(".lovableproject.com") ||
    host === "localhost" ||
    host === "127.0.0.1"
  );
}

/**
 * Extracts a candidate subdomain slug from a hostname like
 * `winchester.everydriver.co.uk` → `winchester`. Returns null if the
 * hostname isn't an instructor subdomain.
 */
function extractSubdomainSlug(host: string): string | null {
  for (const suffix of [EVERYDRIVER_HOST_SUFFIX, DRIVE365_HOST_SUFFIX]) {
    if (host.endsWith(suffix)) {
      const slug = host.slice(0, -suffix.length);
      if (slug && slug !== "www" && slug !== "bookings") return slug;
    }
  }
  return null;
}

function rowToConfig(host: string, row: {
  app_slug: string | null;
  business_name: string | null;
  name: string | null;
  logo_url: string | null;
  phone: string | null;
  email: string | null;
  location_name: string | null;
  home_postcode: string | null;
  brand_colour: string | null;
}): WhitelabelConfig | null {
  if (!row.app_slug) return null;
  return {
    host,
    instructorSlug: row.app_slug,
    brandName: row.business_name?.trim() || row.name || "Driving School",
    logoPath: row.logo_url || "/winchester-logo.png",
    phone: row.phone || undefined,
    email: row.email || undefined,
    address: row.location_name || row.home_postcode || undefined,
    brandColour: row.brand_colour || undefined,
  };
}

/**
 * Resolves the current hostname to an instructor branding config by
 * querying `public_instructors`. Called once on app boot.
 */
export async function loadBrandConfig(
  hostname: string = typeof window !== "undefined" ? window.location.hostname : "",
): Promise<WhitelabelConfig | null> {
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    // Dev/preview override: ?whitelabel=winchesterdrivingschool.co.uk
    let resolveHost = normaliseHost(hostname);
    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams(window.location.search);
        const override = params.get("whitelabel");
        if (override === "off") {
          window.sessionStorage.removeItem("lovable_whitelabel_override");
        } else if (override) {
          window.sessionStorage.setItem("lovable_whitelabel_override", override);
        }
        const stored = window.sessionStorage.getItem("lovable_whitelabel_override");
        if (stored) resolveHost = normaliseHost(stored);
      } catch {
        /* ignore */
      }
    }

    const descriptor = resolveInstructorBranding(resolveHost, "/");

    if (descriptor.source === null) {
      cachedConfig = null;
      return null;
    }

    // Hot path: edge-cached host resolver. Falls back to direct DB query
    // if the function is unreachable (cold start during deploy, etc).
    try {
      const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/resolve-host?host=${encodeURIComponent(resolveHost)}`;
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 2500);
      const res = await fetch(fnUrl, {
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        signal: ctrl.signal,
      });
      clearTimeout(timeout);
      if (res.ok) {
        const json = await res.json();
        if (json?.branding?.instructorSlug) {
          cachedConfig = {
            host: resolveHost,
            instructorSlug: json.branding.instructorSlug,
            brandName: json.branding.brandName || "Driving School",
            logoPath: json.branding.logoUrl || "/winchester-logo.png",
            phone: json.branding.phone || undefined,
            email: json.branding.email || undefined,
            address: json.branding.address || undefined,
            brandColour: json.branding.brandColour || undefined,
          };
          return cachedConfig;
        }
        if (json?.branding === null) {
          cachedConfig = null;
          return null;
        }
      }
    } catch (err) {
      console.warn("[whitelabel] resolve-host edge fn failed, falling back to DB:", err);
    }

    // Fallback: direct DB query
    let query = supabase
      .from("public_instructors")
      .select("app_slug, business_name, name, logo_url, phone, email, location_name, home_postcode, brand_colour");

    if (descriptor.source === "custom-domain" && descriptor.customDomain) {
      query = query.eq("custom_domain", descriptor.customDomain).eq("custom_domain_verified", true);
    } else if (descriptor.slug) {
      query = query.eq("app_slug", descriptor.slug);
    } else {
      cachedConfig = null;
      return null;
    }

    const { data, error } = await query.maybeSingle();

    if (error || !data) {
      cachedConfig = null;
      return null;
    }

    cachedConfig = rowToConfig(resolveHost, data);
    return cachedConfig;
  })();

  return loadPromise;
}

/**
 * Synchronous accessor used throughout the UI. Returns the cached
 * config (null if the host isn't branded). Returns null until
 * `loadBrandConfig()` has finished — call sites are tolerant of that.
 */
export function getWhitelabelConfig(
  _hostname?: string,
): WhitelabelConfig | null {
  return cachedConfig ?? null;
}

export function isWhitelabelDomain(_hostname?: string): boolean {
  return cachedConfig !== null && cachedConfig !== undefined;
}

export function getWhitelabelInstructorSlug(): string | null {
  return cachedConfig?.instructorSlug ?? null;
}

/**
 * Static list of hosts that historically rendered branded sites — used
 * by routing code to enable branded behaviour before the async resolver
 * has finished. Now empty because everything is DB-driven.
 */
export const ALL_WHITELABEL_HOSTS: string[] = [];

/**
 * True when the current hostname is an EveryDriver marketing host. These
 * hosts render the cloned `src/pages/everydriver/*` page set instead of
 * the Drive365 originals (see src/routes/everydriverRoutes.tsx).
 *
 * Lovable preview/sandbox URLs are intentionally excluded so the existing
 * instructor-marketing `HomepageRedesignDemo` remains the default there.
 */
export function isEveryDriverHost(
  hostname: string = typeof window !== "undefined" ? window.location.hostname : "",
): boolean {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  if (
    host === "everydriver.co.uk" ||
    host === "everydriver.co" ||
    host === "everydriver.lovable.app"
  ) {
    return true;
  }
  // Preview override: explicit ?everydriver=1, sticky session flag, or clean
  // /courses preview route used by the EveryDriver clone.
  if (isEveryDriverPreviewOverrideActive(hostname)) return true;
  return false;
}
