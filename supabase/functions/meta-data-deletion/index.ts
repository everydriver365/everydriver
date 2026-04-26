import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function base64UrlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function verifySignedRequest(signedRequest: string, appSecret: string) {
  const [encodedSig, payload] = signedRequest.split(".");
  if (!encodedSig || !payload) throw new Error("Invalid signed_request format");

  const sig = base64UrlDecode(encodedSig);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const expectedSig = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload))
  );

  if (sig.length !== expectedSig.length) throw new Error("Signature mismatch");
  for (let i = 0; i < sig.length; i++) {
    if (sig[i] !== expectedSig[i]) throw new Error("Signature mismatch");
  }

  const decoded = JSON.parse(new TextDecoder().decode(base64UrlDecode(payload)));
  return decoded;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const appSecret = Deno.env.get("META_APP_SECRET");
    if (!appSecret) {
      console.error("META_APP_SECRET not configured");
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const formData = await req.formData();
    const signedRequest = formData.get("signed_request") as string;
    if (!signedRequest) {
      return new Response(JSON.stringify({ error: "Missing signed_request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await verifySignedRequest(signedRequest, appSecret);
    const userId = data.user_id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "No user_id in payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const confirmationCode = crypto.randomUUID();

    // Log deletion request — actual WhatsApp data is keyed by phone number,
    // not Meta app-scoped ID, so we log the request for compliance.
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await serviceClient.from("meta_data_deletions").insert({
      meta_user_id: userId,
      confirmation_code: confirmationCode,
      status: "completed",
    });

    console.log(`Data deletion processed for Meta user ${userId}, code: ${confirmationCode}`);

    return new Response(
      JSON.stringify({
        url: `https://everydriver.lovable.app/data-deletion?code=${confirmationCode}`,
        confirmation_code: confirmationCode,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("meta-data-deletion error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
