// Edge-cached host → instructor branding resolver. Hot path for all branded sites.
// Cached in-memory per Deno isolate (5 min TTL). Returns minimal branding payload.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CachedEntry {
  expires: number;
  // null = host has no branding (negative cache)
  data: BrandingPayload | null;
}

interface BrandingPayload {
  instructorSlug: string;
  brandName: string;
  logoUrl: string | null;
  brandColour: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, CachedEntry>();

function normaliseHost(h: string): string {
  return (h || "").toLowerCase().replace(/^www\./, "").trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const host = normaliseHost(url.searchParams.get("host") || "");

  if (!host) {
    return new Response(JSON.stringify({ error: "host required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const now = Date.now();
  const cached = cache.get(host);
  if (cached && cached.expires > now) {
    return new Response(JSON.stringify({ host, branding: cached.data, cached: true }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Try custom domain first, then subdomain extraction
  const subdomainMatch = host.match(/^([^.]+)\.(everydriver|drive365)\.co\.uk$/);
  let payload: BrandingPayload | null = null;

  const cols = "app_slug, business_name, name, logo_url, brand_colour, phone, email, location_name, home_postcode";

  if (subdomainMatch && subdomainMatch[1] !== "www" && subdomainMatch[1] !== "bookings") {
    const { data } = await supabase
      .from("public_instructors")
      .select(cols)
      .eq("app_slug", subdomainMatch[1])
      .maybeSingle();
    if (data?.app_slug) {
      payload = {
        instructorSlug: data.app_slug,
        brandName: (data.business_name?.trim() || data.name || "Driving School") as string,
        logoUrl: data.logo_url ?? null,
        brandColour: data.brand_colour ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
        address: (data.location_name || data.home_postcode) ?? null,
      };
    }
  } else {
    const { data } = await supabase
      .from("public_instructors")
      .select(cols)
      .eq("custom_domain", host)
      .eq("custom_domain_verified", true)
      .maybeSingle();
    if (data?.app_slug) {
      payload = {
        instructorSlug: data.app_slug,
        brandName: (data.business_name?.trim() || data.name || "Driving School") as string,
        logoUrl: data.logo_url ?? null,
        brandColour: data.brand_colour ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
        address: (data.location_name || data.home_postcode) ?? null,
      };
    }
  }

  cache.set(host, { expires: now + CACHE_TTL_MS, data: payload });

  return new Response(JSON.stringify({ host, branding: payload, cached: false }), {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
});
