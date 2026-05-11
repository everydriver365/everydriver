// Sitemap index: lists paginated child sitemaps. Supports >50k URLs at scale.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PAGE_SIZE_INSTRUCTORS = 1000; // 1000 instructors × 5 pages = 5000 URLs/sitemap

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { count, error } = await supabase
    .from("instructors")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true)
    .not("app_slug", "is", null);

  if (error) {
    return new Response("Error counting instructors", { status: 500, headers: corsHeaders });
  }

  const total = count || 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE_INSTRUCTORS));
  const today = new Date().toISOString().split("T")[0];
  const baseUrl = `${supabaseUrl}/functions/v1/mini-website-sitemap`;

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  for (let p = 1; p <= pages; p++) {
    xml += `  <sitemap>\n    <loc>${baseUrl}?page=${p}</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>\n`;
  }
  xml += `</sitemapindex>`;

  return new Response(xml, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
});
