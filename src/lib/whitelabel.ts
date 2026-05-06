/**
 * Whitelabel domain configuration.
 *
 * A whitelabel domain renders the full Drive365 learner site (same pages,
 * same booking & pupil-login flows) but rebranded and scoped to a single
 * instructor's data.
 */

export interface WhitelabelConfig {
  /** Hostname (lowercase, no www) that this config matches against */
  host: string;
  /** Instructor slug for scoping courses, availability, bookings, reviews */
  instructorSlug: string;
  /** Brand display name used in headers/footers/meta */
  brandName: string;
  /** Logo path served from /public */
  logoPath: string;
  /** Optional contact details surfaced in headers/footers */
  phone?: string;
  email?: string;
}

const WHITELABEL_CONFIGS: WhitelabelConfig[] = [
  {
    host: "winchesterdrivingschool.co.uk",
    instructorSlug: "ken-d",
    brandName: "Winchester Driving School",
    logoPath: "/winchester-logo.png",
  },
];

function normaliseHost(hostname: string): string {
  return hostname.toLowerCase().replace(/^www\./, "");
}

export function getWhitelabelConfig(
  hostname: string = typeof window !== "undefined" ? window.location.hostname : "",
): WhitelabelConfig | null {
  const host = normaliseHost(hostname);
  return WHITELABEL_CONFIGS.find((c) => c.host === host) ?? null;
}

export function isWhitelabelDomain(
  hostname: string = typeof window !== "undefined" ? window.location.hostname : "",
): boolean {
  return getWhitelabelConfig(hostname) !== null;
}

export function getWhitelabelInstructorSlug(): string | null {
  return getWhitelabelConfig()?.instructorSlug ?? null;
}

export const ALL_WHITELABEL_HOSTS: string[] = WHITELABEL_CONFIGS.flatMap((c) => [
  c.host,
  `www.${c.host}`,
]);
