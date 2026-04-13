import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch all active instructors with slugs
  const { data: instructors, error } = await supabase
    .from("instructors")
    .select("app_slug, custom_domain, updated_at")
    .eq("is_active", true)
    .not("app_slug", "is", null);

  if (error) {
    return new Response("Error fetching instructors", { status: 500, headers: corsHeaders });
  }

  const pages = ["", "/about", "/services", "/reviews", "/contact", "/courses"];
  const today = new Date().toISOString().split("T")[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  for (const inst of instructors || []) {
    if (!inst.app_slug) continue;
    const domain = inst.custom_domain || `${inst.app_slug}.drive365.co.uk`;
    const lastmod = inst.updated_at ? inst.updated_at.split("T")[0] : today;

    for (const page of pages) {
      xml += `  <url>
    <loc>https://${domain}${page}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page === "" ? "weekly" : "monthly"}</changefreq>
    <priority>${page === "" ? "1.0" : "0.7"}</priority>
  </url>
`;
    }
  }

  xml += `</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
});
