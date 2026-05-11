import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getWhitelabelConfig, getWhitelabelInstructorSlug } from "@/lib/whitelabel";

/**
 * Canonical-host enforcement for verified instructor custom domains.
 *
 * Once an instructor's `custom_domain` is verified, every visitor must land
 * on the canonical (apex, no-www) form so SEO, analytics and bookmarks all
 * agree. We also strip legacy `/i/{slug}` paths on the custom domain since
 * the entire site already belongs to that instructor — those URLs become
 * the cleaner root-relative equivalent (e.g. `/i/ken-d/about` → `/about`).
 *
 * Hard-redirects (window.location.replace) are used for host changes so the
 * browser's address bar updates and search engines see a 301-equivalent
 * client-side hop. Path-only canonicalisation uses history.replaceState so
 * we don't unmount React.
 *
 * Marketing/staging hosts are skipped — only verified custom-domain hits
 * are touched (cachedConfig has source === "custom-domain").
 */
export function CustomDomainCanonical() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const cfg = getWhitelabelConfig();
    if (!cfg) return; // not a branded host yet, or bare marketing

    const currentHost = window.location.hostname.toLowerCase();
    const canonicalHost = cfg.host; // already lowercased + de-www'd in whitelabel.ts

    // Only enforce on real custom domains (not subdomains of our own brands)
    const isOurSubdomain =
      canonicalHost.endsWith(".everydriver.co.uk") ||
      canonicalHost.endsWith(".drive365.co.uk") ||
      canonicalHost.endsWith(".lovable.app") ||
      canonicalHost.endsWith(".lovableproject.com") ||
      canonicalHost === "localhost";

    // Never bounce the Lovable preview/sandbox out to the live custom domain.
    // The preview iframe runs the latest build; the live custom domain runs
    // the last-published build, so a hard-redirect makes click-through tests
    // silently hit stale code (404s on routes that exist only in preview).
    const isPreviewHost =
      currentHost.endsWith(".lovableproject.com") ||
      currentHost.endsWith(".lovable.app") ||
      currentHost === "localhost" ||
      currentHost === "127.0.0.1";

    if (isOurSubdomain || isPreviewHost) {
      // still set canonical link below
    } else {
      // 1. www → apex redirect (or any non-canonical host)
      if (currentHost !== canonicalHost) {
        const target = `${window.location.protocol}//${canonicalHost}${location.pathname}${location.search}${location.hash}`;
        window.location.replace(target);
        return;
      }
    }

    // 2. Strip /i/{thisInstructorSlug} prefix on the instructor's own domain
    const slug = getWhitelabelInstructorSlug();
    if (slug) {
      const prefix = `/i/${slug}`;
      if (
        location.pathname === prefix ||
        location.pathname.startsWith(`${prefix}/`)
      ) {
        const stripped = location.pathname.slice(prefix.length) || "/";
        window.history.replaceState(
          {},
          "",
          `${stripped}${location.search}${location.hash}`,
        );
      }
    }

    // 3. Maintain a single rel=canonical link tag — always https + canonical host
    // (independent of current host or paused state).
    const canonicalUrl = `https://${canonicalHost}${location.pathname}`;
    let link = document.head.querySelector<HTMLLinkElement>("link[rel='canonical']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = canonicalUrl;
  }, [location.pathname, location.search, location.hash]);

  return null;
}
