import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { getWhitelabelConfig } from "@/lib/whitelabel";

interface SEOHeadProps {
  title?: string;
  description?: string;
  /** When true, emits <meta name="robots" content="noindex,follow"> */
  noindex?: boolean;
  /** og:type override — defaults to "website". Use "article" for news posts. */
  type?: "website" | "article";
  /** Page-specific image override for og:image / twitter:image. */
  image?: string;
  /** Optional JSON-LD payload(s) injected into <head>. */
  jsonLd?: { id: string; data: Record<string, unknown> } | Array<{ id: string; data: Record<string, unknown> }>;
}

/**
 * Single source of truth for <head> SEO across the public site.
 *
 * On a whitelabel host (e.g. winchesterdrivingschool.co.uk) it overrides
 * the marketing defaults with brand-specific title/description/OG and
 * injects a `LocalBusiness` (DrivingSchool) JSON-LD block plus
 * geo + hreflang + canonical hints so search engines treat the site as
 * a distinct local UK driving school rather than a Drive365 duplicate.
 */
export function SEOHead({ title, description, noindex }: SEOHeadProps) {
  const { getSetting, loading } = useSiteSettings();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    const wl = getWhitelabelConfig();
    const isWL = !!wl;

    // ---------- Title ----------
    const baseSiteTitle = wl?.brandName || getSetting("site_title") || "EveryDriver";
    const pageTitle = title
      ? (isWL ? `${title} | ${wl!.brandName}` : title)
      : isWL
        ? `${wl!.brandName} — Driving Lessons & Intensive Courses${wl!.address ? ` in ${cityFromAddress(wl!.address)}` : ""}`
        : baseSiteTitle;
    document.title = pageTitle;

    // ---------- Description ----------
    const fallbackDesc = isWL
      ? `Book driving lessons and intensive courses with ${wl!.brandName}${wl!.address ? ` in ${cityFromAddress(wl!.address)}` : ""}. DVSA-qualified instructor, flexible payments and fast test-ready courses.`
      : getSetting("meta_description") ||
        "Book driving lessons with qualified instructors in your area. Intensive courses, weekly lessons and flexible payment options.";
    const metaDescription = description || fallbackDesc;

    setMetaTag("description", metaDescription, "name");

    // ---------- Robots ----------
    if (noindex) {
      setMetaTag("robots", "noindex,follow", "name");
    } else {
      setMetaTag("robots", "index,follow", "name");
    }

    // ---------- Open Graph / Twitter ----------
    const ogTitle = isWL ? pageTitle : (getSetting("og_title") || pageTitle);
    const ogDescription = isWL ? metaDescription : (getSetting("og_description") || metaDescription);
    const ogImage = isWL
      ? absoluteUrl(wl!.logoPath)
      : getSetting("og_image_url");

    setMetaTag("og:title", ogTitle, "property");
    setMetaTag("og:description", ogDescription, "property");
    setMetaTag("og:type", "website", "property");
    setMetaTag("og:locale", "en_GB", "property");
    setMetaTag("og:site_name", baseSiteTitle, "property");
    if (ogImage) setMetaTag("og:image", ogImage, "property");
    // Always advertise the canonical branded URL on whitelabel hosts (even when paused
    // or visited via www/preview), so social shares + crawlers see the same address.
    const canonicalOrigin = isWL ? `https://${wl!.host}` : window.location.origin;
    setMetaTag("og:url", `${canonicalOrigin}${location.pathname}`, "property");

    setMetaTag("twitter:card", "summary_large_image", "name");
    setMetaTag("twitter:title", ogTitle, "name");
    setMetaTag("twitter:description", ogDescription, "name");
    if (ogImage) setMetaTag("twitter:image", ogImage, "name");
    const twitterHandle = getSetting("twitter_handle");
    if (twitterHandle && !isWL) setMetaTag("twitter:site", `@${twitterHandle}`, "name");

    // ---------- Whitelabel-only signals ----------
    if (isWL) {
      // html lang
      try { document.documentElement.setAttribute("lang", "en-GB"); } catch { /* noop */ }

      const city = cityFromAddress(wl!.address || "");
      if (city) {
        setMetaTag("geo.placename", city, "name");
        setMetaTag("geo.region", "GB", "name");
      }

      // Canonical + hreflang alternates → always the branded apex host over https,
      // regardless of paused state, www variant, or preview origin.
      const canonicalHref = `https://${wl!.host}${location.pathname}`;
      upsertLink("canonical", canonicalHref);
      upsertLink("alternate", canonicalHref, "en-GB");
      upsertLink("alternate", canonicalHref, "x-default");

      // Per-whitelabel sitemap (covers /courses + booking URLs per service area).
      upsertSitemapLink(
        `https://qyqeibovdhyohkfagujv.supabase.co/functions/v1/whitelabel-sitemap?host=${encodeURIComponent(wl!.host)}`,
      );

      // LocalBusiness / DrivingSchool JSON-LD
      const ld: Record<string, unknown> = {
        "@context": "https://schema.org",
        "@type": "DrivingSchool",
        name: wl!.brandName,
        url: `https://${wl!.host}/`,
        image: ogImage || undefined,
        logo: absoluteUrl(wl!.logoPath),
        telephone: wl!.phone || undefined,
        email: wl!.email || undefined,
        priceRange: "££",
        areaServed: city ? { "@type": "City", name: city } : undefined,
        address: wl!.address
          ? {
              "@type": "PostalAddress",
              addressCountry: "GB",
              addressLocality: city || undefined,
              postalCode: postcodeFromAddress(wl!.address) || undefined,
            }
          : undefined,
      };
      injectJsonLd("wl-localbusiness", ld);
    } else {
      removeJsonLd("wl-localbusiness");
      removeLink("alternate", "en-GB");
      removeLink("alternate", "x-default");
    }
  }, [loading, title, description, noindex, location.pathname, getSetting]);

  return null;
}

// ---------- helpers ----------

function setMetaTag(name: string, content: string, attr: "name" | "property") {
  const selector = `meta[${attr}="${name}"]`;
  let meta = document.head.querySelector<HTMLMetaElement>(selector);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(attr, name);
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", content);
}

function upsertLink(rel: string, href: string, hreflang?: string) {
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]`;
  let link = document.head.querySelector<HTMLLinkElement>(selector);
  if (!link) {
    link = document.createElement("link");
    link.rel = rel;
    if (hreflang) link.setAttribute("hreflang", hreflang);
    document.head.appendChild(link);
  }
  link.href = href;
}

function removeLink(rel: string, hreflang: string) {
  const link = document.head.querySelector(`link[rel="${rel}"][hreflang="${hreflang}"]`);
  if (link) link.remove();
}

function upsertSitemapLink(href: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="sitemap"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "sitemap";
    link.type = "application/xml";
    document.head.appendChild(link);
  }
  link.href = href;
}

function injectJsonLd(id: string, data: Record<string, unknown>) {
  // Strip undefined values for a clean payload
  const cleaned = JSON.parse(JSON.stringify(data));
  let script = document.getElementById(id) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = id;
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(cleaned);
}

function removeJsonLd(id: string) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function absoluteUrl(path: string): string {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** UK postcode regex (loose, full-postcode form). */
const UK_POSTCODE_RE = /\b([A-Z]{1,2}\d[A-Z\d]?)\s*\d[A-Z]{2}\b/i;

function postcodeFromAddress(address: string): string | null {
  const m = address.match(UK_POSTCODE_RE);
  return m ? m[0].toUpperCase() : null;
}

function cityFromAddress(address: string): string {
  if (!address) return "";
  // Strip a trailing UK postcode if present, then take the last comma-segment.
  const noPc = address.replace(UK_POSTCODE_RE, "").trim().replace(/,\s*$/, "");
  const parts = noPc.split(",").map((s) => s.trim()).filter(Boolean);
  return parts[parts.length - 1] || noPc;
}
