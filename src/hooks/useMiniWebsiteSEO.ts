import { useEffect } from "react";

interface SEOInstructor {
  id: string;
  name: string;
  business_name?: string | null;
  app_slug: string;
  logo_url?: string | null;
  profile_image_url?: string | null;
  phone?: string | null;
  email?: string | null;
  home_postcode?: string;
  bio?: string | null;
}

interface MiniWebsiteSEOOptions {
  instructor: SEOInstructor;
  pageTitle?: string;
  pageDescription?: string;
  /** Override from instructor_website_pages.meta_title */
  metaTitle?: string | null;
  /** Override from instructor_website_pages.meta_description */
  metaDescription?: string | null;
}

function setMetaTag(attr: "name" | "property", key: string, content: string) {
  const selector = `meta[${attr}="${key}"]`;
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLinkTag(rel: string, href: string) {
  const selector = `link[rel="${rel}"]`;
  let el = document.querySelector(selector) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function useMiniWebsiteSEO({ instructor, pageTitle, pageDescription, metaTitle, metaDescription }: MiniWebsiteSEOOptions) {
  useEffect(() => {
    const businessName = instructor.business_name || instructor.name;
    const page = pageTitle || "Home";
    const slug = instructor.app_slug;

    // Title — prefer page-level meta_title override from admin
    const title = metaTitle
      || (page === "Home"
        ? `${businessName} | Driving Lessons | Drive365`
        : `${page} - ${businessName} | Drive365`);
    document.title = title;

    // Description — prefer page-level meta_description override from admin
    const description = metaDescription
      || pageDescription
      || instructor.bio
      || `${businessName} - Professional driving lessons${instructor.home_postcode ? ` in ${instructor.home_postcode}` : ""}. Book your driving course today with Drive365.`;
    const truncatedDesc = description.length > 160 ? description.slice(0, 157) + "..." : description;

    setMetaTag("name", "description", truncatedDesc);

    // OG tags
    const ogImage = instructor.logo_url || instructor.profile_image_url || "";
    setMetaTag("property", "og:title", title);
    setMetaTag("property", "og:description", truncatedDesc);
    setMetaTag("property", "og:type", "website");
    if (ogImage) setMetaTag("property", "og:image", ogImage);

    // Twitter tags
    setMetaTag("name", "twitter:card", ogImage ? "summary_large_image" : "summary");
    setMetaTag("name", "twitter:title", title);
    setMetaTag("name", "twitter:description", truncatedDesc);
    if (ogImage) setMetaTag("name", "twitter:image", ogImage);

    // Canonical URL — use the drive365 subdomain as canonical
    const pagePath = page === "Home" ? "" : `/${page.toLowerCase()}`;
    const canonicalUrl = `https://${slug}.drive365.co.uk${pagePath}`;
    setMetaTag("property", "og:url", canonicalUrl);
    setLinkTag("canonical", canonicalUrl);

    // JSON-LD LocalBusiness structured data
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": businessName,
      "description": truncatedDesc,
      "url": canonicalUrl,
      ...(ogImage && { "image": ogImage }),
      ...(instructor.phone && { "telephone": instructor.phone }),
      ...(instructor.email && { "email": instructor.email }),
      ...(instructor.home_postcode && {
        "address": {
          "@type": "PostalAddress",
          "postalCode": instructor.home_postcode,
          "addressCountry": "GB",
        },
      }),
      "additionalType": "https://schema.org/DrivingSchool",
    };

    let scriptEl = document.querySelector('script[data-mini-website-seo]') as HTMLScriptElement | null;
    if (!scriptEl) {
      scriptEl = document.createElement("script");
      scriptEl.type = "application/ld+json";
      scriptEl.setAttribute("data-mini-website-seo", "true");
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify(jsonLd);

    // Cleanup on unmount
    return () => {
      const script = document.querySelector('script[data-mini-website-seo]');
      if (script) script.remove();
    };
  }, [instructor, pageTitle, pageDescription, metaTitle, metaDescription]);
}
