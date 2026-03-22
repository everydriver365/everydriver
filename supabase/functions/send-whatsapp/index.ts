import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { to, message, template } = await req.json();

    if (!to || !message) {
      return new Response(JSON.stringify({ error: "Missing 'to' or 'message'" }), { status: 400, headers: corsHeaders });
    }

    const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_BUSINESS_TOKEN");
    const WHATSAPP_PHONE_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

    if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
      // WhatsApp not configured — fall back to SMS via Twilio
      console.log("WhatsApp not configured, falling back to SMS");
      
      const TWILIO_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
      const TWILIO_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
      const TWILIO_FROM = Deno.env.get("TWILIO_PHONE_NUMBER");
      const TWILIO_MSG_SID = Deno.env.get("TWILIO_MESSAGING_SERVICE_SID");

      if (!TWILIO_SID || !TWILIO_TOKEN) {
        return new Response(JSON.stringify({ error: "Neither WhatsApp nor SMS is configured" }), {
          status: 503, headers: corsHeaders,
        });
      }

      const params = new URLSearchParams();
      if (TWILIO_MSG_SID) {
        params.append("MessagingServiceSid", TWILIO_MSG_SID);
      } else if (TWILIO_FROM) {
        params.append("From", TWILIO_FROM);
      }
      params.append("To", to);
      params.append("Body", message);

      const smsRes = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: "Basic " + btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`),
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        }
      );
      const smsData = await smsRes.json();

      return new Response(JSON.stringify({ sent_via: "sms", sid: smsData.sid }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send via WhatsApp Business Cloud API
    const waRes = await fetch(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: to.replace(/\D/g, ""),
          type: "text",
          text: { body: message },
        }),
      }
    );

    const waData = await waRes.json();
    if (!waRes.ok) {
      console.error("WhatsApp API error:", waData);
      return new Response(JSON.stringify({ error: "WhatsApp send failed", details: waData }), {
        status: 500, headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ sent_via: "whatsapp", message_id: waData.messages?.[0]?.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-whatsapp error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: corsHeaders,
    });
  }
});
