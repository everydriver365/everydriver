// Per-whitelabel XML sitemap.
// Usage:
//   GET /functions/v1/whitelabel-sitemap?host=winchesterdrivingschool.co.uk
// The host is resolved to a single instructor (custom-domain or app_slug)
// and a sitemap of public learner-facing routes for that brand is returned.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const STATIC_PATHS = ["/", "/courses", "/reviews", "/contact", "/about"];

function normaliseHost(h: string): string {
  return (h || "").toLowerCase().replace(/^www\./, "").trim();
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const hostParam = url.searchParams.get("host") || req.headers.get("x-forwarded-host") || "";
  const host = normaliseHost(hostParam);

  if (!host) {
    return new Response("Missing host", {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Resolve host → instructor (custom domain first, then app_slug subdomain)
  let instructorId: string | null = null;
  let lastUpdated = new Date().toISOString();

  const { data: byCustom } = await supabase
    .from("instructors")
    .select("id, updated_at")
    .eq("custom_domain", host)
    .eq("custom_domain_verified", true)
    .eq("is_active", true)
    .maybeSingle();

  if (byCustom) {
    instructorId = byCustom.id;
    lastUpdated = byCustom.updated_at || lastUpdated;
  } else {
    // Try app_slug subdomain like ken-d.everydriver.co.uk
    const slug = host.split(".")[0];
    if (slug) {
      const { data: bySlug } = await supabase
        .from("instructors")
        .select("id, updated_at")
        .eq("app_slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      if (bySlug) {
        instructorId = bySlug.id;
        lastUpdated = bySlug.updated_at || lastUpdated;
      }
    }
  }

  // Pull bookable courses for this instructor (best-effort; tolerate schema differences).
  const courseSlugs: { slug: string; lastmod: string }[] = [];
  if (instructorId) {
    const { data: courses } = await supabase
      .from("courses")
      .select("id, hours, updated_at")
      .eq("instructor_id", instructorId)
      .limit(100);
    if (courses) {
      for (const c of courses) {
        if (c.hours != null) {
          courseSlugs.push({
            slug: `/courses?hours=${encodeURIComponent(String(c.hours))}`,
            lastmod: (c as { updated_at?: string }).updated_at || lastUpdated,
          });
        }
      }
    }
  }

  const base = `https://${host}`;
  const urls: string[] = [];

  for (const p of STATIC_PATHS) {
    urls.push(
      `<url><loc>${escapeXml(base + p)}</loc><lastmod>${lastUpdated}</lastmod><changefreq>weekly</changefreq><priority>${p === "/" ? "1.0" : "0.8"}</priority></url>`,
    );
  }
  for (const c of courseSlugs) {
    urls.push(
      `<url><loc>${escapeXml(base + c.slug)}</loc><lastmod>${c.lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>`,
    );
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
});
