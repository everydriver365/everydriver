/**
 * Single source of truth for "which instructor owns this page?".
 *
 * Maps a (hostname, pathname) pair → an instructor lookup descriptor.
 * Three sources, in priority order:
 *
 *   1. Verified custom domain   →  matches `instructors.custom_domain`
 *   2. Subdomain                →  `{slug}.everydriver.co.uk` / `.drive365.co.uk`
 *   3. Path-based               →  `/i/{slug}/...`
 *
 * The actual DB query lives in `useInstructorBranding`; this file is
 * pure so it can be reused server-side, in tests, and by SEO helpers.
 */

export type BrandingSource = "custom-domain" | "subdomain" | "path" | null;

export interface BrandingDescriptor {
  /** Where the resolution came from (null = bare marketing site) */
  source: BrandingSource;
  /** Instructor slug to look up (null when source is `custom-domain`) */
  slug: string | null;
  /** Custom domain hostname to look up (when source is `custom-domain`) */
  customDomain: string | null;
  /** Normalised hostname used for the resolution */
  host: string;
}

const EVERYDRIVER_SUFFIX = ".everydriver.co.uk";
const DRIVE365_SUFFIX = ".drive365.co.uk";

const BARE_MARKETING_HOSTS = new Set([
  "drive365.co.uk",
  "everydriver.co.uk",
  "everydriver.co",
  "drivingschoolmanager.co.uk",
  "driveforall.co.uk",
  "drivingforall.co.uk",
  "bookings.drive365.co.uk",
  "everydriver.lovable.app",
  "localhost",
  "127.0.0.1",
]);

function normaliseHost(hostname: string): string {
  return hostname.toLowerCase().replace(/^www\./, "");
}

function isBareMarketingHost(host: string): boolean {
  return (
    BARE_MARKETING_HOSTS.has(host) ||
    host.endsWith(".lovable.app") ||
    host.endsWith(".lovableproject.com")
  );
}

function extractSubdomainSlug(host: string): string | null {
  for (const suffix of [EVERYDRIVER_SUFFIX, DRIVE365_SUFFIX]) {
    if (host.endsWith(suffix)) {
      const slug = host.slice(0, -suffix.length);
      if (slug && slug !== "www" && slug !== "bookings") return slug;
    }
  }
  return null;
}

function extractPathSlug(pathname: string): string | null {
  const match = pathname.match(/^\/i\/([^/?#]+)/);
  return match ? match[1] : null;
}

export function resolveInstructorBranding(
  hostname: string = typeof window !== "undefined" ? window.location.hostname : "",
  pathname: string = typeof window !== "undefined" ? window.location.pathname : "/",
): BrandingDescriptor {
  const host = normaliseHost(hostname);

  // Path-based always wins when present — it's an explicit override
  // (e.g. an admin browsing `/i/ken-d` from the bare marketing host).
  const pathSlug = extractPathSlug(pathname);
  if (pathSlug) {
    return { source: "path", slug: pathSlug, customDomain: null, host };
  }

  if (!host || isBareMarketingHost(host)) {
    return { source: null, slug: null, customDomain: null, host };
  }

  const subdomainSlug = extractSubdomainSlug(host);
  if (subdomainSlug) {
    return { source: "subdomain", slug: subdomainSlug, customDomain: null, host };
  }

  // Anything else that isn't a bare marketing host is treated as a
  // candidate verified custom domain — the DB lookup confirms it.
  return { source: "custom-domain", slug: null, customDomain: host, host };
}
