import { useEffect } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface SEOHeadProps {
  title?: string;
  description?: string;
}

export function SEOHead({ title, description }: SEOHeadProps) {
  const { getSetting, loading } = useSiteSettings();

  useEffect(() => {
    if (loading) return;

    // Set document title
    const siteTitle = title || getSetting("site_title") || "EveryDriver";
    document.title = siteTitle;

    // Set meta description
    const metaDescription = description || getSetting("meta_description");
    let descriptionMeta = document.querySelector('meta[name="description"]');
    if (!descriptionMeta) {
      descriptionMeta = document.createElement("meta");
      descriptionMeta.setAttribute("name", "description");
      document.head.appendChild(descriptionMeta);
    }
    descriptionMeta.setAttribute("content", metaDescription);

    // Set Open Graph tags
    const ogTitle = getSetting("og_title") || siteTitle;
    const ogDescription = getSetting("og_description") || metaDescription;
    const ogImage = getSetting("og_image_url");

    setMetaTag("og:title", ogTitle);
    setMetaTag("og:description", ogDescription);
    if (ogImage) setMetaTag("og:image", ogImage);
    setMetaTag("og:type", "website");

    // Set Twitter tags
    const twitterHandle = getSetting("twitter_handle");
    setMetaTag("twitter:card", "summary_large_image");
    setMetaTag("twitter:title", ogTitle);
    setMetaTag("twitter:description", ogDescription);
    if (ogImage) setMetaTag("twitter:image", ogImage);
    if (twitterHandle) setMetaTag("twitter:site", `@${twitterHandle}`);

  }, [loading, title, description, getSetting]);

  return null;
}

function setMetaTag(property: string, content: string) {
  const isOg = property.startsWith("og:");
  const selector = isOg 
    ? `meta[property="${property}"]` 
    : `meta[name="${property}"]`;
  
  let meta = document.querySelector(selector);
  
  if (!meta) {
    meta = document.createElement("meta");
    if (isOg) {
      meta.setAttribute("property", property);
    } else {
      meta.setAttribute("name", property);
    }
    document.head.appendChild(meta);
  }
  
  meta.setAttribute("content", content);
}
