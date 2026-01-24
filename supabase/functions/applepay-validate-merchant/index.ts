import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ValidateReq {
  validationURL: string;
  domainName: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body: ValidateReq = await req.json();
    if (!body.validationURL || !body.domainName) {
      return new Response(JSON.stringify({ error: "Missing validationURL/domainName" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const merchantIdentifier = Deno.env.get("APPLE_PAY_MERCHANT_ID");
    const displayName = Deno.env.get("APPLE_PAY_DISPLAY_NAME") ?? "EveryDriver";

    if (!merchantIdentifier) {
      return new Response(JSON.stringify({ error: "Apple Pay merchant ID not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // NOTE: Apple merchant validation typically requires mTLS with merchant identity cert.
    // If Supabase Edge Functions cannot attach client certs, this call may fail.
    // In that case, move this endpoint to a Node service that supports mTLS.

    const payload = {
      merchantIdentifier,
      displayName,
      initiative: "web",
      initiativeContext: body.domainName,
    };

    const resp = await fetch(body.validationURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      console.error("Apple Pay validation failed:", resp.status, errorText);
      return new Response(JSON.stringify({ error: "Apple Pay validation failed", details: errorText }), {
        status: resp.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await resp.json();

    return new Response(JSON.stringify(json), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Apple Pay validation error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Apple Pay validation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
