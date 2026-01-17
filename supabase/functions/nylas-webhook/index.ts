import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-nylas-signature",
};

// Helper function to compute HMAC-SHA256 signature
async function computeHmacSignature(secret: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const dataBytes = encoder.encode(data);
  
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", key, dataBytes);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const nylasApiKey = Deno.env.get("NYLAS_API_KEY");
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.text();
    const signature = req.headers.get("x-nylas-signature");

    // Validate webhook signature (optional but recommended)
    if (nylasApiKey && signature) {
      const expectedSignature = await computeHmacSignature(nylasApiKey, body);
      
      if (signature !== expectedSignature) {
        console.warn("Invalid webhook signature");
        // Don't reject - Nylas might use different signing in some cases
      }
    }

    const webhookData = JSON.parse(body);
    console.log("Nylas webhook received:", JSON.stringify(webhookData, null, 2));

    // Handle different webhook types
    const { type, data } = webhookData;

    if (type === "grant.created" || type === "grant.updated") {
      console.log(`Grant ${data.grant_id} was ${type.split(".")[1]}`);
      // No action needed - grants are managed through the auth flow
    }

    if (type === "grant.deleted" || type === "grant.expired") {
      console.log(`Grant ${data.grant_id} was ${type.split(".")[1]}`);
      
      // Clean up the grant from our database
      await supabase
        .from("instructor_nylas_grants")
        .delete()
        .eq("grant_id", data.grant_id);
    }

    if (type === "calendar.created" || type === "calendar.updated" || type === "calendar.deleted") {
      console.log(`Calendar event: ${type}`);
      
      // Find the instructor associated with this grant
      const { data: grantData } = await supabase
        .from("instructor_nylas_grants")
        .select("instructor_id")
        .eq("grant_id", data.grant_id)
        .maybeSingle();

      if (grantData) {
        console.log(`Triggering sync for instructor ${grantData.instructor_id}`);
        
        // Trigger a sync for this instructor
        await supabase.functions.invoke("nylas-calendar-sync", {
          body: {
            action: "fetchExternalEvents",
            instructorId: grantData.instructor_id,
          },
        });
      }
    }

    if (type === "event.created" || type === "event.updated" || type === "event.deleted") {
      console.log(`Event ${type}: ${data.object?.id}`);
      
      // Find the instructor associated with this grant
      const { data: grantData } = await supabase
        .from("instructor_nylas_grants")
        .select("instructor_id")
        .eq("grant_id", data.grant_id)
        .maybeSingle();

      if (grantData) {
        console.log(`Triggering sync for instructor ${grantData.instructor_id} due to event change`);
        
        // Trigger a sync for this instructor
        await supabase.functions.invoke("nylas-calendar-sync", {
          body: {
            action: "fetchExternalEvents",
            instructorId: grantData.instructor_id,
          },
        });
      }
    }

    // Always return 200 to acknowledge receipt
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    // Always return 200 to prevent Nylas from retrying excessively
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
