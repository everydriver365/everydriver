// Daily health check for every active instructor mini-site.
// Records results to public.mini_site_health. Triggered by pg_cron.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const REQUIRED_PAGES = ["home", "about", "services", "reviews", "contact"];
const LOVABLE_IPS = new Set(["185.158.133.1"]);

async function dnsResolves(host: string): Promise<{ ok: boolean; ip?: string }> {
  try {
    const records = await Deno.resolveDns(host, "A");
    const ip = records[0];
    return { ok: !!ip, ip };
  } catch {
    return { ok: false };
  }
}

async function httpOk(url: string): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(url, { method: "HEAD", redirect: "follow", signal: ctrl.signal });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: instructors, error } = await supabase
    .from("instructors")
    .select("id, app_slug, custom_domain, custom_domain_verified")
    .eq("is_active", true);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const results: Array<Record<string, unknown>> = [];

  for (const inst of instructors || []) {
    const slugOk = !!inst.app_slug;

    // Pages check
    let pagesOk = false;
    let missing: string[] = [];
    if (slugOk) {
      const { data: pages } = await supabase
        .from("instructor_website_pages")
        .select("page_type, is_published")
        .eq("instructor_id", inst.id);
      const present = new Set((pages || []).filter((p) => p.is_published).map((p) => p.page_type));
      missing = REQUIRED_PAGES.filter((p) => !present.has(p));
      pagesOk = missing.length === 0;
    }

    // Domain checks (only if a custom domain configured)
    let dnsOk: boolean | null = null;
    let sslOk: boolean | null = null;
    let domainOk: boolean | null = null;
    if (inst.custom_domain) {
      const dns = await dnsResolves(inst.custom_domain);
      dnsOk = dns.ok && (!dns.ip || LOVABLE_IPS.has(dns.ip));
      sslOk = await httpOk(`https://${inst.custom_domain}`);
      domainOk = dnsOk && sslOk && !!inst.custom_domain_verified;
    }

    // Render check (subdomain canonical)
    const renderOk = slugOk
      ? await httpOk(`https://${inst.app_slug}.drive365.co.uk`)
      : false;

    let status: "green" | "amber" | "red" = "green";
    if (!slugOk || !pagesOk) status = "red";
    else if (inst.custom_domain && (!dnsOk || !sslOk)) status = "amber";
    else if (!renderOk) status = "amber";

    results.push({
      instructor_id: inst.id,
      checked_at: new Date().toISOString(),
      slug_ok: slugOk,
      pages_ok: pagesOk,
      pages_missing: missing,
      domain_ok: domainOk,
      dns_ok: dnsOk,
      ssl_ok: sslOk,
      render_ok: renderOk,
      status,
    });
  }

  // Upsert results
  if (results.length) {
    const { error: upErr } = await supabase
      .from("mini_site_health")
      .upsert(results, { onConflict: "instructor_id" });
    if (upErr) {
      return new Response(JSON.stringify({ error: upErr.message, processed: results.length }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  return new Response(JSON.stringify({
    processed: results.length,
    green: results.filter((r) => r.status === "green").length,
    amber: results.filter((r) => r.status === "amber").length,
    red: results.filter((r) => r.status === "red").length,
  }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
