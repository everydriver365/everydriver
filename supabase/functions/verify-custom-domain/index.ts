// Verifies an instructor's custom domain by:
// 1) checking A/CNAME points to Lovable IP (185.158.133.1)
// 2) checking the TXT record _lovable contains the instructor's verification token
// Updates the instructor row with dns_status / status_message / last_checked_at.
//
// POST { instructor_id?: uuid }  // if omitted, uses caller's instructor row
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LOVABLE_IP = "185.158.133.1";
const TXT_HOST_PREFIX = "_lovable";

async function dohQuery(name: string, type: "A" | "TXT" | "CNAME"): Promise<string[]> {
  // Cloudflare DoH
  const res = await fetch(
    `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`,
    { headers: { Accept: "application/dns-json" } },
  );
  if (!res.ok) return [];
  const json = await res.json();
  if (!json?.Answer) return [];
  return (json.Answer as Array<{ data: string; type: number }>).map((a) =>
    (a.data || "").replace(/^"|"$/g, "").replace(/\\"/g, '"'),
  );
}

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

  let body: { instructor_id?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body ok */
  }

  const admin = createClient(supabaseUrl, supabaseService);

  // Resolve instructor row: explicit param (admins) or caller's own
  let instructorId = body.instructor_id || null;
  if (!instructorId) {
    const { data: ownInstr } = await admin
      .from("instructors")
      .select("id")
      .eq("auth_user_id", userResp.user.id)
      .maybeSingle();
    instructorId = ownInstr?.id || null;
  }
  if (!instructorId) {
    return new Response(JSON.stringify({ error: "Instructor not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: instr, error: iErr } = await admin
    .from("instructors")
    .select("id, custom_domain, custom_domain_verification_token")
    .eq("id", instructorId)
    .maybeSingle();

  if (iErr || !instr) {
    return new Response(JSON.stringify({ error: "Instructor not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const domain = (instr.custom_domain || "").trim().toLowerCase();
  if (!domain) {
    return new Response(JSON.stringify({ error: "No custom_domain set on instructor" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const token = instr.custom_domain_verification_token || "";
  if (!token) {
    return new Response(JSON.stringify({ error: "No verification token set; regenerate via add-custom-domain" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const apex = domain.replace(/^www\./, "");
  const checks: Record<string, { ok: boolean; expected: string; found: string[] }> = {};

  // A record on apex
  const aRecords = await dohQuery(apex, "A");
  checks.apex_a = {
    ok: aRecords.includes(LOVABLE_IP),
    expected: LOVABLE_IP,
    found: aRecords,
  };

  // A or CNAME on www
  const wwwA = await dohQuery(`www.${apex}`, "A");
  const wwwC = await dohQuery(`www.${apex}`, "CNAME");
  checks.www = {
    ok: wwwA.includes(LOVABLE_IP) || wwwC.length > 0,
    expected: `${LOVABLE_IP} (A) or CNAME → ${apex}`,
    found: [...wwwA, ...wwwC],
  };

  // TXT record _lovable.<apex>
  const txtRecords = await dohQuery(`${TXT_HOST_PREFIX}.${apex}`, "TXT");
  const expectedTxt = `lovable_verify=${token}`;
  checks.txt = {
    ok: txtRecords.some((t) => t.includes(token) || t === expectedTxt),
    expected: expectedTxt,
    found: txtRecords,
  };

  const allOk = checks.apex_a.ok && checks.txt.ok;
  const dnsStatus = allOk ? "verified" : "pending";
  const statusMessage = allOk
    ? "DNS records verified."
    : [
        !checks.apex_a.ok && `Apex A record must point to ${LOVABLE_IP} (found: ${checks.apex_a.found.join(", ") || "none"}).`,
        !checks.txt.ok && `TXT record _lovable.${apex} must contain ${expectedTxt}.`,
      ]
        .filter(Boolean)
        .join(" ");

  // Update row: only flip custom_domain_verified when DNS verified.
  const updates: Record<string, unknown> = {
    custom_domain_dns_status: dnsStatus,
    custom_domain_status_message: statusMessage,
    custom_domain_last_checked_at: new Date().toISOString(),
  };
  if (allOk) {
    updates.custom_domain_verified = true;
    // SSL is provisioned by Lovable infra after DNS verification — mark pending until known
    updates.custom_domain_ssl_status = "pending";
  }

  await admin.from("instructors").update(updates).eq("id", instructorId);

  return new Response(
    JSON.stringify({
      domain,
      dns_status: dnsStatus,
      verified: allOk,
      message: statusMessage,
      checks,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
