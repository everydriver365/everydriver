import { useEffect } from "react";

/**
 * /sitemap.xml redirector for branded (whitelabel) hosts.
 *
 * Hard-redirects the browser to the per-host XML sitemap edge function so
 * `https://<brand>.co.uk/sitemap.xml` returns the brand's actual sitemap
 * even though the SPA owns the route. Crawlers that respect the
 * `Sitemap:` directive in robots.txt should already use the direct edge
 * function URL — this is the human/Search-Console fallback.
 */
export default function SitemapRedirect() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const host = window.location.hostname;
    const target = `${supabaseUrl}/functions/v1/whitelabel-sitemap?host=${encodeURIComponent(host)}`;
    window.location.replace(target);
  }, []);

  return null;
}
