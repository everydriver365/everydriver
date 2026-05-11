// Adds or replaces an instructor's custom_domain and (re)generates a verification token.
// POST { domain: string }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DOMAIN_RE = /^(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,63}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabaseService = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userClient = createClient(supabaseUrl, supabaseAnon, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userResp } = await userClient.auth.getUser();
  if (!userResp?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: { domain?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let domain = (body.domain || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (domain.startsWith("www.")) domain = domain.slice(4);

  if (!DOMAIN_RE.test(domain)) {
    return new Response(JSON.stringify({ error: "Invalid domain format" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(supabaseUrl, supabaseService);

  // Find instructor for caller
  const { data: instr } = await admin
    .from("instructors")
    .select("id")
    .eq("auth_user_id", userResp.user.id)
    .maybeSingle();

  if (!instr) {
    return new Response(JSON.stringify({ error: "Instructor not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Reject if domain already verified by another instructor
  const { data: clash } = await admin
    .from("instructors")
    .select("id")
    .eq("custom_domain", domain)
    .eq("custom_domain_verified", true)
    .neq("id", instr.id)
    .maybeSingle();
  if (clash) {
    return new Response(JSON.stringify({ error: "Domain already in use by another account" }), {
      status: 409,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Generate token via DB function
  const { data: tokenRow } = await admin.rpc("generate_domain_verification_token");
  const token = (tokenRow as unknown as string) || `lovable_${crypto.randomUUID().replace(/-/g, "")}`;

  await admin
    .from("instructors")
    .update({
      custom_domain: domain,
      custom_domain_verification_token: token,
      custom_domain_dns_status: "pending",
      custom_domain_ssl_status: "pending",
      custom_domain_verified: false,
      custom_domain_added_at: new Date().toISOString(),
      custom_domain_last_checked_at: null,
      custom_domain_status_message: "Awaiting DNS records.",
    })
    .eq("id", instr.id);

  return new Response(
    JSON.stringify({
      domain,
      verification_token: token,
      records: [
        { type: "A", name: "@", value: "185.158.133.1" },
        { type: "A", name: "www", value: "185.158.133.1" },
        { type: "TXT", name: "_lovable", value: `lovable_verify=${token}` },
      ],
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
