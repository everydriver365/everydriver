import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  const page = url.searchParams.get("page") || "home";

  if (!slug) {
    return new Response("Missing slug parameter", { status: 400, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch instructor
  const { data: instructor, error: instErr } = await supabase
    .from("instructors")
    .select("id, name, business_name, app_slug, logo_url, profile_image_url, phone, email, home_postcode, bio, custom_domain")
    .eq("app_slug", slug)
    .maybeSingle();

  if (instErr || !instructor) {
    return new Response("Instructor not found", { status: 404, headers: corsHeaders });
  }

  // Fetch page-level meta overrides
  let pageMeta: { meta_title: string | null; meta_description: string | null; hero_heading: string | null } | null = null;
  if (page !== "home") {
    const { data } = await supabase
      .from("instructor_website_pages")
      .select("meta_title, meta_description, hero_heading")
      .eq("instructor_id", instructor.id)
      .eq("page_type", page)
      .eq("is_published", true)
      .maybeSingle();
    pageMeta = data;
  }

  const businessName = instructor.business_name || instructor.name;
  const pageTitle = page === "home" ? "Home" : (pageMeta?.hero_heading || page.charAt(0).toUpperCase() + page.slice(1));

  // Title
  const title = pageMeta?.meta_title
    || (page === "home"
      ? `${businessName} | Driving Lessons | Drive365`
      : `${pageTitle} - ${businessName} | Drive365`);

  // Description
  const rawDesc = pageMeta?.meta_description
    || instructor.bio
    || `${businessName} - Professional driving lessons${instructor.home_postcode ? ` in ${instructor.home_postcode}` : ""}. Book your driving course today with Drive365.`;
  const description = rawDesc.length > 160 ? rawDesc.slice(0, 157) + "..." : rawDesc;

  const ogImage = instructor.logo_url || instructor.profile_image_url || "";

  // Canonical: use subdomain if custom_domain set, else path-based
  const domain = instructor.custom_domain || `${slug}.drive365.co.uk`;
  const pagePath = page === "home" ? "" : `/${page}`;
  const canonicalUrl = `https://${domain}${pagePath}`;

  // Redirect URL to the actual SPA
  const spaUrl = `https://everydriver.lovable.app/i/${slug}${pagePath}`;

  // JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: businessName,
    description,
    url: canonicalUrl,
    ...(ogImage && { image: ogImage }),
    ...(instructor.phone && { telephone: instructor.phone }),
    ...(instructor.email && { email: instructor.email }),
    ...(instructor.home_postcode && {
      address: {
        "@type": "PostalAddress",
        postalCode: instructor.home_postcode,
        addressCountry: "GB",
      },
    }),
    additionalType: "https://schema.org/DrivingSchool",
  };

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">

  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
  ${ogImage ? `<meta property="og:image" content="${escapeHtml(ogImage)}">` : ""}

  <meta name="twitter:card" content="${ogImage ? "summary_large_image" : "summary"}">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  ${ogImage ? `<meta name="twitter:image" content="${escapeHtml(ogImage)}">` : ""}

  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>

  <!-- Redirect human visitors to the SPA -->
  <meta http-equiv="refresh" content="0;url=${escapeHtml(spaUrl)}">
</head>
<body>
  <h1>${escapeHtml(businessName)}</h1>
  <p>${escapeHtml(description)}</p>
  <p><a href="${escapeHtml(spaUrl)}">Visit ${escapeHtml(businessName)}</a></p>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
});
