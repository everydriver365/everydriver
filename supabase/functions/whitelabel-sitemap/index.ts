// Per-whitelabel XML sitemap.
// Usage:
//   GET /functions/v1/whitelabel-sitemap?host=winchesterdrivingschool.co.uk
// The host is resolved to a single instructor (custom-domain or app_slug)
// and a sitemap of public learner-facing routes for that brand is returned,
// including /courses and /book/<instructorId> URLs per configured service area.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const STATIC_PATHS = ["/", "/courses", "/reviews", "/contact", "/about"];

/**
 * Towns/villages within ~70-mile radius of Winchester (Hampshire) used to
 * surface localised /courses and /book URLs in the sitemap so each area we
 * cover gets its own indexable entry.
 */
const AREAS_BY_HOST: Record<string, string[]> = {
  "winchesterdrivingschool.co.uk": [
    "Winchester", "Eastleigh", "Romsey", "Chandler's Ford", "Bishop's Waltham",
    "Twyford", "Kings Worthy", "Alresford", "Andover", "Basingstoke",
    "Alton", "Petersfield", "Whitchurch", "Stockbridge", "Fareham",
    "Gosport", "Portsmouth", "Havant", "Waterlooville", "Cosham",
    "Southampton", "Totton", "Hedge End", "Hythe", "Lyndhurst",
    "Lymington", "New Milton", "Brockenhurst", "Ringwood", "Fordingbridge",
    "Salisbury", "Amesbury", "Wilton", "Tidworth", "Ludgershall",
    "Hook", "Fleet", "Farnborough", "Aldershot", "Camberley",
    "Bordon", "Liphook", "Haslemere", "Midhurst", "Chichester",
    "Bognor Regis", "Arundel", "Worthing", "Bournemouth", "Poole",
    "Christchurch", "Wimborne Minster", "Verwood", "Ferndown", "Blandford Forum",
    "Dorchester", "Weymouth", "Newport", "Cowes", "Ryde",
    "Sandown", "Shanklin", "Newbury", "Thatcham", "Reading",
    "Wokingham", "Bracknell", "Guildford", "Godalming", "Farnham",
  ],
};

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

function urlEntry(loc: string, lastmod: string, priority: string, changefreq = "weekly"): string {
  return `<url><loc>${escapeXml(loc)}</loc><lastmod>${lastmod}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
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

  // Bookable courses for this instructor (best-effort)
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
    urls.push(urlEntry(base + p, lastUpdated, p === "/" ? "1.0" : "0.8"));
  }
  for (const c of courseSlugs) {
    urls.push(urlEntry(base + c.slug, c.lastmod, "0.6"));
  }

  // Per-area localised URLs:
  //   /areas/<slug>            → dedicated location landing page
  //   /courses?area=<Area>     → bookable courses filtered by area
  //   /book/<id>?area=<Area>   → booking flow seeded with area context
  const areas = AREAS_BY_HOST[host] || [];
  const slugify = (s: string) =>
    s.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  for (const area of areas) {
    const a = encodeURIComponent(area);
    urls.push(urlEntry(`${base}/areas/${slugify(area)}`, lastUpdated, "0.8"));
    urls.push(urlEntry(`${base}/courses?area=${a}`, lastUpdated, "0.7"));
    if (instructorId) {
      urls.push(urlEntry(`${base}/book/${instructorId}?area=${a}`, lastUpdated, "0.5"));
    }
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
