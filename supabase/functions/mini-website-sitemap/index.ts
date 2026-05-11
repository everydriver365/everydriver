// Paginated mini-site sitemap. ?page=N returns up to 1000 instructors × 5 pages = 5000 URLs.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PAGE_SIZE = 1000; // instructors per sitemap page

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: instructors, error } = await supabase
    .from("instructors")
    .select("app_slug, custom_domain, custom_domain_verified, updated_at")
    .eq("is_active", true)
    .not("app_slug", "is", null)
    .order("app_slug")
    .range(from, to);

  if (error) {
    return new Response("Error fetching instructors", { status: 500, headers: corsHeaders });
  }

  const pages = ["", "/about", "/services", "/reviews", "/contact"];
  const today = new Date().toISOString().split("T")[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  for (const inst of instructors || []) {
    if (!inst.app_slug) continue;
    const domain = (inst.custom_domain && inst.custom_domain_verified)
      ? inst.custom_domain
      : `${inst.app_slug}.drive365.co.uk`;
    const lastmod = inst.updated_at ? String(inst.updated_at).split("T")[0] : today;

    for (const path of pages) {
      xml += `  <url>\n    <loc>https://${domain}${path}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${path === "" ? "weekly" : "monthly"}</changefreq>\n    <priority>${path === "" ? "1.0" : "0.7"}</priority>\n  </url>\n`;
    }
  }

  xml += `</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
});
